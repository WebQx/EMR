#!/usr/bin/env bash
set -euo pipefail

echo "Checking Windows Firebase support guidance..."
echo "Firebase official SDKs have limited desktop support. For Windows consider these options:" 
echo " - Use Firebase REST APIs or Admin SDK on a server-side proxy for unsupported features like Crashlytics." 
echo " - Use Firebase C++ SDK where supported and follow setup: https://firebase.google.com/docs/cpp/setup"
echo " - Ensure your app has a fallback if Firestore/Realtime features are unavailable on Windows (e.g., use local cache + sync to server)."

exit 0
