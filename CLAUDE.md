# Sammy - AI Habit Companion

An AI-powered habit tracking application to help users moderate or quit drinking and build healthier habits with proactive AI support.

## Architecture

**Full-stack monorepo** with:
- **Frontend**: React 19 + Vite + Tailwind CSS (web) + Capacitor (mobile)
- **Backend**: Node.js 22 + Express 5 REST API
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Email/Password)
- **AI**: Google Gemini 2.5 Flash

## Project Structure

```
sammy-1/
├── frontend/                 # React + Vite web app
│   ├── src/
│   │   ├── pages/           # Home, Companion, Insights, Settings, Login
│   │   ├── components/      # UI components (layout/, common/, ui/)
│   │   ├── contexts/        # AuthContext, UserPreferencesContext
│   │   ├── api/             # Axios client and API services
│   │   └── utils/           # Helper functions
│   └── capacitor.config.json # Mobile app config (io.sammy.app)
├── backend/                  # Express API server
│   ├── src/
│   │   ├── index.js         # Server entry point
│   │   ├── routes/api.js    # Route definitions
│   │   ├── controllers/     # auth, log, user, chat controllers
│   │   └── services/        # firebase, ai, stats services
│   └── Dockerfile           # Cloud Run container config
├── scripts/                  # Dev tooling
├── cloudbuild.yaml          # CI/CD pipeline
└── firebase.json            # Firebase project config
```

## Environments

| Environment | Branch    | Backend URL                              | Frontend              |
|-------------|-----------|------------------------------------------|-----------------------|
| Local       | any       | http://localhost:4001                    | http://localhost:4000 |
| Dev (GCP)   | develop   | TBD                                      | TBD                   |
| Prod (GCP)  | main      | TBD                                      | TBD                   |

## Local Development

### Prerequisites
- Node.js 22+
- npm

### Setup

```bash
# Install all dependencies (root, frontend, backend)
npm run install-all

# Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.local.template frontend/.env.local
# Edit both files with your credentials
```

### Running Locally

```bash
# Start both frontend and backend (recommended)
npm run dev:local
# Frontend: http://localhost:4000
# Backend:  http://localhost:4001

# Or run separately
npm run dev:frontend   # Frontend only
npm run dev:backend    # Backend only
```

### Dev Server Management

```bash
npm run dev:local:list  # List running dev servers
npm run dev:local:kill  # Kill running dev servers
```

## Environment Variables

### Backend (`backend/.env`)

| Variable                 | Description                          |
|--------------------------|--------------------------------------|
| `PORT`                   | Server port (default: 4001)          |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK service account JSON |
| `GEMINI_API_KEY`         | Google Gemini API key                |
| `NODE_ENV`               | Environment (development/production) |
| `ALLOWED_ORIGINS`        | CORS allowed origins (comma-separated) |

### Frontend (`frontend/.env.local`)

| Variable              | Description                          |
|-----------------------|--------------------------------------|
| `VITE_API_URL`        | Backend API URL (default: /api)      |
| `VITE_FIREBASE_CONFIG` | Firebase client config JSON         |

## API Endpoints

All endpoints (except health) require Firebase Auth token in `Authorization: Bearer <token>` header.

| Method | Endpoint              | Description                |
|--------|-----------------------|----------------------------|
| GET    | `/api/health`         | Health check (public)      |
| POST   | `/api/log`            | Log a drink                |
| PUT    | `/api/log`            | Update a log entry         |
| GET    | `/api/stats`          | Get user statistics        |
| GET    | `/api/stats/range`    | Get stats for date range   |
| POST   | `/api/user/profile`   | Create/update user profile |
| GET    | `/api/user/profile`   | Get user profile           |
| POST   | `/api/chat`           | Send message to AI companion |
| GET    | `/api/chat/history`   | Get chat history           |
| DELETE | `/api/chat/history`   | Clear chat history         |

## Mobile (Android/iOS)

The app uses Capacitor for native mobile builds.

### Build for Android

```bash
cd frontend
npm run build              # Build web assets
npx cap add android        # Add Android platform (first time)
npx cap sync android       # Sync web assets to native project
npx cap open android       # Open in Android Studio
```

### Build for iOS

```bash
cd frontend
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios           # Open in Xcode
```

## Useful Commands

| Command                    | Description                          |
|----------------------------|--------------------------------------|
| `npm run dev:local`        | Start local dev servers              |
| `npm run build`            | Build frontend for production        |
| `npm run validate-env`     | Validate environment configuration   |
| `npm run version:get`      | Get current version                  |
| `npm run version:bump`     | Bump version number                  |

## Firebase

- **Project ID**: sammy-658
- **Region**: nam5 (North America)
- **Firestore Rules**: `firestore.rules`
- **Indexes**: `firestore.indexes.json`

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## GCP Deployment

Deployment uses Cloud Build with branch push triggers.

| Component | Service | Trigger |
|-----------|---------|---------|
| Backend   | Cloud Run | Push to develop/main |
| Frontend  | Firebase Hosting | Push to develop/main |

### CI/CD Triggers

- **develop branch** → Deploys to dev environment
- **main branch** → Deploys to prod environment

### Manual Deployment

```bash
# Backend to Cloud Run
cd backend
gcloud run deploy sammy-backend-dev \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT=FIREBASE_SERVICE_ACCOUNT:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=development,ALLOWED_ORIGINS=https://sammy-658.web.app,capacitor://localhost"

# Frontend to Firebase Hosting
cd frontend
npm run build
firebase deploy --only hosting
```

### GCP Setup (First Time)

See the deployment plan for full setup instructions:
1. Enable required APIs (run, cloudbuild, secretmanager)
2. Create secrets in Secret Manager
3. Grant Cloud Build permissions
4. Create Cloud Build triggers

## Tech Stack

| Layer      | Technology         | Version |
|------------|--------------------|---------|
| Frontend   | React              | 19.2.3  |
| Build      | Vite               | 7.3.0   |
| Styling    | Tailwind CSS       | 4.1.18  |
| Backend    | Express.js         | 5.2.1   |
| Runtime    | Node.js            | 22      |
| Database   | Firebase Firestore | -       |
| Auth       | Firebase Auth      | -       |
| AI         | Google Gemini      | 2.5     |
| Mobile     | Capacitor          | 8.0.0   |
| Backend Hosting | Google Cloud Run | -  |
| Frontend Hosting | Firebase Hosting | - |
| CI/CD      | Google Cloud Build | -       |
