# AI Context - Sammy

This file provides context for AI assistants working on the Sammy codebase.

## naming Convention

- **Files**: kebab-case (e.g., `user-profile.js`, `api-routes.js`).
- **React Components**: PascalCase (e.g., `UserProfile.jsx`).
- **Variables/Functions**: camelCase.
- **Directories**: kebab-case.

## Architecture Overview

### Frontend
- **State**: React Context for global state (Auth, Theme). Local state for components.
- **API**: Use the `api/` directory for Axios/Fetch wrappers. Do not make raw fetch calls in components.
- **Styling**: Vanilla CSS with CSS Modules or scoped classes. Use CSS variables for theming in `index.css`.
- **Mobile**: Capacitor is used. Avoid browser-only APIs without checks.

### Backend
- **Structure**: Controller-Service-Repository pattern (simplified).
    - `routes/`: Express routers.
    - `controllers/`: Request handling logic.
    - `services/`: Business logic, AI integration, Firebase calls.
- **Logging**: Use `req.log` (Pino) instead of `console.log`.

## Key Files

- `scripts/dev-with-ports.js`: Orchestrates the local dev environment.
- `frontend/src/App.jsx`: Main React entry and routing.
- `backend/src/index.js`: Express server entry.

## Common Tasks

- **Adding a new dependency**: Run `npm install` in the respective `frontend` or `backend` folder.
- **Local Dev**: Always use `npm run dev:local` from the root.
