---
description: Build Android APK and copy to Google Drive
allowed-tools: Bash(npm run apk*)
argument-hint: [local|dev|prod]
---

# Build Android APK

Build an Android APK and copy it to Google Drive for easy installation.

## Arguments (Optional)

- **$1**: Environment - `local`, `dev`, or `prod` (defaults to `dev` if omitted)

## Environment Details

| Environment | Build Type | Backend | Use Case |
|-------------|------------|---------|----------|
| `local` | debug | Local backend (10.0.2.2:4001) | Testing with local server |
| `dev` | debug | GCP dev backend | Testing dev builds |
| `prod` | release | GCP prod backend | Production releases |

## Steps

1. **Determine environment**: Use `$1` if provided, otherwise default to `dev`

2. **Validate environment**: Must be one of `local`, `dev`, or `prod`

3. **Run the build command**:
   - `local` -> `npm run apk:local`
   - `dev` -> `npm run apk:dev`
   - `prod` -> `npm run apk:prod`

4. **Report result**: Show the APK filename and destination path

## What the Build Does

The build script automatically:
1. Builds the frontend with Vite (appropriate mode for environment)
2. Syncs Capacitor to Android
3. Runs Gradle build directly (no Android Studio needed)
4. Copies APK to `G:\My Drive\sammy` with versioned filename

## Output Location

APKs are saved to: `G:\My Drive\sammy\`

Filename format: `sammy-{env}-{type}-v{version}-{timestamp}.apk`

Example: `sammy-dev-debug-v0.10.8-20260111-1430.apk`

## Example Usage

### Default (dev):
```
/build-app
```
Builds devDebug APK and copies to Google Drive.

### Specific environment:
```
/build-app prod
```
Builds prodRelease APK and copies to Google Drive.

## Important Notes

- Build takes 1-2 minutes depending on cache state
- APK is ready to install from Google Drive on your phone
- The `prod` environment builds a release APK (signed, optimized)
