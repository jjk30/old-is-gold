<p align="center">
  <a href="https://oldisgold.fit/">
    <img src="docs/img/logo.webp" alt="Old Is Gold logo" width="120" height="120">
  </a>
</p>

<h1 align="center">Old Is Gold</h1>

<p align="center">
  A fitness app built for seniors (55+). Simple by design: large touch targets,
  plain language, gentle guidance, and exercise tutorials that meet people where they are.
</p>

<p align="center">
  <b>Live:</b> <a href="https://oldisgold.fit">https://oldisgold.fit</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18">
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite 5">
  <img src="https://img.shields.io/badge/React_Router-6-CA4245?logo=reactrouter&logoColor=white" alt="React Router 6">
  <img src="https://img.shields.io/badge/CSS-hand--rolled-1572B6?logo=css3&logoColor=white" alt="Custom CSS">
  <br>
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white" alt="Python 3.11">
  <img src="https://img.shields.io/badge/AWS_Lambda-serverless-FF9900?logo=awslambda&logoColor=white" alt="AWS Lambda">
  <img src="https://img.shields.io/badge/API_Gateway-prod-FF4F8B?logo=amazonapigateway&logoColor=white" alt="API Gateway">
  <img src="https://img.shields.io/badge/DynamoDB-NoSQL-4053D6?logo=amazondynamodb&logoColor=white" alt="DynamoDB">
  <img src="https://img.shields.io/badge/S3_+_CloudFront-CDN-569A31?logo=amazons3&logoColor=white" alt="S3 + CloudFront">
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black" alt="Firebase Auth">
</p>

---

## Contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [System design](#system-design)
- [Request lifecycle](#request-lifecycle)
- [Data model](#data-model)
- [API surface](#api-surface)
- [Security model](#security-model)
- [Rate limiting](#rate-limiting)
- [Back of the envelope: capacity and cost](#back-of-the-envelope-capacity-and-cost)
- [CI/CD and deployment](#cicd-and-deployment)
- [Running locally](#running-locally)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)

---

## What it does

Old Is Gold gives an older adult a personalized, low-impact fitness routine and an easy way to track it:

- **Onboarding** collects age, basic measurements, health conditions, and a self-described fitness level.
- **Workout plans** are generated from that fitness level, with each exercise paired to a short tutorial video.
- **Meal logging** records what someone ate with calories and macros.
- **A progress dashboard** rolls up calories eaten vs. burned, macros, exercises completed, and a seven-day view.

The whole product is deliberately gentle: no streaks-as-pressure, no shaming, no jargon.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite, hosted on Amazon S3 behind CloudFront |
| Backend | A single AWS Lambda (Python 3.11) behind API Gateway |
| Database | Amazon DynamoDB (four tables, plus one for rate limiting) |
| Auth | Firebase Authentication (Google sign-in and email/password) |
| Video | YouTube Data API v3, proxied server-side |

The design goal was a serverless system that costs almost nothing at low traffic, has no servers to patch, and scales without intervention.

---

## System design

```
   ┌──────────────────────────────────────────────────────────────────────┐
   │  SENIOR USER (55+)                                                     │
   │  taps "Log in", fills the onboarding form, taps an exercise's         │
   │  "Watch" button, logs a meal, opens the Progress dashboard            │
   └───────────────────────────────┬──────────────────────────────────────┘
                                    │  clicks / taps in the browser
                                    v
   ┌──────────────────────────────────────────────────────────────────────┐
   │  React SPA (in the user's browser)                                    │
   │  turns each click into either a page render or an API call            │
   └───────────────┬───────────────────────────────┬──────────────────────┘
                   │                                │
   (A) first load: │ fetch the app                  │ (B) every action: API call
       static files│                                │     HTTPS + Firebase ID token
                   v                                v
        ┌────────────────────┐          ┌────────────────────────┐
        │ CloudFront (CDN)   │          │ API Gateway (prod)      │
        │ edge cache         │          └───────────┬─────────────┘
        └─────────┬──────────┘                      │
                  v                                  v
        ┌────────────────────┐          ┌────────────────────────────┐
        │ S3: oldisgold-     │          │ Lambda: oldisgold-api      │
        │ frontend (React    │          │ (Python 3.11)              │
        │ build)             │          │                            │
        └────────────────────┘          │ 1. verify Firebase token   │
                                         │ 2. rate-limit (per user)   │
                                         │ 3. ownership check         │
                                         │ 4. route the request       │
                                         └───────┬──────────┬─────────┘
                                                 │          │
                            reads / writes user  │          │ video search
                            data (one partition  │          │ (key stays
                            per user_id)         │          │  server-side)
                                                 v          v
                              ┌──────────────────────────┐  ┌──────────────┐
                              │ DynamoDB                 │  │ YouTube      │
                              │  • oldisgold-profiles    │  │ Data API     │
                              │  • oldisgold-users       │  └──────────────┘
                              │  • oldisgold-plans       │
                              │  • oldisgold-progress    │
                              │  • oldisgold-ratelimit   │
                              └──────────────────────────┘
```

Everything starts with the person. A senior opens the app and taps around; the React app running in their browser turns each tap into one of two things:

1. **(A) Loading the app itself.** The very first visit fetches the built React app. Those static files live in the `oldisgold-frontend` S3 bucket and are served through CloudFront, which caches them at edge locations worldwide so the app loads fast and most visits never touch S3 directly. Hashed asset files are cached for a year (their names change every build); `index.html` is sent with `no-cache` so returning users always pick up the newest build.

2. **(B) Doing something that needs data.** Logging a meal, loading a plan, marking an exercise done, every such action becomes an API call to API Gateway, carrying the user's Firebase ID token. API Gateway invokes a single Lambda function (`oldisgold-api`), which is the only thing that touches the database. Inside that Lambda, every request runs the same four steps in order: verify the token, check the per-user rate limit, confirm the caller owns the data they asked for, then route to the handler that reads or writes DynamoDB (or, for tutorials, calls YouTube).

Keeping the entire backend in one Lambda is a deliberate simplification: at this scale it removes a great deal of operational overhead (one function to deploy, one set of logs, one IAM role) at no meaningful performance cost.

### A concrete journey: logging a meal

To make the click-to-database path explicit, here is what happens when a logged-in user logs a sandwich:

```
User taps "Add to Meals"
   │
   v
React reads the form (food, calories, macros) and calls apiPost('/nutrition', …)
   │   attaching Authorization: Bearer <Firebase ID token>
   v
API Gateway → Lambda (oldisgold-api)
   │
   ├─ 1. verify_token()      → confirms who the user is (from the token, not the form)
   ├─ 2. rate-limit check    → is this user under 60 requests this minute?
   ├─ 3. allow-list fields   → keep only food / calories / protein / carbs / fat
   ├─ 4. stamp user_id + a new progress_id + type:"meal" + today's date
   v
DynamoDB: put one item into oldisgold-progress
   │
   v
Lambda returns 201 Created  →  React shows the meal under "Today's Meals"
```

When the user later opens **Progress**, the app makes a `GET` call that triggers a single DynamoDB query for that user's `oldisgold-progress` items; the Lambda separates meals from workouts by their `type` field and the dashboard renders calories, macros, and completed exercises from that one response.

---

## Request lifecycle

A typical authenticated call (for example, loading the workout plan) flows like this:

1. The browser obtains a **Firebase ID token** from the signed-in user and attaches it as `Authorization: Bearer <token>`.
2. API Gateway forwards the request to the Lambda.
3. The Lambda **verifies the token** (`auth.py`): it checks the RS256 signature against Google's public certificates, confirms the audience and issuer match the Firebase project, and enforces expiry. The caller's user id comes only from the verified token, never from the URL or body.
4. A **per-user rate-limit check** runs (`ratelimit.py`). The metered YouTube proxy gets a tighter cap than ordinary routes.
5. The request is **routed** to the right handler, which reads or writes the relevant DynamoDB table.
6. For routes that include a user id in the path, an **ownership check** confirms that id matches the token's id, returning `403` otherwise.

---

## Data model

DynamoDB, four application tables plus one for rate limiting. The schema is intentionally narrow: each table is keyed by `user_id`, so a user's data is always a single-partition lookup.

| Table | Partition key | Sort key | Holds |
|---|---|---|---|
| `oldisgold-profiles` | `user_id` | n/a | Detailed profile: age, measurements, BMI, health conditions, fitness level, goals |
| `oldisgold-users` | `user_id` | n/a | A lightweight summary of the same person |
| `oldisgold-plans` | `user_id` | n/a | The generated workout plan (one current plan per user) |
| `oldisgold-progress` | `user_id` | `progress_id` | Both workouts (`type: "workout"`) and meals (`type: "meal"`) |
| `oldisgold-ratelimit` | `rl_key` | n/a | Short-lived per-window request counters, auto-expired by TTL |

Two design notes worth calling out:

- **Workouts and meals share one table.** Both are time-stamped events belonging to a user, so they live together in `oldisgold-progress` under a composite key and are separated by a `type` attribute. This keeps the progress dashboard to a single query per user.
- **The rate-limit table self-cleans.** Each counter row carries an `expires_at` timestamp, and DynamoDB's TTL feature deletes expired rows automatically, so the table never accumulates stale data.

Workout plans are generated from a fixed exercise library keyed by fitness level (`beginner`, `intermediate`, `advanced`), each producing a short four-exercise routine of roughly 9 to 11 minutes. A plan is generated once on first request and then reused.

---

## API surface

All routes require a valid token. Routes that take a `{uid}` enforce that it matches the caller.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check (no auth) |
| `POST` | `/profile` | Save the onboarding profile |
| `GET` | `/profile/{uid}` | Fetch the caller's profile |
| `POST` | `/users` | Save the lightweight user summary |
| `GET` | `/users/{uid}` | Fetch the user summary |
| `GET` | `/plans/{uid}` | Fetch (or generate on first call) the workout plan |
| `POST` | `/progress` | Log a completed workout |
| `GET` | `/progress/{uid}` | List the caller's workouts |
| `DELETE` | `/progress/{uid}/{id}` | Delete one workout |
| `POST` | `/nutrition` | Log a meal |
| `GET` | `/nutrition/{uid}` | List the caller's meals |
| `DELETE` | `/nutrition/{uid}/{id}` | Delete one meal |
| `GET` | `/youtube?q=...` | Server-side YouTube search (tighter rate limit) |
| `DELETE` | `/account/{uid}` | Erase all of the caller's data |

---

## Security model

The backend is built so that authentication is unavoidable and authorization is explicit:

- **Token verification fails closed.** The algorithm is pinned to RS256, so a forged token claiming no signature or a different algorithm is rejected. Audience, issuer, expiry, and issued-at are all required claims; a token missing any of them is refused.
- **Identity comes only from the verified token.** The Lambda never trusts a user id supplied in the URL or request body. A signed-in user cannot read or change another user's data by editing an id in the path; that returns `403`. (This is verified directly against production.)
- **Writes use field allow-lists.** Every write copies only a known set of fields from the request, so a client cannot inject unexpected attributes.
- **Errors never leak internals.** Unexpected failures are logged server-side and returned to the client as a generic message.
- **CORS is locked to the real origin.** The API echoes an `Access-Control-Allow-Origin` of `https://oldisgold.fit` (plus local dev origins), not a wildcard.
- **The YouTube key stays server-side.** The browser calls `/youtube`; the billable key lives only on the Lambda and is never shipped to the client.
- **Least-privilege database access.** The Lambda's IAM role grants only the specific DynamoDB actions the code uses, scoped to exactly these five tables, nothing broader.

---

## Rate limiting

A fixed-window limiter (`ratelimit.py`) caps requests per user per 60-second window:

- **General routes:** 60 requests per minute per user.
- **YouTube proxy:** 15 requests per minute per user (it is the one route that costs money per call).

Each counter is a single DynamoDB row incremented atomically, with a TTL so windows clean themselves up. The limiter **fails open**: if DynamoDB is briefly unavailable, the request is allowed rather than blocked. The reasoning is explicit, a limiter outage must never lock real users out of their own app; tolerating unthrottled traffic during a rare outage is the better tradeoff than denying everyone.

---

## Back of the envelope: capacity and cost

These are rough order-of-magnitude figures to show the system has comfortable headroom, not precise benchmarks. They assume the current single-region serverless setup.

**Assumptions for a modest senior-fitness audience:**

- Say **10,000 registered users**, with **2,000 active on a given day**.
- An active user opens the app, loads a plan, logs a meal or two, and completes a workout. Call it **roughly 20 API calls per active user per day**.
- That is about **40,000 API calls per day**, or **~1.2 million per month**.

**Does each layer cope?**

- **Lambda.** 40,000 invocations a day averages well under one request per second. Even if all of a day's traffic compressed into a single busy hour, that is only about **11 requests per second**, far below Lambda's default concurrency. *Plenty of headroom.*
- **DynamoDB.** Every read and write is a single-partition operation keyed by `user_id`. A user's whole progress history is one query. On on-demand capacity, DynamoDB absorbs this traffic without provisioning or tuning. The progress table grows by a handful of small items per active user per day, perhaps **a few hundred bytes each**, so even years of use per user stays in the low megabytes. *Plenty of headroom.*
- **CloudFront + S3.** Static assets are cached at the edge, so most page loads never touch S3 at all. Serving a small React bundle to a few thousand daily users is trivial for a CDN built for orders of magnitude more. *Plenty of headroom.*
- **The one thing to watch: YouTube.** The YouTube Data API has a daily quota, and search is the expensive operation. That is exactly why search is proxied server-side (the key is protected and callable only by authenticated users), rate-limited to 15/min per user, and why results are cached on the client and videos are lazy-loaded. At the traffic above, prudent caching keeps actual searches to a small fraction of plan loads. *This is the layer to monitor as usage grows.*

**Rough monthly cost at this scale:** the AWS portion (Lambda invocations, a million-odd DynamoDB on-demand operations, a few gigabytes of CDN transfer) lands in the **low single-digit dollars per month**, and a good deal of it may fall inside free-tier allowances. The practical cost ceiling is the YouTube quota, not AWS.

**Where it would strain first, and the fix:** if usage grew by one to two orders of magnitude, the first pressure point is YouTube quota, addressed by caching resolved videos in DynamoDB so a given exercise is searched once globally rather than per user. The AWS layers would continue to scale on demand well past that point.

---

## CI/CD and deployment

Pushing to `main` triggers GitHub Actions. The workflow is **path-filtered** so unrelated changes do not trigger unnecessary deploys:

- A change under `frontend/**` builds the React app and deploys it to S3, then invalidates CloudFront.
- A change under `backend/**` packages the Lambda (dependencies built for the Lambda runtime) and updates the function.
- A change to the workflow file itself runs both.

Each deploy step retries up to three times before failing, to ride out transient AWS hiccups. The frontend build pins long cache lifetimes on hashed assets and `no-cache` on `index.html`.

**AWS authentication.** CI currently authenticates with an IAM user's access keys, stored as the encrypted GitHub Actions secrets `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. A planned hardening step is to move to GitHub OIDC, which issues short-lived credentials per run and removes the stored keys entirely.

**Lambda environment variables (set on the function in AWS):**

- `FIREBASE_PROJECT_ID`: the Firebase project used to verify ID tokens.
- `YOUTUBE_API_KEY`: the restricted YouTube Data API key, server-side only.

**Manual deploy (fallback):**

```bash
cd frontend && VITE_API_URL=<api-url> npm run build
aws s3 sync dist/ s3://oldisgold-frontend --delete
aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
```

---

## Running locally

```bash
cd frontend
npm install
VITE_API_URL=<api-url> npm run dev
```

The frontend reads the API base URL from `VITE_API_URL`. The backend runs on AWS; there is no separate local server to start for normal frontend work.

---

## Project structure

```
.
├── frontend/                     React app (Vite)
│   └── src/
│       ├── pages/                Landing, Login, ProfileSetup, Workout, Nutrition, Progress
│       ├── components/           Custom SVG icons (food, macros)
│       ├── utils/                api.js (token-attaching fetch), youtubeApi.js
│       ├── AuthContext.jsx       Firebase auth state
│       └── ProtectedRoute.jsx    Route guard
├── backend/
│   ├── lambda_function.py        Single API handler (routing, plans, nutrition, YouTube proxy)
│   ├── auth.py                   Firebase ID token verification
│   ├── ratelimit.py              Per-user fixed-window rate limiter
│   ├── test_auth.py              Auth unit tests
│   ├── test_ratelimit.py         Rate limiter unit tests
│   └── legacy-fastapi-demo/      Old prototype, NOT deployed
├── docs/
│   └── img/logo.webp
└── .github/workflows/deploy.yml  Path-filtered CI/CD
```

---

## Roadmap

- Expand the exercise library and pair more curated tutorials.
- Cache resolved YouTube videos server-side to cut quota usage.
- Weekly email summaries of progress.
- Move CI to GitHub OIDC (short-lived credentials, no stored keys).
