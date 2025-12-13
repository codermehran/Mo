#!/bin/bash
set -e

# This script calculates the next version based on the latest git tag.
# It assumes semantic versioning (X.Y.Z).
# If no tags exist, it returns 1.0.0.
# Otherwise, it increments the patch version (Z) by 1.

# Ensure we have the list of tags (fetch logic handled by workflow usually, but good to note)
# git fetch --tags

# Get the latest tag sorted by version descending
latest_tag=$(git tag --sort=-v:refname | head -n 1)

if [ -z "$latest_tag" ]; then
    echo "1.0.0"
else
    # Strip leading 'v' if present
    version=${latest_tag#v}

    # Split by dot
    IFS='.' read -r -a parts <<< "$version"

    # Ensure we have at least 3 parts (X.Y.Z)
    if [ "${#parts[@]}" -lt 3 ]; then
        # If the tag format is unexpected, we default to a safe 1.0.0 or could error out.
        # For resilience, we return 1.0.0 (or we could try to parse what is there).
        echo "1.0.0"
    else
        major=${parts[0]}
        minor=${parts[1]}
        patch=${parts[2]}

        # Increment patch
        new_patch=$((patch + 1))

        echo "$major.$minor.$new_patch"
    fi
fi
