# Sammy - AI Habit Companion

AI-powered habit tracking app for moderating or quitting drinking with proactive AI support.

## Architecture

- **Frontend**: React 19 + Vite + Tailwind CSS + Capacitor (mobile)
- **Backend**: Node.js 22 + Express 5 REST API
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth (Email/Password)
- **AI**: Google Gemini 2.5 Flash
- **Hosting**: Cloud Run (backend), Firebase Hosting (frontend)

## Project Structure

```
sammy-1/
├── frontend/src/
│   ├── pages/           # Home, Companion, Insights, Settings, Login
│   ├── components/      # layout/, common/, ui/
│   ├── contexts/        # AuthContext, UserPreferencesContext, ConnectionContext
│   ├── api/             # Axios client and services
│   └── utils/           # Helper functions
├── backend/src/
│   ├── index.js         # Server entry
│   ├── routes/api.js    # Route definitions
│   ├── controllers/     # auth, log, user, chat
│   └── services/        # firebase, ai, stats
├── scripts/             # Dev tooling, version management
└── docs/                # Additional documentation
```

## Coding Conventions

### Naming
- **Files**: kebab-case (`user-profile.js`)
- **React Components**: PascalCase (`UserProfile.jsx`)
- **Variables/Functions**: camelCase
- **Directories**: kebab-case

### Frontend
- React Context for global state (Auth, Theme)
- Use `api/` directory for Axios wrappers - no raw fetch in components
- Tailwind CSS utility classes for styling
- Capacitor for mobile - avoid browser-only APIs

### Backend
- Controller-Service pattern
- Use `req.log` (Pino) for logging, not `console.log`

## Key Commands

```bash
npm run dev:local      # Start local dev (frontend:4000, backend:4001)
npm run version:patch  # Bump patch version
npm run version:minor  # Bump minor version
```

## API Endpoints

All endpoints (except `/api/health`) require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/log` | Log a drink |
| PUT | `/api/log` | Update log entry |
| GET | `/api/stats` | Get statistics |
| GET | `/api/stats/range` | Stats for date range |
| POST/GET | `/api/user/profile` | User profile |
| POST | `/api/chat` | AI companion message |
| GET/DELETE | `/api/chat/history` | Chat history |

## Environments

| Env | Backend | Frontend |
|-----|---------|----------|
| Local | localhost:4001 | localhost:4000 |
| Dev | sammy-backend-dev-*.run.app | sammy-658-dev.web.app |
| Prod | sammy-backend-prod-*.run.app | sammy-658.web.app |

## Additional Context

See [CLAUDE.md](CLAUDE.md) for comprehensive documentation including:
- Environment variable details
- Mobile build instructions
- GCP deployment setup
- Firebase configuration
