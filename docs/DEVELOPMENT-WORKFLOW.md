# Sammy Development Workflow

## Philosophy: Develop From Anywhere

This workflow is designed so you can develop, test, and deploy Sammy from **any device**:
- Phone (Claude app + GitHub app + browser)
- Any laptop (no local setup required)
- Desktop (Windows, Mac, Linux)
- Hotel business center computer
- Library computer

**All you need:**
- Browser access to GitHub and GCP Console
- Claude app or claude.ai for Claude Code
- That's it. No IDE, no Android Studio, no Node.js.

---

## Branch Structure

| Branch | Deploys To | Trigger |
|--------|------------|---------|
| `main` | Production Cloud Run + Firebase Hosting | PR merge |
| `develop` | Dev Cloud Run + Firebase Hosting | Any push |
| `feature/*` | Preview environment | PR opened against develop |

---

## Environment URLs

| Environment | Backend | Frontend |
|-------------|---------|----------|
| Production | https://sammy-backend-prod-u7dzitmnha-uc.a.run.app | https://sammy-658.web.app |
| Development | https://sammy-backend-dev-u7dzitmnha-uc.a.run.app | https://sammy-658-dev.web.app |
| PR Preview | https://pr-{N}---sammy-backend-dev-u7dzitmnha-uc.a.run.app | https://sammy-658--pr-{N}-{hash}.web.app |

---

## Workflows

### Feature Development (From Any Device)

1. **Open Claude app/claude.ai**

2. **Tell Claude Code to create a feature:**
   > "Clone the Sammy repo, create a feature branch called 'proactive-insights', and build [describe feature]. When done, push and open a PR against develop."

3. **Claude Code does everything:**
   - Clones repo
   - Creates branch
   - Writes code
   - Commits and pushes
   - Opens PR

4. **Preview auto-deploys** (after Cloud Build trigger setup):
   - Backend: `https://pr-47---sammy-backend-dev-u7dzitmnha-uc.a.run.app`
   - Frontend: `https://sammy-658--pr-47-{hash}.web.app`

5. **Test in browser** on any device

6. **Need changes?** Tell Claude Code:
   > "The risk badge shows undefined when empty. Fix it and push."

7. **Ready?** Tell Claude Code:
   > "Merge the PR to develop"

### Building APKs (No Local Machine)

1. **Go to GitHub** > Actions > "Build APK"

2. **Click "Run workflow"**
   - Enter API URL (preview, dev, or prod)
   - Select flavor (dev or prod)
   - Select build type (debug or release)

3. **Download APK** from workflow artifacts

4. **Install on phone** and test

### Deploy to Production

1. **Tell Claude Code:**
   > "Create a PR from develop to main"

2. **Review the PR** in GitHub

3. **Merge** - Auto-deploys to prod

### Upload to Play Store

1. **Go to GitHub** > Actions > "Upload to Play Store"

2. **Click "Run workflow"**
   - Select track (internal, alpha, beta)

3. **Check Play Console** for release status

---

## GitHub Secrets Required

| Secret | Description | How to Get |
|--------|-------------|------------|
| `KEYSTORE_BASE64` | Base64 encoded release keystore | `base64 -i sammy-release.keystore` |
| `KEYSTORE_PASSWORD` | Keystore password | Your keystore password |
| `KEY_ALIAS` | Key alias | Usually `sammy` |
| `KEY_PASSWORD` | Key password | Your key password |
| `FIREBASE_CLIENT_CONFIG` | Firebase client config JSON | GCP Secret Manager |
| `PLAY_SERVICE_ACCOUNT_JSON` | Play Store service account (optional) | Play Console > API access |

---

## Quick Reference: Preview URLs

The preview URL for any PR can be calculated:

**Backend:**
```
https://pr-{PR_NUMBER}---sammy-backend-dev-u7dzitmnha-uc.a.run.app
```

**Frontend:**
```
https://sammy-658--pr-{PR_NUMBER}-{hash}.web.app
```

Example for PR #47:
- Backend: `https://pr-47---sammy-backend-dev-u7dzitmnha-uc.a.run.app`
- Frontend: Check the Cloud Build logs for the exact URL

No need to check logs for the backend URL - just calculate it!

---

## Setup Instructions

### 1. Cloud Build GitHub Connection

Cloud Build needs a 2nd generation GitHub App connection for PR triggers:

1. Go to: https://console.cloud.google.com/cloud-build/repositories/2nd-gen?project=sammy-658
2. Click "Create Host Connection"
3. Select "GitHub" as the source
4. Click "Connect" - this opens GitHub OAuth
5. Authorize Google Cloud Build app
6. Select your GitHub account and the `sammy` repository
7. Click "Connect Repository"

### 2. Create Cloud Build Triggers

After connecting GitHub:

**PR Preview Trigger:**
1. Go to: https://console.cloud.google.com/cloud-build/triggers?project=sammy-658
2. Click "Create Trigger"
3. Name: `sammy-pr-preview`
4. Event: **Pull request**
5. Source: Select the connected `sammy` repo, base branch `^develop$`
6. Configuration: `cloudbuild-preview.yaml`
7. Substitution variables: `_PR_NUMBER` = `$(pull_request.number)`
8. Click "Create"

**PR Cleanup Trigger:**
1. Click "Create Trigger"
2. Name: `sammy-pr-preview-cleanup`
3. Event: **Pull request**
4. Source: Same repo, base branch `^develop$`
5. Configuration: `cloudbuild-preview-cleanup.yaml`
6. Substitution variables: `_PR_NUMBER` = `$(pull_request.number)`
7. Advanced > **Invert regex**: Check this (triggers when PR is closed)
8. Click "Create"

### 3. Configure GitHub Secrets

Go to GitHub > Your Repo > Settings > Secrets and variables > Actions > New repository secret

Add all secrets listed in the "GitHub Secrets Required" section above.

### 4. Keystore Setup

If you don't have a keystore yet:

```bash
keytool -genkey -v \
  -keystore sammy-release.keystore \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias sammy
```

Encode for GitHub Secrets:

```bash
# macOS/Linux
base64 -i sammy-release.keystore

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("sammy-release.keystore"))
```

**IMPORTANT:** Back up your keystore! If you lose it, you cannot update the app on Play Store.

### 5. Play Store Setup

1. Create Play Console account ($25)
2. Create app and complete store listing
3. Set up Internal Testing track
4. (Optional) Create service account for automated uploads

---

## Summary

```
+-------------------------------------------------------------------+
|  DEVELOP FROM ANYWHERE                                            |
|  Phone * Tablet * Laptop * Desktop * Borrowed Computer            |
+-------------------------------------------------------------------+
|                                                                   |
|  Claude App              GitHub (web/app)        Browser          |
|  +-------------+        +-------------+        +----------+       |
|  | Claude Code |        | Trigger APK |        | Test     |       |
|  |             |        | builds      |        | preview  |       |
|  | * Write code|        |             |        | URLs     |       |
|  | * Commit    |        | Merge PRs   |        |          |       |
|  | * Push      |        |             |        | Download |       |
|  | * Create PR |        | Download    |        | APKs     |       |
|  | * Merge     |        | APKs        |        |          |       |
|  +------+------+        +------+------+        +----+-----+       |
|         |                      |                    |              |
+---------+----------------------+--------------------+--------------+
          |                      |                    |
          v                      v                    v
+-------------------------------------------------------------------+
|  GITHUB REPOSITORY                                                |
|                                                                   |
|  feature/* --PR--> develop --PR--> main                           |
|      |                |              |                            |
|      v                v              v                            |
|  PR Preview       Dev Cloud      Prod Cloud                       |
|  (Cloud Build)    Run            Run                              |
|                                                                   |
|  GitHub Actions: Build APK * Upload to Play Store                 |
+-------------------------------------------------------------------+
          |
          v
+-------------------------------------------------------------------+
|  PLAY STORE (Internal Testing)                                    |
|                                                                   |
|  Install signed app directly from Play Store                      |
|  Bypasses work profile restrictions                               |
|  No sideloading required                                          |
+-------------------------------------------------------------------+
```

**Capabilities:**
- Write code from any device (Claude Code)
- Test features before merging (PR previews)
- Predictable preview URLs (no log reading for backend)
- Build APKs without local machine (GitHub Actions)
- Build signed release APKs (GitHub Actions + keystore)
- Distribute via Play Store (bypasses work restrictions)
- Full CI/CD from phone, tablet, laptop, anything

**Local machine required for:** Nothing! (Unless you want Android emulator/debugging)
