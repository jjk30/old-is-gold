# Old Is Gold API — single source of truth Lambda handler.
#
# Handles profiles, users, workout plans, progress, nutrition, and a server-side
# YouTube search proxy. Backed by DynamoDB.
#
# Security model:
#   * Every request (except CORS preflight) must carry a Firebase ID token in the
#     Authorization header. We verify it and derive the caller's uid from the
#     VERIFIED token — never from the URL path or request body.
#   * Writes use explicit field allow-lists (no put_item(Item=raw_body)).
#   * Reads/deletes are rejected unless the path uid matches the token uid.

import json
import os
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

import auth

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("oldisgold-users")
plans_table = dynamodb.Table("oldisgold-plans")
progress_table = dynamodb.Table("oldisgold-progress")
profiles_table = dynamodb.Table("oldisgold-profiles")

# Origins allowed to call the API. Production plus local dev servers.
ALLOWED_ORIGINS = {
    "https://oldisgold.fit",
    "https://www.oldisgold.fit",
    "http://localhost:3000",
    "http://localhost:5173",
}
DEFAULT_ORIGIN = "https://oldisgold.fit"

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

def decimal_default(obj):
    """DynamoDB returns Decimals; convert them for JSON serialization."""
    if isinstance(obj, Decimal):
        return float(obj) if obj % 1 else int(obj)
    raise TypeError


def get_header(event, name):
    """Case-insensitive header lookup across API Gateway v1/v2 events."""
    headers = event.get("headers") or {}
    name_lower = name.lower()
    for key, value in headers.items():
        if key.lower() == name_lower:
            return value
    return None


def cors_headers(origin):
    """Build CORS headers, echoing the request origin only if allow-listed."""
    allow_origin = origin if origin in ALLOWED_ORIGINS else DEFAULT_ORIGIN
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Vary": "Origin",
    }


def respond(status_code, body, headers):
    return {
        "statusCode": status_code,
        "headers": headers,
        "body": json.dumps(body, default=decimal_default),
    }


def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


def utc_today():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def valid_date(value):
    """Return a client-supplied YYYY-MM-DD date if well-formed, else UTC today."""
    if isinstance(value, str) and len(value) == 10:
        try:
            datetime.strptime(value, "%Y-%m-%d")
            return value
        except ValueError:
            pass
    return utc_today()


def query_all(table, user_id):
    """Query every item for a user_id, following pagination past the 1 MB cap."""
    items = []
    kwargs = {"KeyConditionExpression": Key("user_id").eq(user_id)}
    while True:
        response = table.query(**kwargs)
        items.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key
    return items


def pick(source, allowed_fields):
    """Return only the allow-listed fields present in source (mass-assignment guard)."""
    return {field: source[field] for field in allowed_fields if field in source}


# --------------------------------------------------------------------------- #
# Workout plan generation
# --------------------------------------------------------------------------- #

EXERCISES = {
    "beginner": [
        {"name": "Seated Arm Raises", "reps": "10 each arm", "duration": "2 min", "instructions": "Raise arms slowly overhead"},
        {"name": "Ankle Circles", "reps": "10 each foot", "duration": "2 min", "instructions": "Rotate ankles in circles"},
        {"name": "Seated Marching", "reps": "20 steps", "duration": "3 min", "instructions": "Lift knees while seated"},
        {"name": "Neck Stretches", "reps": "5 each side", "duration": "2 min", "instructions": "Gentle neck rotations"},
    ],
    "intermediate": [
        {"name": "Standing Leg Raises", "reps": "10 each", "duration": "3 min", "instructions": "Hold chair, lift leg to side"},
        {"name": "Wall Push-ups", "reps": "10", "duration": "3 min", "instructions": "Push-ups against wall"},
        {"name": "Heel-to-Toe Walk", "reps": "20 steps", "duration": "3 min", "instructions": "Walk in straight line"},
        {"name": "Calf Raises", "reps": "15", "duration": "2 min", "instructions": "Rise on toes, hold chair"},
    ],
    "advanced": [
        {"name": "Squats with Chair", "reps": "10", "duration": "3 min", "instructions": "Squat to chair height"},
        {"name": "Standing Marches", "reps": "30", "duration": "3 min", "instructions": "March in place with arm swing"},
        {"name": "Side Steps", "reps": "10 each side", "duration": "3 min", "instructions": "Step side to side"},
        {"name": "Standing Balance", "reps": "30 sec each leg", "duration": "2 min", "instructions": "Stand on one leg"},
    ],
}


def generate_plan(user_id, fitness_level):
    selected = EXERCISES.get(fitness_level, EXERCISES["beginner"])
    total_duration = sum(int(e["duration"].split()[0]) for e in selected)
    return {
        "user_id": user_id,
        "exercises": selected,
        "duration_minutes": total_duration,
        "difficulty": fitness_level or "beginner",
        "created_at": utc_now_iso(),
    }


# --------------------------------------------------------------------------- #
# YouTube proxy (keeps the billable API key server-side)
# --------------------------------------------------------------------------- #

def youtube_search(query):
    if not YOUTUBE_API_KEY:
        raise RuntimeError("YOUTUBE_API_KEY not configured")
    params = urllib.parse.urlencode({
        "part": "snippet",
        "q": f"{query} senior exercise tutorial",
        "type": "video",
        "maxResults": 1,
        "videoDuration": "medium",
        "key": YOUTUBE_API_KEY,
    })
    url = f"https://www.googleapis.com/youtube/v3/search?{params}"
    with urllib.request.urlopen(url, timeout=5) as resp:
        data = json.loads(resp.read())
    items = data.get("items") or []
    if not items:
        return None
    video = items[0]
    return {
        "videoId": video["id"]["videoId"],
        "title": video["snippet"]["title"],
        "thumbnail": video["snippet"]["thumbnails"]["high"]["url"],
        "channelTitle": video["snippet"]["channelTitle"],
    }


# --------------------------------------------------------------------------- #
# Handler
# --------------------------------------------------------------------------- #

def lambda_handler(event, context):
    origin = get_header(event, "Origin")
    headers = cors_headers(origin)

    method = (event.get("httpMethod")
              or event.get("requestContext", {}).get("http", {}).get("method", ""))
    path = (event.get("path")
            or event.get("rawPath")
            or event.get("requestContext", {}).get("http", {}).get("path", ""))

    # API Gateway includes the stage name in some integrations; strip it.
    if path.startswith("/prod"):
        path = path[len("/prod"):]
    if not path:
        path = "/"

    # CORS preflight needs no auth.
    if method == "OPTIONS":
        return respond(200, {}, headers)

    if path == "/health" or path == "/":
        return respond(200, {"status": "healthy"}, headers)

    try:
        # ---- Authenticate: derive uid from the verified token only. ----------
        try:
            claims = auth.verify_token(get_header(event, "Authorization"))
        except auth.AuthError as e:
            return respond(e.status_code, {"error": e.message}, headers)
        uid = claims["uid"]

        parts = [p for p in path.split("/") if p]  # e.g. ['progress', '<id>']
        resource = parts[0] if parts else ""

        # ---- YouTube proxy (any authenticated user) --------------------------
        if resource == "youtube" and method == "GET":
            qs = event.get("queryStringParameters") or {}
            query = (qs.get("q") or "").strip()
            if not query:
                return respond(400, {"error": "q parameter required"}, headers)
            result = youtube_search(query)
            if result is None:
                return respond(404, {"error": "No video found"}, headers)
            return respond(200, result, headers)

        # ---- Profile ---------------------------------------------------------
        if resource == "profile":
            if method == "POST":
                body = json.loads(event.get("body") or "{}")
                profile = pick(body, [
                    "name", "age", "gender", "height", "height_unit",
                    "weight", "weight_unit", "bmi", "health_conditions",
                    "fitness_level", "goals",
                ])
                profile["user_id"] = uid          # always from the verified token
                profile["created_at"] = utc_now_iso()
                profiles_table.put_item(Item=profile)
                users_table.put_item(Item={
                    "user_id": uid,
                    "name": profile.get("name"),
                    "age": profile.get("age"),
                    "gender": profile.get("gender"),
                    "weight": profile.get("weight"),
                    "height": profile.get("height"),
                    "bmi": profile.get("bmi"),
                    "fitness_level": profile.get("fitness_level"),
                    "health_conditions": profile.get("health_conditions", []),
                    "goals": profile.get("goals", []),
                })
                return respond(200, {"message": "Profile saved"}, headers)

            if method == "GET":
                require_owner(parts, uid)
                item = profiles_table.get_item(Key={"user_id": uid}).get("Item")
                if item:
                    return respond(200, item, headers)
                return respond(404, {"error": "Profile not found"}, headers)

        # ---- Users -----------------------------------------------------------
        if resource == "users":
            if method == "POST":
                body = json.loads(event.get("body") or "{}")
                user = pick(body, ["name", "age", "fitness_level"])
                user["user_id"] = uid
                user["created_at"] = utc_now_iso()
                users_table.put_item(Item=user)
                return respond(200, {"message": "User saved"}, headers)

            if method == "GET":
                require_owner(parts, uid)
                item = users_table.get_item(Key={"user_id": uid}).get("Item")
                if item:
                    return respond(200, item, headers)
                return respond(404, {"error": "User not found"}, headers)

        # ---- Plans (auto-generated from the user's fitness level) ------------
        if resource == "plans" and method == "GET":
            require_owner(parts, uid)
            existing = plans_table.get_item(Key={"user_id": uid}).get("Item")
            if existing:
                return respond(200, existing, headers)
            profile = (profiles_table.get_item(Key={"user_id": uid}).get("Item")
                       or users_table.get_item(Key={"user_id": uid}).get("Item"))
            if not profile:
                return respond(404, {"error": "Profile not found"}, headers)
            plan = generate_plan(uid, profile.get("fitness_level", "beginner"))
            plans_table.put_item(Item=plan)
            return respond(200, plan, headers)

        # ---- Progress (workouts) ---------------------------------------------
        if resource == "progress":
            if method == "POST":
                body = json.loads(event.get("body") or "{}")
                item = pick(body, [
                    "workout_completed", "exercises_completed",
                    "total_exercises", "duration", "calories_burned", "exercises",
                ])
                item["user_id"] = uid
                item["progress_id"] = str(uuid.uuid4())
                item["type"] = "workout"
                item["date"] = valid_date(body.get("date"))
                item["created_at"] = utc_now_iso()
                progress_table.put_item(Item=item)
                return respond(201, {"message": "Progress saved",
                                     "progress_id": item["progress_id"]}, headers)

            if method == "GET":
                require_owner(parts, uid)
                items = [i for i in query_all(progress_table, uid)
                         if i.get("type") == "workout"]
                return respond(200, items, headers)

            if method == "DELETE":
                require_owner(parts, uid)
                if len(parts) < 3:
                    return respond(400, {"error": "Missing id"}, headers)
                progress_table.delete_item(
                    Key={"user_id": uid, "progress_id": parts[2]})
                return respond(200, {"message": "Deleted"}, headers)

        # ---- Nutrition (meals, stored in the progress table) -----------------
        if resource == "nutrition":
            if method == "POST":
                body = json.loads(event.get("body") or "{}")
                item = pick(body, [
                    "meal_type", "food", "food_name",
                    "calories", "protein", "carbs", "fat",
                ])
                item["user_id"] = uid
                item["progress_id"] = str(uuid.uuid4())
                item["type"] = "meal"
                item["date"] = valid_date(body.get("date"))
                item["created_at"] = utc_now_iso()
                progress_table.put_item(Item=item)
                return respond(201, {"message": "Meal saved",
                                     "progress_id": item["progress_id"]}, headers)

            if method == "GET":
                require_owner(parts, uid)
                items = [i for i in query_all(progress_table, uid)
                         if i.get("type") == "meal"]
                return respond(200, items, headers)

            if method == "DELETE":
                require_owner(parts, uid)
                if len(parts) < 3:
                    return respond(400, {"error": "Missing id"}, headers)
                progress_table.delete_item(
                    Key={"user_id": uid, "progress_id": parts[2]})
                return respond(200, {"message": "Meal deleted"}, headers)

        # ---- Account deletion (removes ALL of the caller's data) -------------
        if resource == "account" and method == "DELETE":
            require_owner(parts, uid)
            items = query_all(progress_table, uid)
            with progress_table.batch_writer() as batch:
                for it in items:
                    batch.delete_item(Key={"user_id": uid, "progress_id": it["progress_id"]})
            profiles_table.delete_item(Key={"user_id": uid})
            users_table.delete_item(Key={"user_id": uid})
            plans_table.delete_item(Key={"user_id": uid})
            return respond(200, {"message": "Account data deleted"}, headers)

        return respond(404, {"error": "Not found"}, headers)

    except auth.AuthError as e:
        return respond(e.status_code, {"error": e.message}, headers)
    except Exception as e:
        # Log details server-side (CloudWatch); never leak them to the client.
        print(f"ERROR handling {method} {path}: {repr(e)}")
        return respond(500, {"error": "Internal server error"}, headers)


def require_owner(parts, uid):
    """Reject access unless the uid in the URL path matches the token's uid."""
    if len(parts) < 2 or parts[1] != uid:
        raise auth.AuthError("Forbidden", status_code=403)
