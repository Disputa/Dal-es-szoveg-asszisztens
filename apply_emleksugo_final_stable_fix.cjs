/*
  EmlékSúgó végső stabilizáló patch
  - Save As hiba javítása: rfd SaveFileDialog helyett név prompt + mappaválasztó + Rust írás
  - Display2 bezáró gomb visszaállítása

  Futtatás a projekt gyökerében:
    node .\apply_emleksugo_final_stable_fix.cjs
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const backupRoot = path.join(ROOT, `.emleksugo_final_stable_backup_${stamp}`);
const log = (...args) => console.log('[EmlékSúgó final fix]', ...args);

function exists(p) { return fs.existsSync(p); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, s) { ensureDir(path.dirname(p)); fs.writeFileSync(p, s, 'utf8'); }
function backupFile(p) {
  if (!exists(p)) return;
  const rel = path.relative(ROOT, p);
  const dst = path.join(backupRoot, rel);
  ensureDir(path.dirname(dst));
  fs.copyFileSync(p, dst);
}
function listFiles(dir, pred, out = []) {
  if (!exists(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (['node_modules', 'target', '.git', 'dist'].includes(ent.name)) continue;
      if (ent.name.startsWith('.emleksugo_')) continue;
      listFiles(p, pred, out);
    } else if (!pred || pred(p)) out.push(p);
  }
  return out;
}
function uniqueAppendCsv(inner, names) {
  let out = inner.trim();
  for (const name of names) {
    if (!new RegExp(`\\b${name}\\b`).test(out)) out += (out ? ', ' : '') + name;
  }
  return out;
}

const COMMANDS_RS = String.raw`use std::path::PathBuf;
use tauri::{AppHandle, Manager, Window};

fn ensure_project_extension(mut name: String) -> String {
    let lower = name.to_lowercase();
    if !lower.ends_with(".esp") && !lower.ends_with(".json") {
        name.push_str(".esp");
    }
    name
}

fn sanitize_project_filename(raw: &str) -> String {
    let mut name = raw.trim().to_string();
    if name.is_empty() {
        name = "EmlékSúgó.esp".to_string();
    }

    // Windows tiltott karakterek fájlnévben. Az ékezet maradhat, az teljesen legális.
    let invalid = ['\\\\', '/', ':', '*', '?', '"', '<', '>', '|'];
    name = name
        .chars()
        .map(|c| if invalid.contains(&c) { '_' } else { c })
        .collect::<String>();

    while name.ends_with('.') || name.ends_with(' ') {
        name.pop();
    }

    if name.is_empty() {
        name = "EmlékSúgó.esp".to_string();
    }

    ensure_project_extension(name)
}

fn write_project_file(path: PathBuf, contents: String) -> Result<String, String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|err| format!("Nem sikerült létrehozni a mentési mappát: {}", err))?;
    }

    std::fs::write(&path, contents)
        .map_err(|err| format!("Nem sikerült menteni a projektfájlt: {}", err))?;

    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn es_save_project_as(defaultFilename: String, contents: String) -> Result<Option<String>, String> {
    // Stabil fallback: a Windows SaveFileDialog néhány gépen "a fájl nem található" hibát dobott
    // új .esp fájlnál. Ezért itt nem SaveFileDialogot használunk, hanem mappaválasztót.
    let filename = sanitize_project_filename(&defaultFilename);
    let Some(folder) = rfd::FileDialog::new()
        .set_title("Válassz mappát az EmlékSúgó projekt mentéséhez")
        .pick_folder()
    else {
        return Ok(None);
    };

    let path = folder.join(filename);
    write_project_file(path, contents).map(Some)
}

#[tauri::command]
pub fn es_save_project_to_selected_folder(filename: String, contents: String) -> Result<Option<String>, String> {
    let filename = sanitize_project_filename(&filename);
    let Some(folder) = rfd::FileDialog::new()
        .set_title("Válassz mappát az EmlékSúgó projekt mentéséhez")
        .pick_folder()
    else {
        return Ok(None);
    };

    let path = folder.join(filename);
    write_project_file(path, contents).map(Some)
}

#[tauri::command]
pub fn es_window_minimize(window: Window) -> Result<(), String> {
    if window.is_fullscreen().map_err(|err| err.to_string())? {
        window.set_fullscreen(false).map_err(|err| err.to_string())?;
    }
    window.minimize().map_err(|err| err.to_string())
}

#[tauri::command]
pub fn es_window_toggle(window: Window) -> Result<bool, String> {
    let is_fullscreen = window.is_fullscreen().map_err(|err| err.to_string())?;
    window
        .set_fullscreen(!is_fullscreen)
        .map_err(|err| err.to_string())?;
    Ok(!is_fullscreen)
}

#[tauri::command]
pub fn es_window_close(window: Window) -> Result<(), String> {
    window.close().map_err(|err| err.to_string())
}

#[tauri::command]
pub fn es_close_window_by_label(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(&label) {
        win.close().map_err(|err| err.to_string())?;
        return Ok(());
    }
    Err(format!("Nem található ilyen ablak: {}", label))
}
`;

function patchCommandsRs() {
  const p = path.join(ROOT, 'src-tauri', 'src', 'emleksugo_commands.rs');
  backupFile(p);
  write(p, COMMANDS_RS);
  log('Rust parancsok javítva: mentés mappaválasztóval + Display2 ablak bezárása');
}

function patchLibRs() {
  const p = path.join(ROOT, 'src-tauri', 'src', 'lib.rs');
  if (!exists(p)) throw new Error('Hiányzik: src-tauri/src/lib.rs');
  backupFile(p);
  let s = read(p);

  const modLine = 'mod emleksugo_commands;';
  if (!s.includes(modLine)) {
    s = s.replace(/^(#!\[[^\n]+\]\s*)*/m, (m) => m + modLine + '\n');
  }

  // Régi import sorok eltávolítása, hogy ne legyen duplikáció.
  s = s.replace(/use\s+emleksugo_commands::\{[^}]*\};\s*\n/g, '');
  const useLine = 'use emleksugo_commands::{es_close_window_by_label, es_save_project_as, es_save_project_to_selected_folder, es_window_close, es_window_minimize, es_window_toggle};';
  const modIndex = s.indexOf(modLine);
  if (modIndex >= 0) {
    const end = s.indexOf('\n', modIndex) + 1;
    s = s.slice(0, end) + useLine + '\n' + s.slice(end);
  } else {
    s = useLine + '\n' + s;
  }

  const commands = [
    'es_save_project_as',
    'es_save_project_to_selected_folder',
    'es_window_close',
    'es_window_minimize',
    'es_window_toggle',
    'es_close_window_by_label'
  ];

  if (/\.invoke_handler\s*\(\s*tauri::generate_handler!\s*!\s*\[/s.test(s)) {
    s = s.replace(/(\.invoke_handler\s*\(\s*tauri::generate_handler!\s*!\s*\[)([\s\S]*?)(\]\s*\))/m,
      (all, start, inner, end) => start + uniqueAppendCsv(inner, commands) + end);
  } else {
    const insert = `\n    .invoke_handler(tauri::generate_handler![\n      ${commands.join(',\n      ')}\n    ])`;
    if (s.includes('.run(tauri::generate_context!())')) {
      s = s.replace(/\n\s*\.run\(tauri::generate_context!\(\)\)/, insert + '\n    .run(tauri::generate_context!())');
    } else if (s.includes('.run(tauri::generate_context!')) {
      s = s.replace(/\n\s*\.run\(tauri::generate_context!/, insert + '\n    .run(tauri::generate_context!');
    } else {
      throw new Error('Nem találtam a .run(tauri::generate_context!()) sort a lib.rs-ben.');
    }
  }

  write(p, s);
  log('lib.rs invoke_handler javítva az új parancsokkal');
}

function patchCargoToml() {
  const p = path.join(ROOT, 'src-tauri', 'Cargo.toml');
  if (!exists(p)) throw new Error('Hiányzik: src-tauri/Cargo.toml');
  backupFile(p);
  let s = read(p);
  if (!/^\s*rfd\s*=\s*/m.test(s)) {
    if (/^\[dependencies\]\s*$/m.test(s)) {
      s = s.replace(/^\[dependencies\]\s*$/m, '[dependencies]\nrfd = "0.15"');
    } else {
      s += '\n[dependencies]\nrfd = "0.15"\n';
    }
  }
  s = s.replace(/^version\s*=\s*"[^"]+"/m, 'version = "2.0.0"');
  write(p, s);
  log('Cargo.toml ellenőrizve: rfd megvan, verzió 2.0.0');
}

function patchMainJs() {
  const files = listFiles(ROOT, p => p.endsWith('.js'));
  let changed = 0;
  for (const file of files) {
    let s = read(file);
    const original = s;

    // Projektmentés: név prompt + mappaválasztó. Így nincs több Windows SaveFileDialog "fájl nem található" hiba.
    if (s.includes('function esV3NativeSaveText') || s.includes('async function esV3NativeSaveText')) {
      s = s.replace(/async function esV3NativeSaveText\([^)]*\)\{[\s\S]*?\}\nasync function esV3SaveProjectAs/m,
`async function esV3NativeSaveText(i,t){try{const base=typeof esV3EnsureEspExtension==="function"?esV3EnsureEspExtension(i||"EmlékSúgó.esp"):String(i||"EmlékSúgó.esp");const pickedName=window.prompt("Projektfájl neve (.esp):",base);if(!pickedName)return null;const safeName=typeof esV3EnsureEspExtension==="function"?esV3EnsureEspExtension(pickedName):pickedName;const n=await U("es_save_project_to_selected_folder",{filename:safeName,contents:t});return n||null}catch(n){console.warn("Natív mappaválasztós mentés sikertelen:",n);throw new Error("A projekt mentése nem sikerült: "+(n?.message||n))}}\nasync function esV3SaveProjectAs`);
    }

    // Display2 bezáró esemény főablaki oldala.
    const likelyMain = s.includes('emlek-sugo-display') || s.includes('display:block');
    if (likelyMain && s.includes('async function pn(){') && !s.includes('display:close-window')) {
      s = s.replace('async function pn(){',
`async function pn(){await Kt("display:close-window",async()=>{try{await U("es_close_window_by_label",{label:"emlek-sugo-display"})}catch(i){try{await U("es_close_window_by_label",{label:"display"})}catch(n){console.warn("Display2 bezárás sikertelen:",i,n)}}}),`);
    }

    if (s !== original) {
      backupFile(file);
      write(file, s);
      changed++;
    }
  }
  log(`főképernyős JS javítva: ${changed} fájl`);
}

function patchDisplayJs() {
  const files = listFiles(ROOT, p => p.endsWith('.js'));
  let changed = 0;
  const closeCode = String.raw`

/* EmlékSúgó final fix: Display2 bezáró gomb */
function esFinalEnsureDisplayCloseButton(){
  let b=document.getElementById("es-display-close-btn");
  if(b)return;
  b=document.createElement("button");
  b.id="es-display-close-btn";
  b.type="button";
  b.textContent="×";
  b.title="Kijelző bezárása";
  b.setAttribute("aria-label","Kijelző bezárása");
  b.style.cssText="position:fixed;top:10px;right:10px;z-index:2147483647;width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.55);color:#fff;font-size:24px;font-weight:700;line-height:28px;cursor:pointer;opacity:.72;backdrop-filter:blur(8px);";
  b.addEventListener("mouseenter",()=>{b.style.opacity="1"});
  b.addEventListener("mouseleave",()=>{b.style.opacity=".72"});
  b.addEventListener("click",async e=>{e.preventDefault();e.stopPropagation();try{await m("display:close-window",{ts:Date.now()})}catch(_){try{window.close()}catch(__){}}});
  document.body.appendChild(b);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",esFinalEnsureDisplayCloseButton);else esFinalEnsureDisplayCloseButton();
setTimeout(esFinalEnsureDisplayCloseButton,500);
`;

  for (const file of files) {
    let s = read(file);
    const original = s;
    const isDisplay = s.includes('h("display:block"') && s.includes('display:overlay') && s.includes('contentWrap') && s.includes('from"./event-');
    if (!isDisplay) continue;
    if (!s.includes('esFinalEnsureDisplayCloseButton')) {
      s += closeCode;
    }
    if (s !== original) {
      backupFile(file);
      write(file, s);
      changed++;
    }
  }
  log(`Display2 JS bezáró gomb javítva: ${changed} fájl`);
}

function patchCapabilities() {
  const capDir = path.join(ROOT, 'src-tauri', 'capabilities');
  if (!exists(capDir)) return;
  let changed = 0;
  for (const file of listFiles(capDir, p => p.endsWith('.json'))) {
    let obj;
    try { obj = JSON.parse(read(file)); } catch { continue; }
    const original = JSON.stringify(obj);
    if (!Array.isArray(obj.windows)) obj.windows = [];
    for (const w of ['main', 'display', 'emlek-sugo-display']) if (!obj.windows.includes(w)) obj.windows.push(w);
    if (!Array.isArray(obj.permissions)) obj.permissions = [];
    for (const perm of [
      'core:default',
      'core:event:default',
      'core:event:allow-emit',
      'core:event:allow-emit-to',
      'core:event:allow-listen',
      'core:event:allow-unlisten',
      'core:window:default',
      'core:window:allow-close',
      'core:window:allow-destroy',
      'core:window:allow-show',
      'core:window:allow-set-focus',
      'core:window:allow-get-all-windows',
      'core:webview:default',
      'core:webview:allow-create-webview-window'
    ]) if (!obj.permissions.includes(perm)) obj.permissions.push(perm);
    const next = JSON.stringify(obj);
    if (next !== original) {
      backupFile(file);
      write(file, JSON.stringify(obj, null, 2) + '\n');
      changed++;
    }
  }
  log(`capabilities ellenőrizve/javítva: ${changed} fájl`);
}

function main() {
  log(`backup mappa: ${backupRoot}`);
  ensureDir(backupRoot);
  patchCargoToml();
  patchCommandsRs();
  patchLibRs();
  patchCapabilities();
  patchMainJs();
  patchDisplayJs();
  log('KÉSZ. Most futtasd: npm run tauri build');
}

try { main(); }
catch (err) {
  console.error('\n[EmlékSúgó final fix HIBA]', err.message || err);
  process.exit(1);
}
