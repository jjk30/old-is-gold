# Main Lambda handler for Old Is Gold API
# Handles profiles, nutrition, progress, and workout plans

import json
import boto3
from decimal import Decimal
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('oldisgold-users')
plans_table = dynamodb.Table('oldisgold-plans')
progress_table = dynamodb.Table('oldisgold-progress')
profiles_table = dynamodb.Table('oldisgold-profiles')

def decimal_default(obj):
    """DynamoDB returns Decimals, need to convert for JSON"""
    if isinstance(obj, Decimal):
        return float(obj) if obj % 1 else int(obj)
    raise TypeError

def get_today():
    return datetime.now().strftime('%Y-%m-%d')

def lambda_handler(event, context):
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    method = event.get('httpMethod', '')
    path = event.get('path', '')
    
    try:
        # --- Profile endpoints ---
        if path == '/profile' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            if not user_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'user_id required'})}
            
            profiles_table.put_item(Item=body)
            users_table.put_item(Item={
                'user_id': user_id,
                'name': body.get('name'),
                'age': body.get('age'),
                'gender': body.get('gender'),
                'weight': body.get('weight'),
                'height': body.get('height'),
                'bmi': body.get('bmi'),
                'fitness_level': body.get('fitness_level'),
                'health_conditions': body.get('health_conditions', []),
                'goals': body.get('goals', [])
            })
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'Profile saved'})}
        
        if path.startswith('/profile/') and method == 'GET':
            user_id = path.split('/')[-1]
            response = profiles_table.get_item(Key={'user_id': user_id})
            item = response.get('Item')
            if item:
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps(item, default=decimal_default)}
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Profile not found'})}
        
        # --- User endpoints ---
        if path == '/users' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            users_table.put_item(Item=body)
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'User saved'})}
        
        if path.startswith('/users/') and method == 'GET':
            user_id = path.split('/')[-1]
            response = users_table.get_item(Key={'user_id': user_id})
            item = response.get('Item')
            if item:
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps(item, default=decimal_default)}
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'User not found'})}
        
        # --- Plan endpoints ---
        if path == '/plans' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            plans_table.put_item(Item=body)
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'Plan saved'})}
        
        if path.startswith('/plans/') and method == 'GET':
            user_id = path.split('/')[-1]
            response = plans_table.get_item(Key={'user_id': user_id})
            item = response.get('Item')
            if item:
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps(item, default=decimal_default)}
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Plan not found'})}
        
        # --- Progress endpoints ---
        if path == '/progress' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            if 'progress_id' not in body:
                body['progress_id'] = f"{body.get('user_id', 'unknown')}_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
            if 'date' not in body:
                body['date'] = get_today()
            progress_table.put_item(Item=body)
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'Progress saved'})}
        
        if path.startswith('/progress/') and method == 'GET':
            user_id = path.split('/')[-1]
            response = progress_table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key('user_id').eq(user_id)
            )
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps(response.get('Items', []), default=decimal_default)}
        
        if path.startswith('/progress/') and method == 'DELETE':
            parts = path.split('/')
            user_id = parts[2] if len(parts) > 2 else None
            progress_id = parts[3] if len(parts) > 3 else None
            if user_id and progress_id:
                progress_table.delete_item(Key={'user_id': user_id, 'progress_id': progress_id})
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'Deleted'})}
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Missing ids'})}
        
        # --- Nutrition endpoints ---
        if path == '/nutrition' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            body['type'] = 'meal'
            if 'progress_id' not in body:
                body['progress_id'] = f"meal_{body.get('user_id', 'unknown')}_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
            if 'date' not in body:
                body['date'] = get_today()
            progress_table.put_item(Item=body)
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'Meal saved'})}
        
        if path.startswith('/nutrition/') and method == 'GET':
            user_id = path.split('/')[-1]
            response = progress_table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key('user_id').eq(user_id)
            )
            meals = [i for i in response.get('Items', []) if i.get('type') == 'meal']
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps(meals, default=decimal_default)}
        
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}
        
    except Exception as e:
        print(f"Error: {e}")
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}
