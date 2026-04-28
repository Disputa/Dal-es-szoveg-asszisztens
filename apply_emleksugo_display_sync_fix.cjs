/*
  EmlékSúgó 2.0_FIX Display2 szinkron javítás
  Futtatás a projekt gyökerében:
    node .\apply_emleksugo_display_sync_fix.cjs
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const backupRoot = path.join(ROOT, `.emleksugo_display_sync_backup_${stamp}`);
const log = (...args) => console.log('[EmlékSúgó Display2 fix]', ...args);

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

function uniquePush(arr, value) {
  if (!arr.includes(value)) arr.push(value);
}

function patchCapabilities() {
  const capDir = path.join(ROOT, 'src-tauri', 'capabilities');
  if (!exists(capDir)) throw new Error('Hiányzik: src-tauri/capabilities');
  const files = listFiles(capDir, p => p.endsWith('.json'));
  let changed = 0;
  for (const file of files) {
    let obj;
    try { obj = JSON.parse(read(file)); }
    catch { log(`FIGYELEM: nem JSON capability, kihagyva: ${file}`); continue; }
    backupFile(file);
    if (!Array.isArray(obj.windows)) obj.windows = [];
    uniquePush(obj.windows, 'main');
    uniquePush(obj.windows, 'display');
    // A program tényleges Display2 window-labelje ez. Enélkül a Display2 betöltődik,
    // de a Tauri event listen/emit jogai nem biztos, hogy élnek rajta.
    uniquePush(obj.windows, 'emlek-sugo-display');

    if (!Array.isArray(obj.permissions)) obj.permissions = [];
    for (const perm of [
      'core:default',
      'core:event:default',
      'core:event:allow-emit',
      'core:event:allow-emit-to',
      'core:event:allow-listen',
      'core:event:allow-unlisten',
      'core:window:default',
      'core:window:allow-show',
      'core:window:allow-set-focus',
      'core:window:allow-set-size',
      'core:window:allow-set-position',
      'core:window:allow-set-fullscreen',
      'core:window:allow-is-fullscreen',
      'core:window:allow-get-all-windows',
      'core:webview:default',
      'core:webview:allow-create-webview-window'
    ]) uniquePush(obj.permissions, perm);

    // Régi hibás plugin permissionök ne jöjjenek vissza.
    obj.permissions = obj.permissions.filter((perm) => {
      if (typeof perm === 'string') return !perm.startsWith('dialog:') && !perm.startsWith('fs:');
      if (perm && typeof perm === 'object' && typeof perm.identifier === 'string') {
        return !perm.identifier.startsWith('dialog:') && !perm.identifier.startsWith('fs:');
      }
      return true;
    });

    write(file, JSON.stringify(obj, null, 2) + '\n');
    changed++;
  }
  log(`capability ablaklabel + event jogok javítva: ${changed} fájl`);
}

function patchMainJs() {
  const files = listFiles(ROOT, p => p.endsWith('.js'));
  let changed = 0;
  for (const file of files) {
    let s = read(file);
    const original = s;
    const isLikelyMain = s.includes('emlek-sugo-display') && s.includes('display:block') && s.includes('async function ct()');
    if (!isLikelyMain) continue;

    // Display2 kész/jelentkezik -> főablak újraküldi az aktuális blokkot.
    if (!s.includes('display:request-state') && s.includes('async function pn(){')) {
      s = s.replace('async function pn(){',
`async function pn(){await Kt("display:ready",async()=>{setTimeout(()=>ct().catch(()=>{}),80);setTimeout(()=>ct().catch(()=>{}),350);setTimeout(()=>ct().catch(()=>{}),900)}),await Kt("display:request-state",async()=>{setTimeout(()=>ct().catch(()=>{}),60);setTimeout(()=>ct().catch(()=>{}),300)}),`);
    }

    // Display2 nyitás után ne csak egyszer küldjön, mert a fullscreen/második monitorra rakás közben
    // a listener néha még nincs kész. Többször küldi ugyanazt az állapotot: nem ront, csak stabilizál.
    const oldOpen = 'await zn(),await ct(),await Et("▶ Kijelző aktív")';
    const newOpen = 'await zn(),await ct(),setTimeout(()=>ct().catch(()=>{}),250),setTimeout(()=>ct().catch(()=>{}),700),setTimeout(()=>ct().catch(()=>{}),1200),await Et("▶ Kijelző aktív")';
    if (s.includes(oldOpen) && !s.includes('setTimeout(()=>ct().catch(()=>{}),1200)')) {
      s = s.replace(oldOpen, newOpen);
    }

    if (s !== original) {
      backupFile(file);
      write(file, s);
      changed++;
    }
  }
  log(`főképernyős JS Display2 újraküldés javítva: ${changed} fájl`);
}

function patchDisplayJs() {
  const files = listFiles(ROOT, p => p.endsWith('.js'));
  let changed = 0;
  for (const file of files) {
    let s = read(file);
    const original = s;
    const isLikelyDisplay = s.includes('h("display:block"') && s.includes('display:overlay') && s.includes('contentWrap');
    if (!isLikelyDisplay) continue;

    if (!s.includes('display:ready') && s.includes('h("display:block",')) {
      // A Display2 betöltés után jelzi, hogy kész, majd többször kér állapotot.
      // Így nem veszhet el az első küldés, ha a window már látszik, de a listener még nem futott fel.
      const marker = 'h("display:block",o=>{F(o.payload||{})});';
      const inject = 'setTimeout(()=>m("display:ready",{ts:Date.now()}).catch(()=>{}),50);setTimeout(()=>m("display:request-state",{ts:Date.now()}).catch(()=>{}),250);setTimeout(()=>m("display:request-state",{ts:Date.now()}).catch(()=>{}),900);';
      if (s.includes(marker)) s = s.replace(marker, marker + inject);
    }

    if (s !== original) {
      backupFile(file);
      write(file, s);
      changed++;
    }
  }
  log(`Display2 JS ready/request-state javítva: ${changed} fájl`);
}

function main() {
  log(`backup mappa: ${backupRoot}`);
  ensureDir(backupRoot);
  patchCapabilities();
  patchMainJs();
  patchDisplayJs();
  log('KÉSZ. Most futtasd: npm run tauri build');
}

try { main(); }
catch (err) {
  console.error('\n[EmlékSúgó Display2 fix HIBA]', err.message || err);
  process.exit(1);
}
