# NK Auto Builder AI (Mobile-first starter)

A mobile-friendly Progressive Web App (PWA) for uploading source ZIPs, detecting common project types, and requesting builds from a separate build server.

## Important reality check
- This is a **starter project**, not a magic converter for every source-code archive.
- APK/EXE builds require the right SDKs and a suitable build machine.
- Android APK builds normally require Android SDK + Gradle (and often Node.js for web projects).
- Windows EXE builds require a Windows build machine for reliable results. PyInstaller can package Python projects on Windows; Electron projects use Electron Builder.
- The included server safely inspects ZIP contents and reports project hints. It does **not** execute uploaded project scripts or claim to produce builds yet. The build endpoint returns a clear setup-required message until a trusted, isolated build worker is configured.
- Never build source code from an unknown ZIP without sandboxing it.

## Project layout
- `web/`: installable mobile PWA with Black, White, Red, and Green themes.
- `server/`: FastAPI upload and project-inspection API.
- `docker-compose.yml`: local development server setup.
- `docs/BUILD_WORKER.md`: next steps for enabling real builds safely.

## Run locally on a computer
Requires Python 3.11+.

```bash
cd server
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

Then open `http://localhost:8000` in a browser. On a phone, open the computer's LAN IP with port 8000 while both devices are on the same Wi-Fi.

For deployment, use HTTPS and configure authentication, upload limits, storage cleanup, and an isolated build worker before exposing it to the internet.

## Themes
Use the palette selector in the top bar to switch between Black, White, Red, and Green. Your choice is saved in the browser.

## Current functionality
- ZIP upload
- Project-type hints (Android Gradle, web app, Python, Electron, generic source)
- ZIP path safety checks and file-count/size limits
- Build-target selection UI (APK / Windows EXE)
- Build-request API that clearly reports that a build worker is not configured

## License
Starter code provided for personal development. Add your own license before publishing.
