# New Machine Setup Guide

Complete instructions to set up Sammy development on a new Windows or Mac machine.

## Prerequisites

Install these before starting:

| Software | Install From | Verify With |
|----------|--------------|-------------|
| Node.js 22+ | https://nodejs.org | `node --version` |
| Git | https://git-scm.com | `git --version` |
| gcloud CLI | https://cloud.google.com/sdk/docs/install | `gcloud --version` |

## Quick Setup (5 minutes)

### Step 1: Clone the repository

```bash
git clone https://github.com/your-username/sammy-1.git
cd sammy-1
```

### Step 2: Install dependencies

```bash
npm run install-all
```

### Step 3: Authenticate with GCP

```bash
gcloud auth login
gcloud config set project sammy-658
```

### Step 4: Set up environment files (automatic)

```bash
npm run setup:env
```

When prompted, choose option **1** (GCP Secret Manager). The script will:
- Fetch secrets from GCP Secret Manager
- Create `backend/.env` with Firebase service account and Gemini API key
- Create `frontend/.env.local` with Firebase client config

### Step 5: Start development

```bash
npm run dev:local -- --browser
```

This starts:
- Frontend: http://localhost:4000
- Backend: http://localhost:4001

The `--browser` flag automatically opens the app in your browser.

## Verification

After setup, verify everything works:

1. Frontend loads at http://localhost:4000
2. Can log in with a test account
3. Chat with AI companion works
4. Check Settings > App Info shows correct version

## Troubleshooting

### "gcloud CLI not found"

Install from: https://cloud.google.com/sdk/docs/install

After installation:
```bash
gcloud auth login
gcloud config set project sammy-658
```

### "Not authenticated with gcloud"

```bash
gcloud auth login
```

### "Permission denied" accessing secrets

You need IAM access to the sammy-658 GCP project. Contact the project owner.

### Environment validation fails

```bash
npm run validate-env
```

This checks if your `.env` files have the required variables.

## Android Development (Optional)

Additional setup for building Android APKs:

### Step 1: Install Android Studio

Download from: https://developer.android.com/studio

### Step 2: Configure SDK path

Create `frontend/android/local.properties`:

**Windows:**
```properties
sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```

**Mac:**
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### Step 3: Build and run

```bash
npm run android:local      # Build local flavor
npm run apk:dev            # Build APK to Google Drive
```

## Command Reference

| Command | Description |
|---------|-------------|
| `npm run dev:local` | Start dev servers (no browser) |
| `npm run dev:local -- --browser` | Start dev servers + open browser |
| `npm run setup:env` | Set up environment files |
| `npm run validate-env` | Validate environment configuration |
| `npm run lint` | Run linting on frontend and backend |

## Files Created by Setup

These files are gitignored and created locally:

| File | Purpose |
|------|---------|
| `backend/.env` | Backend secrets (Firebase, Gemini) |
| `frontend/.env.local` | Frontend config (Firebase client) |
| `frontend/android/local.properties` | Android SDK path |
