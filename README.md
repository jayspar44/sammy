# Sammy - AI Habit Companion

Sammy is an AI-powered habit companion app designed to help users moderate or quit drinking and build healthier habits. It features a daily log, trend insights, and a proactive AI companion.

## Architecture

Sammy is a cross-platform application built with:

- **Frontend**: React 19, Vite, Tailwind CSS, Capacitor (Android/iOS)
- **Backend**: Node.js 22, Express 5
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **AI**: Google Gemini 2.5 Flash
- **Hosting**: Cloud Run (backend), Firebase Hosting (frontend)

## Quick Start

### Prerequisites

- Node.js 22+
- npm
- Firebase Project (with Auth and Firestore enabled)
- Google Cloud Project (for Gemini API and Cloud Run)

### Local Development

1. **Install Dependencies**:
   ```bash
   npm run install-all
   ```

2. **Environment Setup**:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.local.template frontend/.env.local
   # Edit both files with your credentials
   ```

3. **Run Locally**:
   ```bash
   npm run dev:local
   ```
   - Frontend: http://localhost:4000
   - Backend: http://localhost:4001

## Deployment

Deployment is automated via Cloud Build on push to GitHub:

| Branch | Environment | Backend | Frontend |
|--------|-------------|---------|----------|
| `develop` | Dev | Cloud Run | Firebase Hosting |
| `main` | Prod | Cloud Run | Firebase Hosting |

### Manual Deployment

```bash
# Backend
cd backend
gcloud run deploy sammy-backend-dev --source . --region us-central1

# Frontend
cd frontend
npm run build
firebase deploy --only hosting
```

## Mobile Development

```bash
cd frontend
npm run build
npx cap add android    # First time only
npx cap sync android
npx cap open android   # Opens Android Studio
```

## Documentation

See [CLAUDE.md](CLAUDE.md) for detailed documentation including:
- Project structure
- Environment variables
- API endpoints
- GCP setup instructions
