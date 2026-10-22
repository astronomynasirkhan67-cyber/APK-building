from pathlib import Path, PurePosixPath
from zipfile import ZipFile, BadZipFile
from tempfile import TemporaryDirectory
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import json, os, shutil, uuid

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
MAX_UPLOAD = 100 * 1024 * 1024  # 100 MB
MAX_FILES = 15000

app = FastAPI(title="NK Auto Builder AI", version="0.1.0")
app.mount("/assets", StaticFiles(directory=WEB), name="assets")

def detect_project(names):
    lower = [n.lower() for n in names]
    hints = []
    if any(n.endswith("settings.gradle") or n.endswith("settings.gradle.kts") for n in lower) or any("/build.gradle" in n or n == "build.gradle" for n in lower):
        hints.append({"type": "android_gradle", "label": "Android / Gradle project", "targets": ["apk"]})
    if any(n.endswith("package.json") for n in lower):
        hints.append({"type": "node_web", "label": "Node.js / JavaScript project", "targets": ["apk", "exe"]})
    if any(n.endswith("capacitor.config.ts") or n.endswith("capacitor.config.json") for n in lower):
        hints.append({"type": "capacitor", "label": "Capacitor app", "targets": ["apk"]})
    if any(n.endswith("electron-builder.yml") or n.endswith("electron-builder.yaml") for n in lower) or any("electron" in n and n.endswith("package.json") for n in lower):
        hints.append({"type": "electron", "label": "Possible Electron desktop project", "targets": ["exe"]})
    if any(n.endswith(".py") for n in lower) or any(n.endswith("requirements.txt") for n in lower):
        hints.append({"type": "python", "label": "Python project", "targets": ["exe"]})
    if any(n.endswith("pubspec.yaml") for n in lower):
        hints.append({"type": "flutter", "label": "Flutter project", "targets": ["apk", "exe"]})
    if not hints:
        hints.append({"type": "unknown", "label": "Unknown / generic source project", "targets": []})
    return hints

@app.get("/", response_class=HTMLResponse)
def home():
    return (WEB / "index.html").read_text(encoding="utf-8")

@app.get("/api/health")
def health():
    return {"status": "ok", "app": "NK Auto Builder AI", "build_worker": "not_configured"}

@app.post("/api/inspect")
async def inspect_zip(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(400, "Please upload a ZIP file.")
    data = await file.read(MAX_UPLOAD + 1)
    if len(data) > MAX_UPLOAD:
        raise HTTPException(413, "ZIP is too large. Maximum upload size is 100 MB.")
    try:
        import io
        with ZipFile(io.BytesIO(data)) as zf:
            infos = zf.infolist()
            if len(infos) > MAX_FILES:
                raise HTTPException(413, f"ZIP contains too many entries (max {MAX_FILES}).")
            names = []
            total_uncompressed = 0
            for info in infos:
                p = PurePosixPath(info.filename)
                if p.is_absolute() or ".." in p.parts or info.filename.startswith(("/", "\\")):
                    raise HTTPException(400, "Unsafe ZIP path detected. Upload cancelled.")
                total_uncompressed += info.file_size
                if total_uncompressed > 500 * 1024 * 1024:
                    raise HTTPException(413, "Expanded ZIP would exceed 500 MB.")
                if not info.is_dir():
                    names.append(info.filename)
            return {
                "filename": Path(file.filename).name,
                "file_count": len(names),
                "expanded_mb": round(total_uncompressed / (1024 * 1024), 2),
                "projects": detect_project(names),
                "message": "Inspection complete. This starter does not run uploaded scripts or build binaries yet."
            }
    except BadZipFile:
        raise HTTPException(400, "This file is not a valid ZIP archive.")

@app.post("/api/build")
async def request_build(payload: dict):
    target = str(payload.get("target", "")).lower()
    project_type = str(payload.get("project_type", "")).lower()
    if target not in {"apk", "exe"}:
        raise HTTPException(400, "Target must be apk or exe.")
    # Deliberately no arbitrary source execution in the starter.
    return {
        "status": "not_configured",
        "target": target,
        "project_type": project_type,
        "message": (
            f"{target.upper()} build worker is not configured. See docs/BUILD_WORKER.md. "
            "The app has not created a binary."
        )
    }
