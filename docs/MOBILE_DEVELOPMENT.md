# Mobile Development Guide

This guide covers three ways to test Sammy on your Android phone during development.

## Quick Setup

Run the interactive setup script:

```bash
./scripts/setup-mobile-dev.sh
```

This will guide you through the setup process for your preferred method.

---

## Method 1: Browser Testing (Easiest & Fastest) ⚡

Test the web app in your phone's browser by accessing your computer's dev server.

### Requirements
- Phone and computer on the same WiFi network
- 2 minutes setup time

### Setup

1. **Get your computer's IP address:**
   ```bash
   # Linux/Mac
   hostname -I
   # or
   ./scripts/setup-mobile-dev.sh
   ```

2. **Update backend CORS** in `backend/.env`:
   ```bash
   ALLOWED_ORIGINS=http://localhost:4000,http://YOUR_IP:4000
   ```

3. **Start dev servers:**
   ```bash
   npm run dev:local
   ```

4. **On your phone**, open Chrome and visit:
   ```
   http://YOUR_IP:4000
   ```

### Pros
✅ Fastest setup
✅ Hot reload works
✅ Good for UI/UX testing
✅ No build required

### Cons
❌ Not testing as native app
❌ No Capacitor plugin testing
❌ Requires same WiFi network

---

## Method 2: Capacitor Live Reload (Best of Both Worlds) 🚀

Run the native Android app that connects to your dev server with live reload.

### Requirements
- Android Studio installed
- Computer and phone on same WiFi
- 10 minutes setup time

### Setup

1. **Update Capacitor config** temporarily in `frontend/capacitor.config.json`:
   ```json
   {
     "appId": "io.sammy.app",
     "appName": "Sammy",
     "webDir": "dist",
     "server": {
       "url": "http://YOUR_IP:4000",
       "cleartext": true,
       "androidScheme": "https"
     }
   }
   ```

2. **Start dev server:**
   ```bash
   npm run dev:local
   ```

3. **Sync and run Android app:**
   ```bash
   cd frontend
   npx cap sync android
   npx cap open android
   ```

4. **In Android Studio:**
   - Select your device or emulator
   - Click Run (green play button)
   - App will connect to your dev server

5. **When done, restore config:**
   ```bash
   git checkout frontend/capacitor.config.json
   ```

### Pros
✅ Tests actual native app
✅ Live reload works
✅ Can test Capacitor plugins
✅ Realistic performance

### Cons
❌ More complex setup
❌ Requires Android Studio
❌ Need to restore config after testing

---

## Method 3: Termux - Dev Server ON Your Phone 📱

Run Node.js and the full dev environment directly on your Android device.

### Requirements
- Android phone with 2GB+ RAM
- 20-30 minutes setup time
- 500MB+ free storage

### Setup

#### Step 1: Install Termux

Download from **F-Droid** (NOT Google Play - it's broken):
- https://f-droid.org/packages/com.termux/

Or from GitHub releases:
- https://github.com/termux/termux-app/releases

#### Step 2: Install Development Tools

Open Termux and run:

```bash
# Update packages (press Y when prompted)
pkg update && pkg upgrade

# Install Node.js LTS (this takes 5-10 minutes)
pkg install nodejs-lts

# Install Git
pkg install git

# Verify installation
node --version  # Should show v20.x.x or newer
npm --version   # Should show v10.x.x or newer

# Optional: Allow Termux to access phone storage
termux-setup-storage
```

#### Step 3: Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/jayspar44/sammy.git
cd sammy

# Checkout your feature branch
git checkout claude/add-version-header-SZCjY
```

#### Step 4: Set Up Environment Variables

Create `backend/.env`:
```bash
cd ~/sammy/backend
cat > .env << 'EOF'
PORT=4001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:4000,capacitor://localhost

# Add your actual credentials:
FIREBASE_SERVICE_ACCOUNT={"your":"credentials"}
GEMINI_API_KEY=your-api-key-here
EOF
```

Create `frontend/.env.local`:
```bash
cd ~/sammy/frontend
cat > .env.local << 'EOF'
VITE_API_URL=/api

# Add your Firebase config:
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"..."}
EOF
```

#### Step 5: Install Dependencies

```bash
cd ~/sammy

# This will take 10-20 minutes on a phone
npm run install-all
```

⏱️ **Tip:** Let it run and grab a coffee. It's slower on mobile but works!

#### Step 6: Start Development Servers

Option A - Both servers (recommended):
```bash
npm run dev:local
```

Option B - Separate terminals:
```bash
# Terminal 1
npm run dev:backend

# Terminal 2 (swipe left, tap "New Session")
npm run dev:frontend
```

#### Step 7: Access the App

Open Chrome on your phone:
```
http://localhost:4000
```

### Termux Tips

**Managing Sessions:**
- Swipe from left edge → "New Session" to create new terminal
- Swipe from left edge → Switch between sessions
- Volume Down + C → Cancel running command

**Keep Alive:**
- Termux needs to stay open (background is OK)
- Swipe notification to prevent Android from killing it
- Consider "Acquire wakelock" in Termux notification

**Editing Files:**
```bash
# Install nano editor
pkg install nano

# Edit a file
nano backend/.env
```

**Stop Servers:**
- Press `Ctrl + C` (Volume Down + C in Termux)

**Clear Storage:**
```bash
# If you run out of space
pkg clean
npm cache clean --force
```

### Pros
✅ Complete independence from computer
✅ Learn Termux (useful skill!)
✅ Can develop anywhere
✅ Impressive party trick 😎

### Cons
❌ Slower than computer
❌ More battery usage
❌ Longer setup time
❌ Limited screen space for coding

---

## Troubleshooting

### Can't connect to dev server from phone

1. Check both devices are on same WiFi
2. Check computer firewall allows ports 4000 and 4001
3. Verify IP address: `hostname -I` or `ipconfig getifaddr en0`
4. Test from phone browser first before native app

### Termux: "Package not found"

```bash
# Update package list
pkg update
pkg upgrade
```

### Capacitor: "cleartext traffic not permitted"

Add `"cleartext": true` to server config in `capacitor.config.json`

### Hot reload not working in native app

Make sure:
- Dev server is running
- Phone can reach the IP (test in browser first)
- `capacitor.config.json` has correct IP and `cleartext: true`

### Out of memory on phone (Termux)

```bash
# Reduce memory usage during install
npm install --prefer-offline --no-audit --no-fund

# Or install packages one at a time
cd frontend && npm install
cd ../backend && npm install
```

---

## Recommendations by Use Case

| Use Case | Recommended Method |
|----------|-------------------|
| Quick UI check | Method 1: Browser |
| Testing Capacitor features | Method 2: Live Reload |
| No computer available | Method 3: Termux |
| First time mobile testing | Method 1: Browser |
| Pre-release testing | Method 2: Live Reload |
| Learning/Experimenting | Method 3: Termux |

---

## Production Mobile App

To build the production Android app:

```bash
cd frontend

# Build production assets
npm run build

# Sync to Android project
npx cap sync android

# Open in Android Studio
npx cap open android

# In Android Studio:
# Build → Generate Signed Bundle / APK
```

See Capacitor docs for more: https://capacitorjs.com/docs/android
