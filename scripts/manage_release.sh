#!/bin/bash
set -e

# Ensure we are in the root
cd "$(dirname "$0")/.."

# Configure Git for tagging
if [ -z "$(git config user.name)" ]; then
    git config user.name "GitHub Actions"
    git config user.email "actions@github.com"
fi

# 1. Calculate Next Version
echo "Calculating next version..."
VERSION=$(./scripts/get_next_version.sh)
echo "Target Version: $VERSION"

# 2. Create and Push Tag
# Check if tag already exists (shouldn't if logic is correct, but safety first)
if git rev-parse "$VERSION" >/dev/null 2>&1; then
    echo "Tag $VERSION already exists. Skipping tagging."
else
    echo "Creating tag $VERSION..."
    git tag "$VERSION"

    echo "Pushing tag $VERSION..."
    # We assume 'origin' is the correct remote and authentication is handled by the environment
    git push origin "$VERSION"
fi

# 3. Build Artifact
echo "Building artifact..."
./scripts/build.sh "$VERSION"

ARTIFACT_NAME="release_${VERSION}.zip"

if [ ! -f "$ARTIFACT_NAME" ]; then
    echo "Error: Artifact $ARTIFACT_NAME not found!"
    exit 1
fi

# 4. Create GitHub Release
echo "Creating GitHub Release for $VERSION..."
# Use gh CLI. Assumes GITHUB_TOKEN is set.
gh release create "$VERSION" "$ARTIFACT_NAME" \
    --title "Release $VERSION" \
    --notes "Auto-generated release for version $VERSION. Includes backend and frontend source/build."

# 5. Cleanup Old Releases
echo "Cleaning up old releases (keeping last 2)..."

# List releases by creation date descending and extract tag names
tags=$(gh release list --limit 100 --json tagName --order desc --jq '.[].tagName')

# Convert to array
# We use a loop to handle potential whitespace issues
release_tags=()
while IFS= read -r line; do
    if [ -n "$line" ]; then
        release_tags+=("$line")
    fi
done <<< "$tags"

count=${#release_tags[@]}
echo "Total releases found: $count"

if [ "$count" -gt 2 ]; then
    # Keep the first 2 (index 0 and 1), delete the rest
    for (( i=2; i<count; i++ )); do
        tag_to_delete="${release_tags[$i]}"
        echo "Deleting old release and tag: $tag_to_delete"
        gh release delete "$tag_to_delete" --yes --cleanup-tag || echo "Failed to delete $tag_to_delete, continuing..."
    done
else
    echo "Less than or equal to 2 releases. No cleanup needed."
fi

echo "Release workflow completed successfully."
