# Android Deployment Guide

## Quick Reference

| Command | App Name | Backend | Use Case |
|---------|----------|---------|----------|
| `npm run android:local` | Sammy (Local) | Local backend | Local development |
| `npm run android:local-livereload` | Sammy (Local) | Local (live reload) | Active development |
| `npm run android:dev` | Sammy (Dev) | GCP Dev | Testing against dev server |
| `npm run android` | Sammy | GCP Prod | Production builds |

All three app variants can be installed simultaneously on the same device.

---

## Local Development

### Option 1: Built App (Recommended)

```bash
# Terminal 1: Start backend only
npm run dev:backend

# Terminal 2: Build and run
npm run android:local
```

Then in Android Studio:
1. Select **localDebug** in Build Variants (bottom-left)
2. Click Run

### Option 2: Live Reload

Use this for active development when you want code changes to auto-reload:

```bash
# Terminal 1: Start local servers
npm run dev:local

# Terminal 2: Run Android with live reload
npm run android:local-livereload
```

Select your emulator/device when prompted. Code changes auto-reload in the app.

---

## Dev/Prod Builds

### Dev Build (GCP Dev Backend)

```bash
npm run android:dev
```

### Prod Build (GCP Prod Backend)

```bash
npm run android
```

Both commands will:
1. Build the frontend with the correct environment
2. Sync to Android
3. Auto-open Android Studio

### In Android Studio

1. Open **Build Variants** panel (bottom-left corner)
2. Select the variant:
   - `localDebug` - Local backend
   - `devDebug` - GCP dev backend
   - `prodDebug` - GCP prod backend
   - `prodRelease` - Production release (Play Store)
3. Click **Run** (green play button)

---

## Verifying Your Build

Open the app and go to **Settings > App Info** to see:
- Version number
- Environment badge (LOCAL / DEV / PROD)
- Backend URL indicator
- Build timestamp
- Git commit hash

This confirms you're running the correct build.

---

## Troubleshooting

### "Cannot Connect to Server" on Local Build

1. Ensure backend is running: `npm run dev:backend`
2. Check you're using an emulator (not physical device) - physical devices can't reach `10.0.2.2`

### "Cannot Connect to Server" on Dev/Prod Build

1. Check your internet connection
2. Verify the backend is running: `curl https://sammy-backend-dev-u7dzitmnha-uc.a.run.app/api/health`

### App Shows Wrong Environment

1. Uninstall the app from device/emulator
2. Clean and rebuild: In Android Studio, **Build > Clean Project**, then **Build > Rebuild Project**
3. Run again

### Live Reload Not Working

Use `npm run android:local` instead, which builds a static version pointing to local backend.
