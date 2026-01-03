# Deployment Fix Summary

## ⚠️ SECURITY NOTE

**IMPORTANT**: The Firebase client API key was temporarily exposed in git history and has been removed. While Firebase web API keys are designed to be public-facing (they're exposed in your frontend code), you should consider rotating it as a best practice:

1. Go to [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials?project=sammy-658)
2. Find the API key for your web app
3. Regenerate it or create a new one
4. Update the `FIREBASE_CONFIG` secret in GCP Secret Manager

The exposed key has been removed from git history via force push, but GitHub/others may have cached it.

## Issues Fixed

### 1. Blank Page Issue
**Root Cause**: The frontend was missing `VITE_FIREBASE_CONFIG` environment variable during build, causing Firebase Auth initialization to fail.

**Solution**:
- Added Firebase client config to GCP Secret Manager
- Updated `cloudbuild.yaml` to inject the config during build
- The secret `FIREBASE_CLIENT_CONFIG` is now available to Cloud Build

### 2. Separate Dev/Prod URLs
**Root Cause**: Both dev and prod deployments used the same Firebase Hosting URL (https://sammy-658.web.app).

**Solution**:
- Created separate Firebase Hosting sites using targets
- Dev: https://sammy-dev.web.app
- Prod: https://sammy-658.web.app
- Updated `firebase.json` to support multiple hosting targets
- Updated `.firebaserc` with target mappings

## Files Changed

1. **cloudbuild.yaml**
   - Added `FIREBASE_CLIENT_CONFIG` secret injection
   - Updated Firebase deploy command to use `hosting:${_ENV}` target
   - Updated `ALLOWED_ORIGINS` to include both dev and prod URLs

2. **firebase.json**
   - Changed from single hosting config to array with dev/prod targets

3. **.firebaserc**
   - Added hosting target mappings (dev → sammy-dev, prod → sammy-658)

4. **CLAUDE.md**
   - Updated environment table with correct URLs
   - Updated manual deployment instructions

5. **backend/.env.example**
   - Updated ALLOWED_ORIGINS comment with correct URLs

6. **scripts/setup-deployment.sh** (NEW)
   - Automated setup script for Firebase sites and GCP secrets

## Next Steps (REQUIRED)

The `develop` branch already has the Firebase config secret configured in `cloudbuild.yaml`. You just need to:

### 1. Create Firebase Hosting Sites (One-Time Setup)

```bash
# Authenticate
firebase login
gcloud auth login
gcloud config set project sammy-658

# Create the dev hosting site
firebase hosting:sites:create sammy-dev --project sammy-658

# Configure targets
firebase target:apply hosting dev sammy-dev --project sammy-658
firebase target:apply hosting prod sammy-658 --project sammy-658
```

### 2. Create/Update the Firebase Secret in GCP

After rotating your API key, update the secret:

```bash
# Get your new Firebase config from Firebase Console > Project Settings
export FIREBASE_CONFIG='{"apiKey":"YOUR_NEW_KEY","authDomain":"sammy-658.firebaseapp.com","projectId":"sammy-658","storageBucket":"sammy-658.firebasestorage.app","messagingSenderId":"607940169476","appId":"1:607940169476:web:a57e80f036008d93aeca51","measurementId":"G-L3FB33R0KB"}'

# Create or update the secret
echo "$FIREBASE_CONFIG" | gcloud secrets create FIREBASE_CLIENT_CONFIG \
  --data-file=- \
  --replication-policy="automatic" \
  --project=sammy-658

# If it already exists, update it instead:
echo "$FIREBASE_CONFIG" | gcloud secrets versions add FIREBASE_CLIENT_CONFIG \
  --data-file=- \
  --project=sammy-658

# Grant Cloud Build access
PROJECT_NUMBER=$(gcloud projects describe sammy-658 --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding FIREBASE_CLIENT_CONFIG \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=sammy-658
```

**OR** use the automated setup script:

```bash
export FIREBASE_CONFIG='{"apiKey":"YOUR_NEW_KEY",...}'
./scripts/setup-deployment.sh
```

## Testing

### 3. Deploy to Dev

The develop branch already has all the fixes. Just merge this branch and push:

```bash
git checkout develop
git merge claude/fix-deployment-issues-JMQar
git push origin develop
```

This triggers Cloud Build which will:
1. Deploy backend to Cloud Run with updated CORS (sammy-backend-dev)
2. Fetch Firebase config from the secret
3. Build frontend with `VITE_API_URL` and `VITE_FIREBASE_CONFIG`
4. Deploy to **https://sammy-dev.web.app** (separate dev URL!)

### 4. Verify the Fix

1. Visit **https://sammy-dev.web.app**
2. ✅ No blank page
3. ✅ Login works (Firebase Auth initializes)
4. ✅ API calls succeed
5. Check browser console for any errors

## Environment URLs

| Environment | Backend | Frontend |
|-------------|---------|----------|
| Dev | https://sammy-backend-dev-607940169476.us-central1.run.app | https://sammy-dev.web.app |
| Prod | https://sammy-backend-prod-607940169476.us-central1.run.app | https://sammy-658.web.app |

## Rollback Plan

If issues occur, you can quickly rollback:

```bash
# Revert to previous Firebase deployment
firebase hosting:clone sammy-dev:previous sammy-dev:current

# Revert backend
gcloud run services update-traffic sammy-backend-dev \
  --to-revisions=PREVIOUS=100 \
  --region=us-central1
```

## Additional Notes

- The Firebase client config is now stored in GCP Secret Manager for security
- Both dev and prod use the same Firebase project (sammy-658) but different hosting sites
- CORS is configured to allow both dev and prod URLs plus Capacitor
- The build process automatically injects the correct API URL based on the environment

## Support

If you encounter issues:
1. Check Cloud Build logs: https://console.cloud.google.com/cloud-build/builds
2. Verify secrets exist: `gcloud secrets list --project=sammy-658`
3. Check Firebase hosting sites: `firebase hosting:sites:list --project=sammy-658`
