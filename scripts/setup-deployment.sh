#!/bin/bash
# IMPORTANT: Run this script from your LOCAL MACHINE with proper authentication
# This script requires:
# 1. Firebase CLI: npm install -g firebase-tools
# 2. Google Cloud SDK: https://cloud.google.com/sdk/docs/install
# 3. Authentication: firebase login && gcloud auth login
# 4. FIREBASE_CONFIG environment variable set with your Firebase client config

set -e

PROJECT_ID="sammy-658"

# Check if FIREBASE_CONFIG is set
if [ -z "$FIREBASE_CONFIG" ]; then
    echo "❌ Error: FIREBASE_CONFIG environment variable is not set"
    echo ""
    echo "Get your Firebase config from: https://console.firebase.google.com/project/$PROJECT_ID/settings/general"
    echo "Then run:"
    echo "  export FIREBASE_CONFIG='{\"apiKey\":\"...\",\"authDomain\":\"...\",\"projectId\":\"...\",\"storageBucket\":\"...\",\"messagingSenderId\":\"...\",\"appId\":\"...\",\"measurementId\":\"...\"}'"
    echo "  ./scripts/setup-deployment.sh"
    exit 1
fi

echo "🔧 Setting up Firebase hosting sites and GCP secrets for Sammy..."
echo ""
echo "📋 Prerequisites check..."

# Check Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install with: npm install -g firebase-tools"
    exit 1
fi
echo "✅ Firebase CLI found: $(firebase --version)"

# Check gcloud CLI
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
echo "✅ gcloud CLI found: $(gcloud --version | head -1)"

# Check authentication
echo ""
echo "🔑 Checking authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not authenticated with Firebase. Run: firebase login"
    exit 1
fi
echo "✅ Firebase authenticated"

if ! gcloud projects describe $PROJECT_ID &> /dev/null; then
    echo "❌ Not authenticated with gcloud. Run: gcloud auth login"
    exit 1
fi
echo "✅ gcloud authenticated"

# Step 1: Create Firebase hosting sites
echo ""
echo "📦 Step 1: Creating Firebase hosting sites..."
echo "Creating dev site (sammy-658-dev)..."
firebase hosting:sites:create sammy-658-dev --project $PROJECT_ID 2>&1 | grep -v "already exists" || echo "  → Dev site already exists or created successfully"

echo ""
echo "Note: The default site 'sammy-658' is already available for production"

# Step 2: Configure Firebase hosting targets
echo ""
echo "🎯 Step 2: Configuring hosting targets..."
firebase target:apply hosting dev sammy-658-dev --project $PROJECT_ID
echo "  → Configured dev target → sammy-658-dev"
firebase target:apply hosting prod sammy-658 --project $PROJECT_ID
echo "  → Configured prod target → sammy-658"

# Step 3: Create GCP Secret for Firebase client config
echo ""
echo "🔐 Step 3: Creating GCP Secret for Firebase client config..."

# Check if secret exists
if gcloud secrets describe FIREBASE_CLIENT_CONFIG --project=$PROJECT_ID &> /dev/null; then
    echo "  → Secret already exists, updating version..."
    echo "$FIREBASE_CONFIG" | gcloud secrets versions add FIREBASE_CLIENT_CONFIG \
      --data-file=- \
      --project=$PROJECT_ID
    echo "  → Secret updated successfully"
else
    echo "  → Creating new secret..."
    echo "$FIREBASE_CONFIG" | gcloud secrets create FIREBASE_CLIENT_CONFIG \
      --data-file=- \
      --replication-policy="automatic" \
      --project=$PROJECT_ID
    echo "  → Secret created successfully"
fi

# Step 4: Grant Cloud Build access to the secret
echo ""
echo "🔑 Step 4: Granting Cloud Build access to secrets..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
echo "  → Project number: $PROJECT_NUMBER"

gcloud secrets add-iam-policy-binding FIREBASE_CLIENT_CONFIG \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID 2>&1 | grep -E "(Updated|bindings)" || true

echo "  → Permissions granted"

# Verify setup
echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Verification:"
echo "1. Firebase hosting sites:"
firebase hosting:sites:list --project=$PROJECT_ID | grep -E "(sammy-658-dev|sammy-658)"
echo ""
echo "2. Firebase targets:"
cat .firebaserc | grep -A 10 targets
echo ""
echo "3. GCP Secret:"
gcloud secrets describe FIREBASE_CLIENT_CONFIG --project=$PROJECT_ID --format="table(name,createTime)"

echo ""
echo "🎉 All set! Your environment URLs:"
echo "  Dev:  https://sammy-658-dev.web.app"
echo "  Prod: https://sammy-658.web.app"
echo ""
echo "📌 Next steps:"
echo "  1. Push to 'develop' branch to deploy to dev"
echo "  2. Push to 'main' branch to deploy to prod"
