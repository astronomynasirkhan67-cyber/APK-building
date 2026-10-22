const themeSelect = document.getElementById("themeSelect");
const zipInput = document.getElementById("zipFile");
const fileName = document.getElementById("fileName");
const inspectBtn = document.getElementById("inspectBtn");
const buildBtn = document.getElementById("buildBtn");
const result = document.getElementById("result");
const buildResult = document.getElementById("buildResult");
let inspection = null;
let target = "apk";

const savedTheme = localStorage.getItem("nk-builder-theme") || "black";
document.body.dataset.theme = savedTheme;
themeSelect.value = savedTheme;
themeSelect.addEventListener("change", () => {
  document.body.dataset.theme = themeSelect.value;
  localStorage.setItem("nk-builder-theme", themeSelect.value);
  document.querySelector('meta[name="theme-color"]').content =
    themeSelect.value === "white" ? "#f2f4f7" :
    themeSelect.value === "red" ? "#16090b" :
    themeSelect.value === "green" ? "#07140e" : "#090a0d";
});

zipInput.addEventListener("change", () => {
  const f = zipInput.files[0];
  fileName.textContent = f ? `${f.name} · ${(f.size / 1024 / 1024).toFixed(2)} MB` : "No file selected";
  inspection = null;
  buildBtn.disabled = true;
  result.classList.add("hidden");
  buildResult.classList.add("hidden");
});

document.querySelectorAll(".target").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".target").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  target = btn.dataset.target;
}));

function showResult(el, html) { el.innerHTML = html; el.classList.remove("hidden"); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

inspectBtn.addEventListener("click", async () => {
  const file = zipInput.files[0];
  if (!file) { showResult(result, "<strong>Please select a ZIP file first.</strong>"); return; }
  if (!file.name.toLowerCase().endsWith(".zip")) { showResult(result, "<strong>Only ZIP files are supported.</strong>"); return; }
  inspectBtn.disabled = true; inspectBtn.textContent = "Inspecting…";
  try {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/inspect", {method:"POST", body:fd});
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Inspection failed");
    inspection = data; buildBtn.disabled = false;
    const projects = data.projects.map(p => `<li><strong>${escapeHtml(p.label)}</strong><br><span class="muted">Suggested targets: ${p.targets.length ? p.targets.join(", ").toUpperCase() : "manual setup needed"}</span></li>`).join("");
    showResult(result, `<h3>Inspection complete</h3><div>${escapeHtml(data.filename)}</div><div class="muted">${data.file_count} files · ${data.expanded_mb} MB expanded</div><ul>${projects}</ul><div class="muted">${escapeHtml(data.message)}</div>`);
  } catch (e) {
    inspection = null; buildBtn.disabled = true;
    showResult(result, `<strong>Could not inspect ZIP</strong><br>${escapeHtml(e.message)}`);
  } finally { inspectBtn.disabled = false; inspectBtn.textContent = "Inspect project"; }
});

buildBtn.addEventListener("click", async () => {
  if (!inspection) return;
  const project = inspection.projects[0];
  buildBtn.disabled = true; buildBtn.textContent = "Checking build worker…";
  try {
    const res = await fetch("/api/build", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({target, project_type:project.type, filename:inspection.filename})
    });
    const data = await res.json();
    showResult(buildResult, `<h3>${data.status === "ready" ? "Build started" : "Build worker required"}</h3><p>${escapeHtml(data.message || "No build result returned.")}</p>`);
  } catch(e) {
    showResult(buildResult, `<strong>Server error</strong><br>${escapeHtml(e.message)}`);
  } finally { buildBtn.disabled = false; buildBtn.textContent = "Request build"; }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/assets/sw.js").catch(()=>{}));
}
