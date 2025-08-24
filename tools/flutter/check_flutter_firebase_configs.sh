#!/usr/bin/env bash
# Simple checker for Flutter Firebase platform config files
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../" && pwd)"
MISSING=0

check() {
  local p="$1"
  if [ -f "$ROOT_DIR/$p" ]; then
    echo "OK: $p"
  else
    echo "MISSING: $p"
    MISSING=$((MISSING+1))
  fi
}

echo "Checking Flutter Firebase config files (root: $ROOT_DIR)"

# Android
check "android/app/google-services.json"

# iOS (typical Runner location)
check "ios/Runner/GoogleService-Info.plist"
check "ios/GoogleService-Info.plist"

# Windows (optional) - recommend a JSON config your app reads
check "windows/firebaseConfig.json"

if [ "$MISSING" -gt 0 ]; then
  echo "\nOne or more required Firebase config files are missing.\nPlace them in the paths above or set FIREBASE_CONFIG_JSON for runtime initialization."
  exit 2
fi

echo "All required Flutter Firebase config files present."
exit 0
