import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
// Using package import for your Flutter app's main.dart
// If your package name differs, update the package path accordingly.
import 'package:WebQx/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('open app and take tablet screenshot', (WidgetTester tester) async {
    // Start app
    app.main();
    await tester.pumpAndSettle();

    // Wait for main screen
    await Future.delayed(Duration(seconds: 2));

    // Attempt to emit a telemetry event by tapping a widget with Key('integration_telemetry_button').
    // To enable telemetry emission during this test, add a button in your app that logs
    // a Firebase Analytics event named 'integration_test_event' and give it the key below.
    final telemetryFinder = find.byKey(const Key('integration_telemetry_button'));
    if (telemetryFinder.evaluate().isNotEmpty) {
      await tester.tap(telemetryFinder);
      await tester.pumpAndSettle();
      print('Telemetry emission attempted by tapping integration_telemetry_button');
    } else {
      print('Telemetry button not found; skipping telemetry emission.');
      print('To enable: add a widget with Key("integration_telemetry_button") that logs an analytics event "integration_test_event".');
    }

    // capture screenshot
    final binding = IntegrationTestWidgetsFlutterBinding.instance;
    final bytes = await binding.takeScreenshot('tablet_main_screen');

    // write to artifacts folder
    final outDir = Directory('integration_test_artifacts');
    if (!outDir.existsSync()) outDir.createSync(recursive: true);
    final file = File('${outDir.path}/tablet_main_screen.png');
    await file.writeAsBytes(bytes);
  }, timeout: Timeout(Duration(minutes: 3)));
}
