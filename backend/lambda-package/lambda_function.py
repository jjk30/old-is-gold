import json
import boto3
from decimal import Decimal
from datetime import datetime
import uuid

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('oldisgold-users')
plans_table = dynamodb.Table('oldisgold-plans')
progress_table = dynamodb.Table('oldisgold-progress')

def decimal_to_num(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_num(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_num(i) for i in obj]
    return obj

def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(decimal_to_num(body))
    }

def generate_plan(user_data):
    fitness_level = user_data.get('fitness_level', 'beginner')
    exercises = {
        'beginner': [
            {'name': 'Seated Arm Raises', 'reps': '10 each arm', 'duration': '2 min', 'instructions': 'Raise arms slowly overhead'},
            {'name': 'Ankle Circles', 'reps': '10 each foot', 'duration': '2 min', 'instructions': 'Rotate ankles in circles'},
            {'name': 'Seated Marching', 'reps': '20 steps', 'duration': '3 min', 'instructions': 'Lift knees while seated'},
            {'name': 'Neck Stretches', 'reps': '5 each side', 'duration': '2 min', 'instructions': 'Gentle neck rotations'},
        ],
        'intermediate': [
            {'name': 'Standing Leg Raises', 'reps': '10 each', 'duration': '3 min', 'instructions': 'Hold chair, lift leg to side'},
            {'name': 'Wall Push-ups', 'reps': '10', 'duration': '3 min', 'instructions': 'Push-ups against wall'},
            {'name': 'Heel-to-Toe Walk', 'reps': '20 steps', 'duration': '3 min', 'instructions': 'Walk in straight line'},
            {'name': 'Calf Raises', 'reps': '15', 'duration': '2 min', 'instructions': 'Rise on toes, hold chair'},
        ],
        'advanced': [
            {'name': 'Squats with Chair', 'reps': '10', 'duration': '3 min', 'instructions': 'Squat to chair height'},
            {'name': 'Standing Marches', 'reps': '30', 'duration': '3 min', 'instructions': 'March in place with arm swing'},
            {'name': 'Side Steps', 'reps': '10 each side', 'duration': '3 min', 'instructions': 'Step side to side'},
            {'name': 'Standing Balance', 'reps': '30 sec each leg', 'duration': '2 min', 'instructions': 'Stand on one leg'},
        ]
    }
    selected = exercises.get(fitness_level, exercises['beginner'])
    total_duration = sum(int(e['duration'].split()[0]) for e in selected)
    return {'exercises': selected, 'duration_minutes': total_duration, 'difficulty': fitness_level, 'created_at': datetime.now().isoformat()}

def lambda_handler(event, context):
    # Handle both API Gateway v1 and v2 formats
    method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', '')
    path = event.get('path') or event.get('rawPath') or event.get('requestContext', {}).get('http', {}).get('path', '')
    
    # Remove /prod prefix if present
    if path.startswith('/prod'):
        path = path[5:]
    
    print(f"DEBUG - Method: {method}, Path: {path}")
    print(f"DEBUG - Full event: {json.dumps(event)[:500]}")
    
    if method == 'OPTIONS':
        return response(200, {'message': 'OK'})
    
    if '/health' in path:
        return response(200, {'status': 'healthy'})
    
    # ===== NUTRITION ENDPOINTS =====
    
    # POST /nutrition
    if method == 'POST' and '/nutrition' in path:
        try:
            body = json.loads(event.get('body', '{}'))
            meal_id = str(uuid.uuid4())
            
            # Use client-provided date if available, otherwise fallback to UTC
            client_date = body.get('date')
            if client_date and len(client_date) == 10:  # Validate YYYY-MM-DD format
                date_str = client_date
            else:
                date_str = datetime.utcnow().strftime('%Y-%m-%d')
            
            meal_data = {
                'progress_id': meal_id,
                'user_id': str(body.get('user_id', '')),
                'date': date_str,
                'record_type': 'meal',
                'meal_type': str(body.get('meal_type', 'snack')),
                'food_name': str(body.get('food_name', '')),
                'calories': int(body.get('calories', 0)),
                'protein': int(body.get('protein', 0)),
                'carbs': int(body.get('carbs', 0)),
                'fat': int(body.get('fat', 0)),
                'created_at': datetime.utcnow().isoformat()
            }
            progress_table.put_item(Item=meal_data)
            return response(201, {'message': 'Meal saved', 'meal_id': meal_id, 'date': date_str})
        except Exception as e:
            return response(500, {'error': str(e)})
    
    # GET /nutrition/{user_id}
    if method == 'GET' and '/nutrition/' in path:
        user_id = path.split('/')[-1]
        try:
            result = progress_table.scan()
            all_items = result.get('Items', [])
            print(f"DEBUG GET NUTRITION - user_id from path: {user_id}")
            print(f"DEBUG GET NUTRITION - total items in table: {len(all_items)}")
            print(f"DEBUG GET NUTRITION - all items: {all_items[:3]}")  # First 3 items for debug
            
            meals = []
            for item in all_items:
                item_user_id = str(item.get('user_id', ''))
                item_record_type = item.get('record_type')
                if item_user_id == str(user_id) and item_record_type == 'meal':
                    meals.append(item)
                    print(f"DEBUG - Found meal: {item.get('food_name')}")
            
            print(f"DEBUG GET NUTRITION - found {len(meals)} meals for user")
            return response(200, {'meals': meals, 'count': len(meals)})
        except Exception as e:
            print(f"DEBUG GET NUTRITION - ERROR: {str(e)}")
            return response(500, {'error': str(e)})
    
    # DELETE /nutrition/{user_id}/{meal_id}
    if method == 'DELETE' and '/nutrition/' in path:
        parts = path.split('/')
        user_id = parts[-2]
        meal_id = parts[-1]
        try:
            progress_table.delete_item(Key={'user_id': user_id, 'progress_id': meal_id})
            return response(200, {'message': 'Meal deleted'})
        except Exception as e:
            return response(500, {'error': str(e)})
    # ===== PROGRESS ENDPOINTS =====
    
    # POST /progress
    if method == 'POST' and '/progress' in path:
        try:
            body = json.loads(event.get('body', '{}'))
            progress_id = str(uuid.uuid4())
            
            # Use client-provided date if available, otherwise fallback to UTC
            client_date = body.get('date')
            if client_date and len(client_date) == 10:  # Validate YYYY-MM-DD format
                date_str = client_date
            else:
                date_str = datetime.utcnow().strftime('%Y-%m-%d')
            
            progress_data = {
                'progress_id': progress_id,
                'user_id': str(body.get('user_id', '')),
                'date': date_str,
                'record_type': 'workout',
                'workout_completed': True,
                'exercises_completed': int(body.get('exercises_completed', 0)),
                'total_exercises': int(body.get('total_exercises', 0)),
                'duration_minutes': int(body.get('duration_minutes', 0)),
                'calories_burned': int(body.get('calories_burned', 0)),
                'created_at': datetime.utcnow().isoformat()
            }
            progress_table.put_item(Item=progress_data)
            return response(201, {'message': 'Progress saved', 'progress_id': progress_id, 'date': date_str})
        except Exception as e:
            return response(500, {'error': str(e)})
    
    # GET /progress/{user_id}
    if method == 'GET' and '/progress/' in path:
        user_id = path.split('/')[-1]
        try:
            result = progress_table.scan()
            all_items = result.get('Items', [])
            workouts = [item for item in all_items if str(item.get('user_id', '')) == str(user_id) and item.get('record_type') == 'workout']
            return response(200, {'progress': workouts, 'count': len(workouts)})
        except Exception as e:
            return response(500, {'error': str(e)})
    
    # ===== PLANS ENDPOINTS =====
    
    if method == 'GET' and '/plans/' in path:
        user_id = path.split('/')[-1]
        try:
            result = plans_table.get_item(Key={'user_id': user_id})
            if 'Item' in result:
                return response(200, result['Item'])
            user_result = users_table.get_item(Key={'user_id': user_id})
            if 'Item' in user_result:
                plan = generate_plan(user_result['Item'])
                plan['user_id'] = user_id
                plans_table.put_item(Item=plan)
                return response(200, plan)
            return response(404, {'error': 'User not found'})
        except Exception as e:
            return response(500, {'error': str(e)})
    
    # ===== USERS ENDPOINTS =====
    
    if method == 'POST' and '/users' in path:
        try:
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id') or str(uuid.uuid4())[:8]
            user_data = {
                'user_id': user_id,
                'name': body.get('name', 'Friend'),
                'age': body.get('age', 65),
                'fitness_level': body.get('fitness_level', 'beginner'),
                'created_at': datetime.now().isoformat()
            }
            users_table.put_item(Item=user_data)
            plan = generate_plan(user_data)
            plan['user_id'] = user_id
            plans_table.put_item(Item=plan)
            return response(201, {'user_id': user_id, 'message': 'User created'})
        except Exception as e:
            return response(500, {'error': str(e)})
    
    return response(404, {'error': 'Not found', 'path': path, 'method': method, 'debug': 'Check CloudWatch logs'})
