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
│   │   ├── contexts/        # AuthContext, UserPreferencesContext, ConnectionContext
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
| Dev (GCP)   | develop   | https://sammy-backend-dev-607940169476.us-central1.run.app | https://sammy-658-dev.web.app |
| Prod (GCP)  | main      | https://sammy-backend-prod-607940169476.us-central1.run.app | https://sammy-658.web.app |

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

## Linting

ESLint is configured for both frontend and backend. Run linting before committing changes.

```bash
# Lint both frontend and backend
npm run lint

# Lint individually
npm run lint --prefix frontend
npm run lint --prefix backend
```

## Useful Commands

| Command                    | Description                          |
|----------------------------|--------------------------------------|
| `npm run dev:local`        | Start local dev servers              |
| `npm run build`            | Build frontend for production        |
| `npm run lint`             | Run ESLint on frontend and backend   |
| `npm run validate-env`     | Validate environment configuration   |
| `npm run version:get`      | Get current version                  |
| `npm run version:patch -- "msg"` | Patch bump (bug fixes)         |
| `npm run version:minor -- "msg"` | Minor bump (new features)      |
| `npm run version:major -- "msg"` | Major bump (breaking changes)  |

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

### Automatic Version Tags

Git tags are automatically created when version bumps are pushed to `develop` or `main` (`.github/workflows/version-tag.yml`):

- **Minor/Major bumps** → Tag `v{version}` created automatically
- **Patch bumps** → No tag created

### PR Validation

Pull requests to `develop` or `main` trigger automated validation (`.github/workflows/pr-validation.yml`):

1. **ESLint** - Runs on both frontend and backend
2. **Build** - Validates frontend builds successfully
3. **Code checks** - Warns about `console.log` and `TODO` comments

PRs are blocked from merging if lint or build fails.

### Branch Protection

| Branch | Requires PR | Direct Push | Force Push | Delete |
|--------|-------------|-------------|------------|--------|
| `main` | Yes | Blocked | Blocked | Blocked |
| `develop` | No | Allowed | Blocked | Blocked |

- **main**: All changes must go through a PR (no direct commits)
- **develop**: Direct commits allowed for owner and Claude Code App
- Only repository owner can push to protected branches

### Claude Code Reviews

Claude Code reviews PRs via GitHub Actions (`.github/workflows/claude-pr-review.yml`):

- **Automatic**: PRs targeting `main` are reviewed automatically when opened or updated
- **On-demand**: Mention `@claude` in any PR comment to request a review or ask questions

### Manual Deployment

```bash
# Backend to Cloud Run (Dev)
cd backend
gcloud run deploy sammy-backend-dev \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT=FIREBASE_SERVICE_ACCOUNT:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=dev" \
  --set-env-vars="^@^ALLOWED_ORIGINS=https://sammy-658-dev.web.app,https://sammy-658.web.app,capacitor://localhost"

# Frontend to Firebase Hosting (Dev)
cd frontend
FIREBASE_CONFIG='{"apiKey":"...","authDomain":"sammy-658.firebaseapp.com","projectId":"sammy-658","storageBucket":"sammy-658.firebasestorage.app","messagingSenderId":"...","appId":"...","measurementId":"..."}'
echo "VITE_API_URL=https://sammy-backend-dev-607940169476.us-central1.run.app/api" > .env.production
echo "VITE_FIREBASE_CONFIG=$FIREBASE_CONFIG" >> .env.production
npm run build
firebase deploy --only hosting:dev

# Or use the setup script (run once)
./scripts/setup-deployment.sh
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

## Coding Conventions

### Naming
- **Files**: kebab-case (e.g., `user-profile.js`, `api-routes.js`)
- **React Components**: PascalCase (e.g., `UserProfile.jsx`)
- **Variables/Functions**: camelCase
- **Directories**: kebab-case

### Frontend Patterns
- **State**: React Context for global state (Auth, Theme). Local state for components.
- **API**: Use the `api/` directory for Axios wrappers. Do not make raw fetch calls in components.
- **Styling**: Tailwind CSS utility classes. Use CSS variables for theming in `index.css`.
- **Mobile**: Capacitor is used. Avoid browser-only APIs without checks.

### Backend Patterns
- **Structure**: Controller-Service pattern
  - `routes/`: Express routers
  - `controllers/`: Request handling logic
  - `services/`: Business logic, AI integration, Firebase calls
- **Logging**: Use `req.log` (Pino) instead of `console.log`
