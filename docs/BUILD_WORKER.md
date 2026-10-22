# Enabling real APK / EXE builds

This starter deliberately does not execute arbitrary uploaded code. A real build service needs a separate, isolated worker.

## Suggested architecture
1. Keep the public API separate from build workers.
2. Store uploads with random IDs and delete them automatically after a short retention period.
3. Run each build in a disposable container/VM with no secrets, restricted network access, CPU/memory/time limits, and a non-root account.
4. Require the user to confirm that they own or have permission to build the source.
5. Use explicit project adapters rather than executing arbitrary commands from the ZIP.

## APK adapter
- Android Gradle projects: install a pinned JDK and Android SDK; invoke the expected Gradle wrapper only inside the isolated worker.
- Capacitor projects: install pinned Node.js dependencies and Android SDK; run the documented Capacitor Android build flow.
- Flutter projects: install Flutter SDK and Android SDK.
- Signing: debug APKs can be generated for testing. Release signing should use user-supplied credentials stored securely, never in the ZIP or logs.

## Windows EXE adapter
- Run on a Windows worker for best compatibility.
- Python projects: use a project-specific PyInstaller configuration after dependency review.
- Electron projects: use a pinned Node.js toolchain and Electron Builder.
- C/C++ projects: require the appropriate compiler and project build configuration.
- Do not promise that every project can be converted automatically.

## Suggested API lifecycle
`uploaded -> inspected -> queued -> building -> succeeded/failed -> artifact available`

Add authentication, quotas, queue persistence, cancellation, logs, artifact download authorization, malware scanning, and cleanup before production deployment.
