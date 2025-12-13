#!/bin/bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Error: Version argument is required."
    echo "Usage: $0 <version>"
    exit 1
fi

echo "Starting build for version $VERSION..."

# Determine root
REPO_ROOT=$(pwd)

# 1. Build Frontend
if [ -d "beauty-platform/frontend" ]; then
    echo "Building Frontend..."
    cd beauty-platform/frontend

    # Check if npm is available
    if command -v npm &> /dev/null; then
        # Use npm ci if package-lock.json exists, else npm install
        if [ -f "package-lock.json" ]; then
            npm ci
        else
            npm install
        fi

        # Build the frontend
        npm run build --if-present
    else
        echo "Warning: npm not found, skipping frontend build steps."
    fi
    cd "$REPO_ROOT"
else
    echo "Frontend directory not found, skipping."
fi

# 2. Package Artifact
ARTIFACT_NAME="release_${VERSION}.zip"
echo "Packaging artifact: $ARTIFACT_NAME"

# Zip the project
# We exclude node_modules to keep size down, but include the build artifacts (like .next)
# We exclude .git to avoid metadata
if [ -d "beauty-platform" ]; then
    zip -r "$ARTIFACT_NAME" beauty-platform \
        -x "*/.git/*" \
        -x "*/node_modules/*" \
        -x "*/__pycache__/*" \
        -x "*/.venv/*" \
        -x "*/venv/*" \
        -x "*.DS_Store" \
        -x "*/.env" # Exclude local env files for security
else
    echo "Directory 'beauty-platform' not found. Zipping current directory contents."
    zip -r "$ARTIFACT_NAME" . \
        -x "./.git/*" \
        -x "*/node_modules/*" \
        -x "*/__pycache__/*" \
        -x "*/.venv/*" \
        -x "*/venv/*" \
        -x "*.DS_Store" \
        -x "*/.env" \
        -x "./$ARTIFACT_NAME" # Exclude the zip file itself
fi

echo "Artifact created: $ARTIFACT_NAME"
