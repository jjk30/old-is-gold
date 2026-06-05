# Per-uid fixed-window rate limiting for the Old Is Gold Lambda, backed by DynamoDB.
#
# Each (uid, tier, 60-second window) maps to one counter row that we increment
# atomically. Once the counter exceeds the tier's cap within a window, requests
# are rejected (HTTP 429) until the window rolls over.
#
# FAIL OPEN: if DynamoDB is unavailable for ANY reason, we log it and allow the
# request. This is a deliberate choice — a limiter outage must never lock real
# users out of the app. The tradeoff is that abuse is unthrottled during such an
# outage, which is acceptable versus denying all legitimate traffic.

import os
import time

# Table name from the environment, with a production fallback (mirrors the
# env-var-with-fallback pattern used for FIREBASE_PROJECT_ID in auth.py).
RATELIMIT_TABLE = os.environ.get("RATELIMIT_TABLE", "oldisgold-ratelimit")

# Fixed window length, in seconds.
WINDOW_SECONDS = 60

# Per-tier request caps (requests / window / uid). Tune these here.
GENERAL_LIMIT = 60   # normal API routes
YOUTUBE_LIMIT = 15   # tighter cap for the metered /youtube proxy

# Seconds added on top of the window when setting the TTL, so a window's row
# lingers slightly past its end (avoids edge races); harmless because the key
# embeds the window start.
TTL_BUFFER = 5

# Tier identifiers — used both in the rate-limit key and to look up the cap.
TIER_GENERAL = "general"
TIER_YOUTUBE = "youtube"

_LIMITS = {
    TIER_GENERAL: GENERAL_LIMIT,
    TIER_YOUTUBE: YOUTUBE_LIMIT,
}

# DynamoDB table resource, created lazily and reused across warm invocations.
# Lazy init keeps boto3 (a Lambda-runtime-provided dependency, not pinned in
# requirements.txt) out of unit tests, which stub `_table` directly instead.
_table = None


def _get_table():
    global _table
    if _table is None:
        import boto3
        _table = boto3.resource("dynamodb").Table(RATELIMIT_TABLE)
    return _table


def check_rate_limit(uid, tier):
    """Count this request against (uid, tier) for the current 60s window.

    Returns (allowed, retry_after):
      * allowed: False once the window's count exceeds the tier's limit.
      * retry_after: seconds until the current window resets (0 when allowed).

    Fails OPEN: any DynamoDB error logs a warning (no secrets) and returns
    (True, 0) so the limiter can never lock out real users.
    """
    now = int(time.time())
    window_start = (now // WINDOW_SECONDS) * WINDOW_SECONDS
    rl_key = f"{uid}:{tier}:{window_start}"
    limit = _LIMITS.get(tier, GENERAL_LIMIT)

    try:
        # Single atomic update: increment the counter and set the TTL once.
        # `count` is a DynamoDB reserved word, so it goes through an alias.
        resp = _get_table().update_item(
            Key={"rl_key": rl_key},
            UpdateExpression=(
                "ADD #c :one SET expires_at = if_not_exists(expires_at, :exp)"
            ),
            ExpressionAttributeNames={"#c": "count"},
            ExpressionAttributeValues={
                ":one": 1,
                ":exp": window_start + WINDOW_SECONDS + TTL_BUFFER,
            },
            ReturnValues="UPDATED_NEW",
        )
        count = int(resp["Attributes"]["count"])
    except Exception as e:
        # FAIL OPEN — see module docstring. Never raise to the caller.
        print(f"WARN: rate limit check failed, allowing request: {repr(e)}")
        return True, 0

    if count > limit:
        retry_after = window_start + WINDOW_SECONDS - now
        return False, max(retry_after, 1)
    return True, 0
