# Legacy FastAPI demo — NOT DEPLOYED

This is the original in-memory FastAPI prototype. It is kept for reference only
and is **not** the production backend.

The production API is the AWS Lambda handler in
[`backend/lambda_function.py`](../lambda_function.py) (DynamoDB-backed, with
Firebase token auth). Do not deploy this folder.

Notes:
- Uses an in-memory store (data is lost on restart).
- Has no authentication.
- Uses the field name `mobility_level`; the production schema uses `fitness_level`.
