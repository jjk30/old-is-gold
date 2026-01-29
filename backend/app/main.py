from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

app = FastAPI(title="Old Is Gold API", version="1.0.0")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== MODELS ==============

class UserCreate(BaseModel):
    name: str
    age: int
    mobility_level: str  # "low", "medium", "high"
    goals: list[str]  # ["strength", "flexibility", "balance", "cardio"]
    health_conditions: Optional[list[str]] = []

class User(UserCreate):
    user_id: str
    created_at: str

class WorkoutPlan(BaseModel):
    plan_id: str
    user_id: str
    exercises: list[dict]
    duration_minutes: int
    difficulty: str

class ProgressEntry(BaseModel):
    user_id: str
    workout_completed: bool
    duration_minutes: int
    notes: Optional[str] = ""

# ============== IN-MEMORY STORE (Replace with DynamoDB) ==============

users_db: dict[str, User] = {}
plans_db: dict[str, WorkoutPlan] = {}
progress_db: dict[str, list[dict]] = {}

# ============== WORKOUT TEMPLATES ==============

EXERCISE_LIBRARY = {
    "low": [
        {"name": "Seated Arm Raises", "reps": "10", "duration": "2 min", "instructions": "Sit straight, raise arms slowly overhead"},
        {"name": "Ankle Circles", "reps": "10 each", "duration": "2 min", "instructions": "Rotate ankles clockwise then counter"},
        {"name": "Seated Marching", "reps": "20", "duration": "3 min", "instructions": "Lift knees alternately while seated"},
        {"name": "Neck Stretches", "reps": "5 each side", "duration": "2 min", "instructions": "Gently tilt head side to side"},
        {"name": "Wrist Rotations", "reps": "10 each", "duration": "1 min", "instructions": "Rotate wrists in circles"},
    ],
    "medium": [
        {"name": "Standing Leg Raises", "reps": "10 each", "duration": "3 min", "instructions": "Hold chair, lift leg to side"},
        {"name": "Wall Push-ups", "reps": "10", "duration": "3 min", "instructions": "Push-ups against wall at arm's length"},
        {"name": "Heel-to-Toe Walk", "reps": "20 steps", "duration": "3 min", "instructions": "Walk in straight line, heel touching toe"},
        {"name": "Seated Twists", "reps": "10 each side", "duration": "2 min", "instructions": "Rotate torso left and right"},
        {"name": "Calf Raises", "reps": "15", "duration": "2 min", "instructions": "Rise onto toes, hold chair for balance"},
    ],
    "high": [
        {"name": "Squats with Chair", "reps": "12", "duration": "3 min", "instructions": "Lower to chair, stand back up"},
        {"name": "Standing Marches", "reps": "30", "duration": "3 min", "instructions": "March in place with high knees"},
        {"name": "Side Steps", "reps": "20", "duration": "3 min", "instructions": "Step side to side with slight squat"},
        {"name": "Arm Circles", "reps": "15 each direction", "duration": "2 min", "instructions": "Large circles forward then backward"},
        {"name": "Standing Balance", "reps": "30 sec each leg", "duration": "2 min", "instructions": "Stand on one leg near wall"},
    ]
}

# ============== ENDPOINTS ==============

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "Old Is Gold API"}

# --- USERS ---

@app.post("/users", response_model=User)
def create_user(user: UserCreate):
    user_id = str(uuid.uuid4())[:8]
    new_user = User(
        user_id=user_id,
        created_at=datetime.now().isoformat(),
        **user.model_dump()
    )
    users_db[user_id] = new_user
    
    # Auto-generate first workout plan
    generate_plan_for_user(user_id, user.mobility_level)
    
    return new_user

@app.get("/users/{user_id}", response_model=User)
def get_user(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[user_id]

# --- WORKOUT PLANS ---

def generate_plan_for_user(user_id: str, mobility_level: str) -> WorkoutPlan:
    exercises = EXERCISE_LIBRARY.get(mobility_level, EXERCISE_LIBRARY["low"])
    plan = WorkoutPlan(
        plan_id=str(uuid.uuid4())[:8],
        user_id=user_id,
        exercises=exercises,
        duration_minutes=sum(int(e["duration"].split()[0]) for e in exercises),
        difficulty=mobility_level
    )
    plans_db[user_id] = plan
    return plan

@app.get("/plans/{user_id}", response_model=WorkoutPlan)
def get_todays_plan(user_id: str):
    if user_id not in plans_db:
        raise HTTPException(status_code=404, detail="No plan found. Create user first.")
    return plans_db[user_id]

@app.post("/plans/{user_id}/regenerate", response_model=WorkoutPlan)
def regenerate_plan(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    user = users_db[user_id]
    return generate_plan_for_user(user_id, user.mobility_level)

# --- PROGRESS ---

@app.post("/progress")
def log_progress(entry: ProgressEntry):
    if entry.user_id not in progress_db:
        progress_db[entry.user_id] = []
    
    progress_entry = {
        "date": datetime.now().isoformat(),
        "completed": entry.workout_completed,
        "duration": entry.duration_minutes,
        "notes": entry.notes
    }
    progress_db[entry.user_id].append(progress_entry)
    
    return {"message": "Progress logged", "entry": progress_entry}

@app.get("/progress/{user_id}")
def get_progress(user_id: str):
    if user_id not in progress_db:
        return {"user_id": user_id, "entries": [], "stats": {"total_workouts": 0, "streak": 0}}
    
    entries = progress_db[user_id]
    completed = [e for e in entries if e["completed"]]
    
    return {
        "user_id": user_id,
        "entries": entries[-10:],  # Last 10
        "stats": {
            "total_workouts": len(completed),
            "total_minutes": sum(e["duration"] for e in completed),
            "streak": len(completed)  # Simplified streak calc
        }
    }

# ============== LAMBDA HANDLER ==============

# For AWS Lambda deployment with Mangum
# from mangum import Mangum
# handler = Mangum(app)
