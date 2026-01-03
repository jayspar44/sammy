#!/bin/bash

# Mobile Development Setup Script
# This script helps you test Sammy on your Android phone

set -e

echo "🚀 Sammy Mobile Dev Setup"
echo "=========================="
echo ""

# Get local IP address
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ipconfig getifaddr en0 2>/dev/null || ip addr show 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d/ -f1)

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not detect local IP address"
    echo "Please find your computer's IP manually:"
    echo "  - Linux: hostname -I"
    echo "  - Mac: ipconfig getifaddr en0"
    echo "  - Windows: ipconfig"
    exit 1
fi

echo "📡 Your computer's IP: $LOCAL_IP"
echo ""

# Choice menu
echo "Choose testing method:"
echo "1) Browser on Phone (access dev server from phone browser)"
echo "2) Capacitor Live Reload (native app with live reload)"
echo "3) Termux Instructions (run dev server ON your phone)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "🌐 Setting up Browser Testing"
        echo "=============================="
        echo ""

        # Update backend CORS
        if [ -f backend/.env ]; then
            if grep -q "ALLOWED_ORIGINS" backend/.env; then
                echo "⚠️  ALLOWED_ORIGINS exists in backend/.env"
                echo "Please manually add: http://$LOCAL_IP:4000"
            else
                echo "ALLOWED_ORIGINS=http://localhost:4000,http://localhost:5173,capacitor://localhost,http://$LOCAL_IP:4000" >> backend/.env
                echo "✅ Updated backend/.env with ALLOWED_ORIGINS"
            fi
        else
            echo "❌ backend/.env not found. Create it first!"
            exit 1
        fi

        echo ""
        echo "📱 Instructions:"
        echo "1. Make sure your phone and computer are on the same WiFi"
        echo "2. Run: npm run dev:local"
        echo "3. On your phone, open Chrome and visit:"
        echo ""
        echo "   👉 http://$LOCAL_IP:4000"
        echo ""
        ;;

    2)
        echo ""
        echo "📱 Setting up Capacitor Live Reload"
        echo "===================================="
        echo ""

        # Create temporary capacitor config
        cat > frontend/capacitor.config.json << EOF
{
  "appId": "io.sammy.app",
  "appName": "Sammy",
  "webDir": "dist",
  "server": {
    "url": "http://$LOCAL_IP:4000",
    "cleartext": true,
    "androidScheme": "https"
  }
}
EOF

        echo "✅ Updated capacitor.config.json with live reload URL"
        echo ""
        echo "📱 Instructions:"
        echo "1. Start dev server: npm run dev:local"
        echo "2. Open Android Studio:"
        echo "   cd frontend"
        echo "   npx cap sync android"
        echo "   npx cap open android"
        echo "3. Run the app in Android Studio"
        echo "4. The app will connect to your dev server with live reload!"
        echo ""
        echo "⚠️  Note: When done, restore capacitor.config.json by running:"
        echo "   git checkout frontend/capacitor.config.json"
        echo ""
        ;;

    3)
        echo ""
        echo "📱 Running Dev Server ON Your Phone (Termux)"
        echo "============================================="
        echo ""
        echo "1. Install Termux from F-Droid:"
        echo "   https://f-droid.org/packages/com.termux/"
        echo ""
        echo "2. In Termux, run these commands:"
        echo ""
        echo "   pkg update && pkg upgrade"
        echo "   pkg install nodejs-lts git"
        echo "   git clone https://github.com/jayspar44/sammy.git"
        echo "   cd sammy"
        echo "   git checkout claude/add-version-header-SZCjY"
        echo ""
        echo "3. Set up environment files (.env and .env.local)"
        echo ""
        echo "4. Install and run:"
        echo "   npm run install-all"
        echo "   npm run dev:local"
        echo ""
        echo "5. Open Chrome on your phone:"
        echo "   http://localhost:4000"
        echo ""
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✨ Setup complete!"
