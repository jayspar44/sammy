# Sammy - AI Habit Companion

AI-powered habit tracking app for moderating/quitting drinking with proactive AI support.

**Doc style:** Tables over prose, inline formats (`|`-separated), no duplicate info, bullets not paragraphs.

## Architecture

**Full-stack monorepo:**
- **Frontend**: React 19.2.3 + Vite 7.3.0 + Tailwind CSS 4.1.18 + Capacitor 8.0.0
- **Backend**: Node.js 22 + Express 5.2.1
- **Database**: Firebase Firestore | **Auth**: Firebase Auth | **AI**: Gemini 2.5 Flash
- **Hosting**: Cloud Run (backend) + Firebase Hosting (frontend) | **CI/CD**: Cloud Build

## Project Structure

```
sammy-1/
├── frontend/                 # React + Vite web app
│   ├── src/
│   │   ├── pages/           # Home, Companion, Insights, Settings, Login
│   │   ├── components/      # UI components (layout/, common/, ui/)
│   │   ├── contexts/        # AuthContext, UserPreferencesContext, ConnectionContext, ThemeContext
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
├── .claude/                  # Claude Code configuration
│   └── commands/            # Custom slash commands (skills)
│       ├── architect.md     # Architecture review and consultation
│       ├── code-review.md   # Multi-agent code review
│       ├── pr-flow.md       # Autonomous PR workflow
│       ├── pr-merge.md      # Smart PR merge with sync
│       ├── feature-start.md # Feature branch creation
│       ├── lint-check.md    # ESLint validation
│       ├── release.md       # Create releases with auto version bump
│       ├── build-app.md     # Android APK builds
│       └── upload-play-store.md # Play Store uploads
├── .github/workflows/        # GitHub Actions
│   ├── build-apk.yml        # On-demand APK/AAB builds
│   ├── upload-play-store.yml # Play Store uploads
│   ├── pr-preview-cleanup.yml # PR preview cleanup
│   ├── pr-validation.yml    # PR linting and build checks
│   └── claude-pr-review.yml # Claude Code PR reviews
├── scripts/                  # Dev tooling
├── cloudbuild.yaml          # CI/CD pipeline (dev/prod)
├── cloudbuild-preview.yaml  # PR preview environments
├── cloud-run.config.json    # Cloud Run service URLs and patterns
├── firebase.json            # Firebase project config
└── version.json             # Centralized version number
```

## Environments

| Environment | Branch/Trigger | Backend URL                              | Frontend              |
|-------------|----------------|------------------------------------------|-----------------------|
| Local       | any            | http://localhost:4001                    | http://localhost:4000 |
| Dev (GCP)   | develop        | https://sammy-backend-dev-u7dzitmnha-uc.a.run.app | https://sammy-658-dev.web.app |
| Prod (GCP)  | main           | https://sammy-backend-prod-u7dzitmnha-uc.a.run.app | https://sammy-658.web.app |
| PR Preview  | PR to develop  | https://pr-{N}---sammy-backend-dev-u7dzitmnha-uc.a.run.app | https://sammy-658--pr-{N}-{hash}.web.app |

PR Preview: `{N}` = PR number, `{hash}` = Firebase-generated ID. Auto-cleaned when PR closes.

## Local Development

**Prerequisites:** Node.js 22+, npm

```bash
# Setup
npm run install-all
cp backend/.env.example backend/.env
cp frontend/.env.local.template frontend/.env.local
# Edit both files with your credentials

# Run (http://localhost:4000 frontend, :4001 backend)
npm run dev:local          # Both servers
npm run dev:frontend       # Frontend only
npm run dev:backend        # Backend only
npm run dev:local:list     # List running servers
npm run dev:local:kill     # Kill servers
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
| GET    | `/api/health`         | Health check with version info (public) |
| POST   | `/api/log`            | Log a drink                |
| PUT    | `/api/log`            | Update a log entry         |
| DELETE | `/api/log`            | Delete a log entry         |
| GET    | `/api/stats`          | Get user statistics        |
| GET    | `/api/stats/range`    | Get stats for date range   |
| POST   | `/api/user/profile`   | Create/update user profile |
| GET    | `/api/user/profile`   | Get user profile           |
| POST   | `/api/chat`           | Send message to AI companion |
| GET    | `/api/chat/history`   | Get chat history           |
| DELETE | `/api/chat/history`   | Clear chat history         |

**Health Endpoint Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-14T12:34:56.789Z",
  "version": "0.11.3",
  "buildTimestamp": "2026-01-14T10:30:00.000Z"
}
```

## Mobile (Android/iOS)

Capacitor for native builds. Three Android flavors with separate app IDs (all installable on same device).

### Android Flavors

| Script | App ID | Backend |
|--------|--------|---------|
| `android:local` | `io.sammy.app.local` | Local |
| `android:local-livereload` | `io.sammy.app.local` | Local (live reload) |
| `android:dev` | `io.sammy.app.dev` | GCP dev |
| `android` | `io.sammy.app` | GCP prod |

**Build Variants** (select in Android Studio): `localDebug`, `devDebug`, `prodDebug`, `prodRelease` (Play Store)

### Android Commands

```bash
# First time setup
cd frontend && npx cap add android && npx cap open android

# Build for Android Studio
npm run android:local              # Local backend
npm run android:dev                # GCP dev backend
npm run android                    # GCP prod backend

# Live reload (run dev:local first in separate terminal)
npm run android:local-livereload

# Build APK directly (copies to G:\My Drive\sammy)
npm run apk:local                  # localDebug
npm run apk:dev                    # devDebug (or just: npm run apk)
npm run apk:prod                   # prodRelease
```

### iOS

```bash
cd frontend && npm run build && npx cap add ios && npx cap sync ios && npx cap open ios
```

## Commands

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:local` | Start local dev servers |
| `npm run build` | Build frontend for production |
| `npm run lint` | ESLint frontend and backend |
| `npm run validate-env` | Validate environment configuration |
| `npm run release` | Auto-bump version based on conventional commits |
| `npm run release:patch` | Force patch bump |
| `npm run release:minor` | Force minor bump |
| `npm run release:major` | Force major bump |

See [Mobile section](#mobile-androidios) for `android:*` and `apk:*` commands.

## Firebase

**Project ID**: sammy-658 | **Region**: nam5 | **Rules**: `firestore.rules` | **Indexes**: `firestore.indexes.json`

**Firestore Security:** User isolation, auth required, field validation, server timestamps, no public access.
**Collections:** `users`, `logs`, `chat_sessions`

```bash
firebase deploy --only firestore:rules
```

## GCP Deployment

### CI/CD Triggers

| Trigger | Action | Config |
|---------|--------|--------|
| Push to `develop` | Deploy to dev | `cloudbuild.yaml` |
| Push to `main` | Deploy to prod | `cloudbuild.yaml` |
| PR to `develop` | Deploy preview | `cloudbuild-preview.yaml` |

### PR Preview

Backend: Cloud Run tag `pr-{N}` (no traffic to main). Frontend: Firebase Hosting preview channel.
Cleanup: Auto via `.github/workflows/pr-preview-cleanup.yml` when PR closes.

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `pr-validation.yml` | PR to develop/main | ESLint, build check, code warnings |
| `build-apk.yml` | Manual | Build APK/AAB (flavor, type, format, API URL) |
| `upload-play-store.yml` | Manual | Upload AAB to Play Store (internal/alpha/beta) |
| `claude-pr-review.yml` | PR to main / @claude mention | Automated code review |

**Play Store Prerequisites:** `KEYSTORE_BASE64`, `PLAY_SERVICE_ACCOUNT_JSON` in GitHub Secrets

### Branch Protection

| Branch | Requires PR | Direct Push | Force Push |
|--------|-------------|-------------|------------|
| `main` | Yes | Blocked | Blocked |
| `develop` | No | Allowed | Blocked |

### Manual Deployment

```bash
# Backend to Cloud Run (Dev)
cd backend && gcloud run deploy sammy-backend-dev --source . --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT=FIREBASE_SERVICE_ACCOUNT:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=dev" \
  --set-env-vars="^@^ALLOWED_ORIGINS=https://sammy-658-dev.web.app,https://sammy-658.web.app,capacitor://localhost"

# Frontend to Firebase Hosting (Dev) - or use ./scripts/setup-deployment.sh
cd frontend
echo "VITE_API_URL=https://sammy-backend-dev-607940169476.us-central1.run.app/api" > .env.production
echo 'VITE_FIREBASE_CONFIG={"apiKey":"...","projectId":"sammy-658",...}' >> .env.production
npm run build && firebase deploy --only hosting:dev
```

## Security

### CRITICAL: Never Commit Secrets

**NEVER commit files containing secrets, credentials, or API keys.**

**Protected Files:** All `.env*` files EXCEPT `.env.example` / `.env.template`

**GCP Secret Manager:**
- `FIREBASE_CLIENT_CONFIG` - Frontend config (Cloud Build)
- `FIREBASE_SERVICE_ACCOUNT` - Backend Admin SDK
- `GEMINI_API_KEY` - AI API access

**If a Secret Leaks:**
1. Rotate key immediately in Google Cloud Console
2. Update all environment files and GCP Secret Manager
3. Delete old key (do NOT commit updated .env files)

**Before Committing:**
```bash
git status && git diff --cached   # Review staged changes
/security-scan                    # Run security scan
```

**Use `/commit-push` instead of `git commit`** - runs lint and security checks automatically.

## Claude Code Slash Commands

Custom commands in `.claude/commands/`:

| Command | Usage |
|---------|-------|
| `/feature-start` | `/feature-start <name> [base-branch]` - Create feature branch |
| `/commit-push` | `/commit-push [-m "msg"] [--no-push]` - Safe commit (lint + security) |
| `/security-scan` | `/security-scan [--staged \| --all]` - Scan for secrets |
| `/lint-check` | `/lint-check [--fix]` - ESLint with optional auto-fix |
| `/code-review` | `/code-review [pr-number\|branch]` - Multi-agent review (4 agents) |
| `/pr-flow` | `/pr-flow [--no-fix] [--auto-merge]` - Autonomous PR workflow (feature→develop or develop→main) |
| `/pr-merge` | `/pr-merge <pr-number> [--no-sync] [--delete-branch]` - Squash merge |
| `/release` | `/release [--patch\|--minor\|--major]` - Auto-bump version based on commits |
| `/build-app` | `/build-app [local\|dev\|prod]` - Build APK to Google Drive |
| `/upload-play-store` | `/upload-play-store [--internal\|--alpha\|--beta]` - Play Store upload |
| `/architect` | `/architect [consult\|review\|audit] <topic>` - Architecture expert |

### Typical Workflow

```bash
/feature-start my-feature              # Create branch
/commit-push -m "feat: Add feature"    # Safe commit (conventional format)
/pr-flow                               # PR: feature branch → develop
```

### Release Workflow

Releases happen on `develop` branch, then merge to `main` for production deployment:

```bash
# On develop branch after features are merged
/release                               # Auto-bump version on develop
/pr-flow                               # PR: develop → main (triggers prod deploy)
```

### Multi-Agent Code Review

`/code-review` runs 4 parallel agents: Security Scanner, Standards Enforcer, Logic Analyzer, Performance Guardian.

**Severity:** BLOCKING (cannot merge) > HIGH (should fix) > MEDIUM (follow-up) > INFO (optional)

`/pr-flow` auto-fixes blocking/high issues (up to 3 iterations) and creates GitHub issues for unfixable problems.

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

### Git Commits (Conventional Commits)

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning.

**Format**: `<type>: <description>`

| Type | When to Use | Version Bump |
|------|-------------|--------------|
| `feat:` | New feature | MINOR |
| `fix:` | Bug fix | PATCH |
| `feat!:` | Breaking change | MAJOR |
| `chore:` | Maintenance, deps | None |
| `docs:` | Documentation | None |
| `refactor:` | Code restructuring | None |
| `perf:` | Performance | None |
| `test:` | Tests | None |

**Examples:** `feat: add dark mode toggle`, `fix: resolve login redirect bug`, `chore: update deps`

**Commit hooks enforce this format.** Invalid messages are rejected by commitlint. Subject must be lowercase.

### Git Worktrees

Worktrees enable parallel development on multiple branches without stashing or switching.

**Directory Structure:**
```
~/Documents/projects/
├── sammy/                    # Main repo (develop branch)
└── sammy-worktrees/          # Worktree directory
    └── <branch-name>/        # Each worktree named after branch
```

**Commands:**
```bash
# Create worktree for new feature branch
git worktree add ../sammy-worktrees/my-feature -b claude/my-feature

# Create worktree for existing branch
git worktree add ../sammy-worktrees/existing-branch existing-branch

# List all worktrees
git worktree list

# Remove worktree (after merging)
git worktree remove ../sammy-worktrees/my-feature

# Prune stale worktrees
git worktree prune
```

**Workflow with Worktrees:**
1. Create worktree: `git worktree add ../sammy-worktrees/<name> -b claude/<name>`
2. Navigate: `cd ../sammy-worktrees/<name>`
3. Install deps: `npm run install-all`
4. Setup env: `npm run setup:env` (fetches secrets from GCP or prompts interactively)
5. Develop, commit, push
6. Create PR from worktree
7. After merge: `git worktree remove ../sammy-worktrees/<name>`

**Notes:**
- Each worktree needs its own `npm run install-all`
- Worktrees share the same `.git` object database (space efficient)
- Cannot checkout the same branch in multiple worktrees
- Claude Code sessions should `cd` into the worktree directory to work on that feature

**Troubleshooting:**
- If `npm run lint` fails with "eslint: command not found", devDependencies weren't installed. Fix with:
  ```bash
  cd frontend && npm install --include=dev
  cd ../backend && npm install --include=dev
  ```
