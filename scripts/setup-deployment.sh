#!/bin/bash
# Setup script for Firebase hosting sites and GCP secrets
# Run this once to configure dev/prod environments

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

# Step 1: Create Firebase hosting sites
echo ""
echo "📦 Step 1: Creating Firebase hosting sites..."
echo "Creating dev site..."
firebase hosting:sites:create sammy-dev --project $PROJECT_ID || echo "Dev site may already exist"

echo ""
echo "Note: The default site 'sammy-658' will be used for production"

# Step 2: Configure Firebase hosting targets
echo ""
echo "🎯 Step 2: Configuring hosting targets..."
firebase target:apply hosting dev sammy-dev --project $PROJECT_ID
firebase target:apply hosting prod sammy-658 --project $PROJECT_ID

# Step 3: Create GCP Secret for Firebase client config
echo ""
echo "🔐 Step 3: Creating GCP Secret for Firebase client config..."
echo "$FIREBASE_CONFIG" | gcloud secrets create FIREBASE_CLIENT_CONFIG \
  --data-file=- \
  --replication-policy="automatic" \
  --project=$PROJECT_ID || echo "Secret may already exist, updating..."

# If secret exists, update it
echo "$FIREBASE_CONFIG" | gcloud secrets versions add FIREBASE_CLIENT_CONFIG \
  --data-file=- \
  --project=$PROJECT_ID 2>/dev/null || true

# Step 4: Grant Cloud Build access to the secret
echo ""
echo "🔑 Step 4: Granting Cloud Build access to secrets..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding FIREBASE_CLIENT_CONFIG \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Dev URL: https://sammy-dev.web.app"
echo "2. Prod URL: https://sammy-658.web.app"
echo ""
echo "3. Push to 'develop' branch to deploy to dev"
echo "4. Push to 'main' branch to deploy to prod"
echo ""
echo "5. Update backend ALLOWED_ORIGINS to include both URLs"
