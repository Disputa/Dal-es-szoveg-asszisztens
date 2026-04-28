/*
  EmlékSúgó 2.0_FIX final build patch
  Futtatás a projekt gyökerében:
    node apply_emleksugo_2_0_final_build_fix.js
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PATCH_DIR = __dirname;
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const backupRoot = path.join(ROOT, `.emleksugo_backup_${stamp}`);
const log = (...args) => console.log('[EmlékSúgó patch]', ...args);

function exists(p) { return fs.existsSync(p); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, s) { ensureDir(path.dirname(p)); fs.writeFileSync(p, s, 'utf8'); }
function copyFile(src, dst) { ensureDir(path.dirname(dst)); fs.copyFileSync(src, dst); }
function backupFile(p) {
  if (!exists(p)) return;
  const rel = path.relative(ROOT, p);
  const dst = path.join(backupRoot, rel);
  ensureDir(path.dirname(dst));
  fs.copyFileSync(p, dst);
}
function copyDir(src, dst) {
  if (!exists(src)) return;
  ensureDir(dst);
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
}
function listFiles(dir, pred, out = []) {
  if (!exists(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (['node_modules', 'target', '.git'].includes(ent.name)) continue;
      listFiles(p, pred, out);
    } else if (!pred || pred(p)) out.push(p);
  }
  return out;
}

function sanitizeCapabilityObject(obj) {
  if (!Array.isArray(obj.permissions)) obj.permissions = [];
  obj.permissions = obj.permissions.filter((perm) => {
    if (typeof perm === 'string') return !perm.startsWith('dialog:') && !perm.startsWith('fs:');
    if (perm && typeof perm === 'object' && typeof perm.identifier === 'string') {
      return !perm.identifier.startsWith('dialog:') && !perm.identifier.startsWith('fs:');
    }
    return true;
  });
  const must = [
    'core:default',
    'core:event:default',
    'core:event:allow-emit',
    'core:event:allow-emit-to',
    'core:event:allow-listen',
    'core:event:allow-unlisten',
    'core:window:default',
    'core:window:allow-close',
    'core:window:allow-destroy',
    'core:window:allow-minimize',
    'core:window:allow-unminimize',
    'core:window:allow-maximize',
    'core:window:allow-unmaximize',
    'core:window:allow-toggle-maximize',
    'core:window:allow-is-fullscreen',
    'core:window:allow-set-fullscreen',
    'core:window:allow-is-maximized',
    'core:window:allow-set-size',
    'core:window:allow-set-position',
    'core:window:allow-center',
    'core:window:allow-show',
    'core:window:allow-hide',
    'core:window:allow-set-focus',
    'core:window:allow-available-monitors',
    'core:window:allow-current-monitor',
    'core:window:allow-primary-monitor',
    'core:window:allow-get-all-windows',
    'core:webview:default',
    'core:webview:allow-create-webview-window'
  ];
  for (const p of must) if (!obj.permissions.includes(p)) obj.permissions.push(p);
  if (!obj.windows) obj.windows = ['main', 'display'];
  return obj;
}

function patchCapabilities() {
  const capDir = path.join(ROOT, 'src-tauri', 'capabilities');
  ensureDir(capDir);
  const defaultSrc = path.join(PATCH_DIR, 'src-tauri', 'capabilities', 'default.json');
  const defaultDst = path.join(capDir, 'default.json');
  backupFile(defaultDst);
  copyFile(defaultSrc, defaultDst);

  for (const file of listFiles(capDir, p => p.endsWith('.json'))) {
    backupFile(file);
    try {
      const obj = JSON.parse(read(file));
      const txt = JSON.stringify(sanitizeCapabilityObject(obj), null, 2);
      write(file, txt + '\n');
    } catch (e) {
      log(`FIGYELEM: nem JSON capability, kihagyva: ${file}`);
    }
  }
  log('capabilities javítva: dialog:/fs: permission eltávolítva minden capability fájlból');
}

function patchCargoToml() {
  const p = path.join(ROOT, 'src-tauri', 'Cargo.toml');
  if (!exists(p)) throw new Error('Hiányzik: src-tauri/Cargo.toml');
  backupFile(p);
  let s = read(p);
  s = s.replace(/^version\s*=\s*"[^"]+"/m, 'version = "2.0.0"');
  if (!/^\s*rfd\s*=\s*/m.test(s)) {
    if (/^\[dependencies\]\s*$/m.test(s)) {
      s = s.replace(/^\[dependencies\]\s*$/m, '[dependencies]\nrfd = "0.15"');
    } else {
      s += '\n[dependencies]\nrfd = "0.15"\n';
    }
  }
  write(p, s);
  log('Cargo.toml javítva: rfd hozzáadva, verzió 2.0.0');
}

function patchPackageJson() {
  const p = path.join(ROOT, 'package.json');
  if (!exists(p)) return;
  backupFile(p);
  try {
    const obj = JSON.parse(read(p));
    obj.version = '2.0.0';
    obj.name = obj.name || 'emlek-sugo';
    write(p, JSON.stringify(obj, null, 2) + '\n');
    log('package.json verzió javítva: 2.0.0');
  } catch (e) {
    log('FIGYELEM: package.json nem javítható automatikusan');
  }
}

function patchTauriConf() {
  const p = path.join(ROOT, 'src-tauri', 'tauri.conf.json');
  if (!exists(p)) throw new Error('Hiányzik: src-tauri/tauri.conf.json');
  backupFile(p);
  const obj = JSON.parse(read(p));
  obj.productName = 'EmlékSúgó 2.0_FIX';
  obj.version = '2.0.0';
  obj.identifier = obj.identifier || 'com.demegabor.emleksugo';
  obj.bundle = obj.bundle || {};
  obj.bundle.active = obj.bundle.active ?? true;
  obj.bundle.icon = [
    'icons/32x32.png',
    'icons/128x128.png',
    'icons/128x128@2x.png',
    'icons/icon.ico'
  ];
  write(p, JSON.stringify(obj, null, 2) + '\n');
  log('tauri.conf.json javítva: productName/version/icon');
}

function patchLibRs() {
  const p = path.join(ROOT, 'src-tauri', 'src', 'lib.rs');
  if (!exists(p)) throw new Error('Hiányzik: src-tauri/src/lib.rs');
  backupFile(p);
  let s = read(p);
  const modLine = 'mod emleksugo_commands;';
  const useLine = 'use emleksugo_commands::{es_save_project_as, es_window_close, es_window_minimize, es_window_toggle};';
  if (!s.includes(modLine)) {
    s = s.replace(/^(#!\[[^\n]+\]\s*)*/m, (m) => m + modLine + '\n');
  }
  if (!s.includes(useLine)) {
    const idx = s.indexOf(modLine);
    if (idx >= 0) {
      const end = s.indexOf('\n', idx) + 1;
      s = s.slice(0, end) + useLine + '\n' + s.slice(end);
    } else {
      s = useLine + '\n' + s;
    }
  }

  const commandNames = ['es_save_project_as', 'es_window_close', 'es_window_minimize', 'es_window_toggle'];
  if (/\.invoke_handler\s*\(\s*tauri::generate_handler!\s*!\s*\[/s.test(s)) {
    s = s.replace(/(\.invoke_handler\s*\(\s*tauri::generate_handler!\s*!\s*\[)([\s\S]*?)(\]\s*\))/m, (all, start, inner, end) => {
      let out = inner.trim();
      for (const name of commandNames) if (!new RegExp(`\\b${name}\\b`).test(out)) out += (out ? ', ' : '') + name;
      return start + out + end;
    });
  } else {
    const insert = `\n    .invoke_handler(tauri::generate_handler![\n      es_save_project_as,\n      es_window_close,\n      es_window_minimize,\n      es_window_toggle\n    ])`;
    if (s.includes('.run(tauri::generate_context!())')) {
      s = s.replace(/\n\s*\.run\(tauri::generate_context!\(\)\)/, insert + '\n    .run(tauri::generate_context!())');
    } else if (s.includes('.run(tauri::generate_context!')) {
      s = s.replace(/\n\s*\.run\(tauri::generate_context!/, insert + '\n    .run(tauri::generate_context!');
    } else {
      throw new Error('Nem találtam a .run(tauri::generate_context!()) sort a lib.rs-ben. Kézi patch kell.');
    }
  }
  write(p, s);
  copyFile(path.join(PATCH_DIR, 'src-tauri', 'src', 'emleksugo_commands.rs'), path.join(ROOT, 'src-tauri', 'src', 'emleksugo_commands.rs'));
  log('lib.rs javítva: natív Save As és ablakparancsok bekötve');
}

function patchFrontendJs() {
  const files = listFiles(ROOT, p => p.endsWith('.js') && !p.includes(`${path.sep}dist${path.sep}`));
  let changed = 0;
  for (const file of files) {
    let s = read(file);
    let original = s;
    // Stabil nyitókép: ne Vite-hash-elt asset legyen.
    s = s.replace(/new URL\(["']\.\/assets\/nyitokep[^"']*\.png["'],\s*document\.baseURI\)\.href/g, '"/nyitokep.png"');
    s = s.replace(/new URL\(["']\/assets\/nyitokep[^"']*\.png["'],\s*document\.baseURI\)\.href/g, '"/nyitokep.png"');
    s = s.replace(/['"]\.\/assets\/nyitokep[^'"]*\.png['"]/g, '"/nyitokep.png"');
    s = s.replace(/['"]\/assets\/nyitokep[^'"]*\.png['"]/g, '"/nyitokep.png"');

    if (s.includes('function esV3NativeSaveText')) {
      s = s.replace(/async function esV3NativeSaveText\([^)]*\)\{[\s\S]*?\}\nasync function esV3SaveProjectAs/m,
`async function esV3NativeSaveText(i,t){try{const n=await U("es_save_project_as",{defaultFilename:esV3EnsureEspExtension(i),contents:t});return n||null}catch(n){console.warn("Natív Rust Save As sikertelen:",n);throw new Error("A natív Save As mentés nem sikerült: "+(n?.message||n))}}\nasync function esV3SaveProjectAs`);
    }

    if (s.includes('async function es14MinimizeMainWindow')) {
      s = s.replace(/async function es14MinimizeMainWindow\(\)\{[\s\S]*?\}\nasync function es14ToggleMainWindowMode/m,
`async function es14MinimizeMainWindow(){try{await U("es_window_minimize",{});return}catch(i){console.warn("Tálcára rakás Rust paranccsal sem sikerült:",i)}}\nasync function es14ToggleMainWindowMode`);
      s = s.replace(/async function es14ToggleMainWindowMode\(\)\{[\s\S]*?\}\nasync function es14CloseMainWindow/m,
`async function es14ToggleMainWindowMode(){try{const i=await U("es_window_toggle",{});await es14UpdateWindowModeIcon(!!i);return}catch(i){console.warn("Ablakmód váltás Rust paranccsal sem sikerült:",i)}}\nasync function es14CloseMainWindow`);
      s = s.replace(/async function es14CloseMainWindow\(\)\{[\s\S]*?\}\nasync function es14UpdateWindowModeIcon/m,
`async function es14CloseMainWindow(){try{await U("es_window_close",{});return}catch(i){console.warn("Bezárás Rust paranccsal sem sikerült:",i)}}\nasync function es14UpdateWindowModeIcon`);
    }

    if (s !== original) {
      backupFile(file);
      write(file, s);
      changed++;
    }
  }
  log(`frontend JS javítva: ${changed} fájl`);
}

function patchHtmlAndPublic() {
  copyDir(path.join(PATCH_DIR, 'public'), path.join(ROOT, 'public'));
  copyDir(path.join(PATCH_DIR, 'src-tauri', 'icons'), path.join(ROOT, 'src-tauri', 'icons'));

  const htmls = listFiles(ROOT, p => /(^|[\\/])(index|display)\.html$/i.test(p) && !p.includes(`${path.sep}dist${path.sep}`));
  for (const file of htmls) {
    backupFile(file);
    let s = read(file);
    s = s.replace(/\.\/assets\/nyitokep[^'"\)]*\.png/g, '/nyitokep.png');
    s = s.replace(/\/assets\/nyitokep[^'"\)]*\.png/g, '/nyitokep.png');
    write(file, s);
  }
  log('public/nyitokep.png és ikonok bemásolva, HTML nyitókép útvonal javítva');
}

function main() {
  log(`backup mappa: ${backupRoot}`);
  ensureDir(backupRoot);
  patchCapabilities();
  patchCargoToml();
  patchPackageJson();
  patchTauriConf();
  patchLibRs();
  patchFrontendJs();
  patchHtmlAndPublic();
  log('KÉSZ. Most futtasd: npm run tauri build');
}

try { main(); }
catch (err) {
  console.error('\n[EmlékSúgó patch HIBA]', err.message || err);
  process.exit(1);
}
