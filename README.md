# 🌟 Old Is Gold - Senior Fitness Platform

A **senior-friendly fitness web application** with personalized workout plans, progress tracking, and accessible design.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Tech Stack](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)
![Tech Stack](https://img.shields.io/badge/AWS-Lambda-FF9900?logo=amazonaws)
![Tech Stack](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)

---

## 🎯 Features

- **Personalized Workouts**: Plans adapted to mobility level (seated, standing, active)
- **Senior-Friendly UI**: Large buttons, high contrast, simple navigation
- **Progress Tracking**: Workout history, streaks, and achievements
- **Safety First**: Clear instructions with safety reminders
- **Serverless Architecture**: Scalable AWS deployment

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USERS (Seniors)                             │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AWS CloudFront (CDN)                           │
│                    oldisgold.fit                                    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
┌────────────────────────────┐    ┌────────────────────────────────────┐
│      S3 (Static Files)     │    │        API Gateway                 │
│    React Frontend (SPA)    │    │    /users, /plans, /progress       │
│  - Landing Page            │    └────────────────┬───────────────────┘
│  - Profile Setup           │                     │
│  - Today's Workout         │                     ▼
│  - Progress Dashboard      │    ┌────────────────────────────────────┐
└────────────────────────────┘    │        AWS Lambda                  │
                                  │      FastAPI Backend               │
                                  │  - User Management                 │
                                  │  - Workout Generation              │
                                  │  - Progress Tracking               │
                                  └────────────────┬───────────────────┘
                                                   │
                                                   ▼
                                  ┌────────────────────────────────────┐
                                  │        DynamoDB                    │
                                  │  - Users Table                     │
                                  │  - Plans Table (cached lookups)    │
                                  │  - Progress Table                  │
                                  └────────────────────────────────────┘
```

### Phase 2 (Future Enhancements)

```
┌─────────────────────────────────────────────────────────────────────┐
│  FUTURE: Event-Driven Analytics Pipeline                           │
│                                                                     │
│  workout.completed ──► Apache Kafka ──► Analytics Consumer         │
│                            │                    │                   │
│                            ▼                    ▼                   │
│                     Event Store          Weekly Reports             │
│                                          Adherence Metrics          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer       | Technology                          | Purpose                        |
|-------------|-------------------------------------|--------------------------------|
| Frontend    | React 18, Vite, React Router        | Senior-friendly SPA            |
| Backend     | Python, FastAPI, Pydantic           | REST API with type safety      |
| Database    | DynamoDB                            | Serverless, low-latency reads  |
| Hosting     | S3 + CloudFront                     | Global CDN delivery            |
| Compute     | AWS Lambda + API Gateway            | Serverless, auto-scaling       |
| CI/CD       | GitHub Actions                      | Automated testing & deployment |
| Container   | Docker, Docker Compose              | Local development              |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker (optional)

### Option 1: Docker (Recommended)

```bash
# Clone and start
git clone https://github.com/yourusername/old-is-gold.git
cd old-is-gold
docker-compose up --build

# Access:
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Manual Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## 📡 API Endpoints

| Method | Endpoint                  | Description                    |
|--------|---------------------------|--------------------------------|
| POST   | `/users`                  | Create user profile            |
| GET    | `/users/{id}`             | Get user details               |
| GET    | `/plans/{user_id}`        | Get today's workout plan       |
| POST   | `/plans/{user_id}/regenerate` | Generate new workout       |
| POST   | `/progress`               | Log workout completion         |
| GET    | `/progress/{user_id}`     | Get progress history & stats   |

### Example: Create User

```bash
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Margaret",
    "age": 72,
    "mobility_level": "medium",
    "goals": ["balance", "flexibility"]
  }'
```

---

## 🎨 Accessibility Features

- **Large Touch Targets**: Minimum 56px button height
- **High Contrast**: WCAG AA compliant color ratios
- **Clear Typography**: 20px base font, 1.6 line height
- **Simple Navigation**: Maximum 3 clicks to any feature
- **Safety Warnings**: Prominent health disclaimers

---

## 📁 Project Structure

```
old-is-gold/
├── frontend/
│   ├── src/
│   │   ├── pages/          # Landing, ProfileSetup, TodaysWorkout, Progress
│   │   ├── components/     # Reusable UI components
│   │   ├── styles/         # Global CSS (senior-friendly)
│   │   └── App.jsx         # Router setup
│   ├── Dockerfile
│   └── package.json
├── backend/
│   ├── app/
│   │   └── main.py         # FastAPI application
│   ├── Dockerfile
│   └── requirements.txt
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD pipeline
├── docker-compose.yml
└── README.md
```

---

## ☁️ AWS Deployment

### Required AWS Resources

1. **S3 Bucket** - Static frontend hosting
2. **CloudFront Distribution** - CDN with HTTPS
3. **Lambda Function** - Backend API
4. **API Gateway** - REST API routing
5. **DynamoDB Tables** - Users, Plans, Progress

### GitHub Secrets Required

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
S3_BUCKET
CLOUDFRONT_DIST_ID
```

### Deploy Commands

```bash
# Frontend: Build and sync to S3
npm run build
aws s3 sync dist/ s3://your-bucket --delete

# Backend: Package and deploy Lambda
cd backend
pip install -r requirements.txt -t package/
cp -r app package/
cd package && zip -r ../lambda.zip .
aws lambda update-function-code --function-name old-is-gold-api --zip-file fileb://lambda.zip
```

---

## 🗺️ Roadmap

### Phase 1 (MVP) ✅
- [x] React frontend with accessible design
- [x] FastAPI REST backend
- [x] User profile creation
- [x] Personalized workout plans
- [x] Progress tracking
- [x] Docker containerization
- [x] CI/CD pipeline

### Phase 2 (Scale)
- [ ] DynamoDB integration (replace in-memory)
- [ ] AWS Cognito authentication
- [ ] Apache Kafka event streaming
- [ ] Weekly progress email reports
- [ ] Video exercise demonstrations

### Phase 3 (Expand)
- [ ] Mobile app (React Native)
- [ ] Family member dashboard
- [ ] Integration with health devices
- [ ] AI-powered plan adjustments

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - feel free to use this for your portfolio!

---

## 👨‍💻 Author

**Jishnu** - Computer Engineering @ IIT  
Building developer tools and fitness tech.

---

*Remember: Age is just a number. Stay active, stay golden! 🌟*
