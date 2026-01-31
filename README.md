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
npm install
npm run dev
```

## Deploying

Push to main and GitHub Actions handles it. Or manually:
```bash
cd frontend && npm run build
aws s3 sync dist/ s3://oldisgold-frontend --delete
aws cloudfront create-invalidation --distribution-id E1F1M9HXF6IJ7V --paths "/*"
```

## Project Structure
```
├── frontend/        # React app
├── backend/         # Lambda function
└── .github/         # CI/CD
```

## TODO

- [ ] Add more exercises to the database
- [ ] Weekly email summaries
- [ ] Dark/light mode toggle
- [ ] Export progress as PDF

## Notes

The YouTube integration uses their embed API which is free and doesn't need an API key. Videos are lazy-loaded to keep initial page load fast.

DynamoDB tables:
- `oldisgold-users` - basic user info
- `oldisgold-profiles` - detailed profiles
- `oldisgold-plans` - workout plans
- `oldisgold-progress` - workouts + meals
