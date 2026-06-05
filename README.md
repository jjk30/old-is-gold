# Old Is Gold

A fitness app for seniors (55+). Built this because my grandparents needed something simpler than the overcomplicated fitness apps out there.

**Live:** https://oldisgold.fit

## What it does

- Personalized workout plans based on age and health conditions
- Meal logging with calorie/macro tracking
- Progress dashboard
- YouTube video tutorials for each exercise

## Tech Stack

**Frontend:** React, Vite, hosted on S3 + CloudFront

**Backend:** AWS Lambda (Python), API Gateway, DynamoDB

**Auth:** Firebase (Google sign-in)

## Architecture
```
CloudFront CDN → S3 (React app)
                     ↓
              API Gateway → Lambda → DynamoDB
```

Pretty standard serverless setup. CloudFront gives us edge caching so it loads fast globally.

## Running locally
```bash
cd frontend
cp .env.example .env   # sets VITE_API_URL
npm install
npm run dev
```

## Deploying

Push to `main` and GitHub Actions deploys **both** the frontend (S3 + CloudFront)
and the Lambda (packaged from `backend/`), so source and production can't drift.

### One-time CI setup (you need to do this)

CI authenticates to AWS with GitHub OIDC — no long-lived access keys.

1. **Create an IAM OIDC identity provider** for GitHub in your AWS account
   (`token.actions.githubusercontent.com`, audience `sts.amazonaws.com`).
2. **Create an IAM role** the workflow assumes, with a trust policy scoped to
   this repo (e.g. `repo:jjk30/old-is-gold:ref:refs/heads/main`). Grant it:
   `s3:PutObject` / `s3:DeleteObject` / `s3:ListBucket` on `oldisgold-frontend`,
   `cloudfront:CreateInvalidation`, and `lambda:UpdateFunctionCode` on the function.
3. **Add a repo secret** (Settings → Secrets and variables → Actions → Secrets):
   - `AWS_DEPLOY_ROLE_ARN` — ARN of the role from step 2.
4. **Add repo variables** (… → Variables):
   - `VITE_API_URL` — e.g. `https://gy19tatq9g.execute-api.us-east-1.amazonaws.com/prod`
   - `LAMBDA_FUNCTION_NAME` — name of the deployed Lambda function.

Then delete the old `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets.

### Lambda environment variables (set on the function in AWS)

- `FIREBASE_PROJECT_ID` — `old-is-gold-be8c8` (used to verify Firebase ID tokens).
- `YOUTUBE_API_KEY` — the (rotated, restricted) YouTube Data API key. It lives
  only on the server now and is never shipped to the browser.

### Manual deploy (fallback)
```bash
cd frontend && VITE_API_URL=<api-url> npm run build
aws s3 sync dist/ s3://oldisgold-frontend --delete
aws cloudfront create-invalidation --distribution-id E1F1M9HXF6IJ7V --paths "/*"
```

## Project Structure
```
├── frontend/                    # React app
├── backend/                     # Lambda function (lambda_function.py + auth.py)
│   └── legacy-fastapi-demo/     # old in-memory prototype, NOT deployed
└── .github/                     # CI/CD
```

## Next Steps

a) Add more exercises to the database
b) Weekly email summaries
c) Dark/light mode toggle

## Notes

The YouTube integration searches via the YouTube Data API. The API key is held
server-side in the Lambda (`/youtube` endpoint) and never reaches the browser;
results are cached client-side and videos are lazy-loaded to keep page loads fast.

### API auth

Every API call must include a Firebase ID token (`Authorization: Bearer <token>`).
The Lambda verifies the token against Google's public certs and derives the
caller's `user_id` from it — clients cannot access another user's data by changing
an id in the URL.

DynamoDB tables:
- `oldisgold-users` - basic user info
- `oldisgold-profiles` - detailed profiles
- `oldisgold-plans` - workout plans
- `oldisgold-progress` - workouts + meals
