Flutter multi-platform deployment checklist

This document collects concrete, repeatable steps to deploy a Firebase-powered Flutter app to iPad (iOS/iPadOS), Microsoft Surface (Windows), and Android tablets.

Follow the checklist below and use the included CI workflow and local check script to validate platform-specific requirements.

Summary checklist
- Platform compatibility: verify tablet layouts, multitasking (iPad), scaling and pointer support (Windows), and varied screen sizes/densities (Android).
- Firebase integration: ensure platform config files exist and initialization works per platform.
- UI/UX: responsive layouts, landscape/portrait, touch + keyboard handling.
- Permissions & APIs: camera, storage, notifications, file pickers.
- Stores: App Store, Microsoft Store, Google Play packaging and signing.
- Testing: run on emulators and real devices; record screenshots and logs.
- Firebase feature support: confirm which Firebase modules are supported on Windows.
- Analytics & Crashlytics: verify data reaches Firebase for each platform.

Local quick checks

- Make the Flutter Firebase config checker executable and run it:
```bash
chmod +x tools/flutter/check_flutter_firebase_configs.sh
./tools/flutter/check_flutter_firebase_configs.sh
```

- Run Flutter doctor and build locally (Android example):
```bash
flutter doctor -v
flutter build apk --release
# macOS to check iOS build (requires Xcode/macOS runner):
flutter build ios --no-codesign
# Windows to check Windows desktop build:
flutter build windows
```

Where to place Firebase config files (Flutter standard)
- Android: `android/app/google-services.json`
- iOS: `ios/Runner/GoogleService-Info.plist` (or `ios/GoogleService-Info.plist` if your project differs)
- Windows: create a JSON config used by your app code (e.g., `windows/firebaseConfig.json`) or follow Firebase C++/REST SDK setup (desktop support is limited)

CI notes
- The repo ships `.github/workflows/flutter_platform_checks.yml` which:
  - installs Flutter on each runner (ubuntu, windows, macos)
  - runs `flutter doctor`
  - verifies platform config files are present
  - runs `flutter build apk`, `flutter build windows`, and on macOS runs `flutter build ios --no-codesign`
  - uploads build artifacts and any generated screenshots

Security
- Never commit platform secrets (keystore files, provisioning profiles, raw API keys). In CI, restore them from encrypted secrets (base64) at runtime and remove after build.

Further steps
- Add layout snapshot tests (Storybook / golden images) for tablet widths.
- Add emulator-based E2E (integration_test or Flutter Driver) to CI for smoke tests.

If you want, I can now: (pick one)
- restore your Firebase native configs into CI from GitHub Secrets (base64) and add the restoration steps to the workflow; or
- scaffold a minimal Flutter integration_test that opens the main screen and captures a tablet screenshot in CI.

CI secret provisioning (copy/paste)

Use the GitHub CLI `gh` to add secrets (base64-encoded for files). Run these from a machine that has the native config files.

Linux example:
```bash
base64 -w0 android/app/google-services.json | gh secret set ANDROID_GOOGLE_SERVICES_JSON --body -
base64 -w0 ios/Runner/GoogleService-Info.plist | gh secret set IOS_GOOGLE_SERVICE_PLIST --body -
base64 -w0 service-account.json | gh secret set FIREBASE_SERVICE_ACCOUNT_JSON --body -
gh secret set GA4_PROPERTY_ID --body "123456789"
```

macOS example (no -w0):
```bash
base64 android/app/google-services.json | tr -d '\n' | gh secret set ANDROID_GOOGLE_SERVICES_JSON --body -
base64 ios/Runner/GoogleService-Info.plist | tr -d '\n' | gh secret set IOS_GOOGLE_SERVICE_PLIST --body -
base64 service-account.json | tr -d '\n' | gh secret set FIREBASE_SERVICE_ACCOUNT_JSON --body -
gh secret set GA4_PROPERTY_ID --body "123456789"
```

CI cleanup
The workflow removes restored config files after build (safety) so they won't persist on the runner.
