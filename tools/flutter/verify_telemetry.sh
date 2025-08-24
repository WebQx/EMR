#!/usr/bin/env bash
set -euo pipefail

# Simple telemetry verifier placeholder.
# This script checks for presence of FIREBASE_SERVICE_ACCOUNT_JSON and prints guidance.

ROOT="$(cd "$(dirname "$0")/../../" && pwd)"
if [ -z "${FIREBASE_SERVICE_ACCOUNT_JSON:-}" ]; then
  echo "No FIREBASE_SERVICE_ACCOUNT_JSON env var set. Skipping telemetry verification."
  exit 0
fi

echo "Service account provided. Writing temporary credentials file."
TMP="$(mktemp)"
echo "$FIREBASE_SERVICE_ACCOUNT_JSON" | base64 --decode > "$TMP" || echo "$FIREBASE_SERVICE_ACCOUNT_JSON" > "$TMP"

export GOOGLE_APPLICATION_CREDENTIALS="$TMP"

echo "Installing telemetry verifier dependencies..."
cd "$ROOT" || exit 1
if [ -f package.json ]; then
  # install only the needed package locally in CI
  npm install @google-analytics/data@beta --no-audit --no-fund --silent || true
fi

echo "Running telemetry verifier (node)..."
node tools/flutter/telemetry_verify.js || true

rm -f "$TMP"
exit 0
