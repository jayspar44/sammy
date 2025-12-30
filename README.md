# Sammy - AI Habit Companion

Sammy is an AI-powered habit companion app designed to help users moderate or quit drinking and other habits. It features a daily log, trend insights, and a proactive AI companion.

## Architecture

Sammy is a cross-platform application built with:

- **Frontend**: React 18, Vite, Capacitor (for Android/iOS).
- **Backend**: Node.js, Express.js.
- **Database**: Firebase Firestore.
- **Auth**: Firebase Authentication.
- **AI**: Google Gemini.

## Project Structure

- `/frontend`: React + Vite application.
- `/backend`: Node.js + Express API.
- `/scripts`: Developer tooling and deployment scripts.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Firebase Project (configured with Auth and Firestore)
- Google Cloud Project (for Gemini API)

### Setup

1.  **Install Dependencies**:
    ```bash
    npm run install-all
    ```

2.  **Environment Setup**:
    - Backend: Copy `backend/.env.example` to `backend/.env` and fill in secrets.
    - Frontend: Copy `frontend/.env.local.template` to `frontend/.env.local` and add Firebase config.

    Run validation:
    ```bash
    npm run validate-env
    ```

3.  **Run Locally**:
    Start both frontend and backend with a single command:
    ```bash
    npm run dev:local
    ```
    - Frontend: http://localhost:4000
    - Backend: http://localhost:4001

## Mobile Development

To run on Android:
```bash
cd frontend
npx cap add android
npx cap open android
```

## Deployment

Deploy to Google Cloud App Engine:
```bash
npm run gcp:deploy:dev
```