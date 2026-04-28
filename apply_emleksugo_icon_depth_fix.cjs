/*
  EmlékSúgó 2.0_FIX icon depth fix
  Javítja a Tauri build hibát:
  "Unsupported PNG bit depth: Sixteen"
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PATCH_DIR = __dirname;
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const backupRoot = path.join(ROOT, `.emleksugo_icon_backup_${stamp}`);

function log(...args) { console.log('[EmlékSúgó icon fix]', ...args); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function exists(p) { return fs.existsSync(p); }
function copyFile(src, dst) { ensureDir(path.dirname(dst)); fs.copyFileSync(src, dst); }

function copyDir(src, dst) {
  ensureDir(dst);
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
}

function backupDir(src, dst) {
  if (!exists(src)) return;
  copyDir(src, dst);
}

const srcIcons = path.join(PATCH_DIR, 'src-tauri', 'icons');
const dstIcons = path.join(ROOT, 'src-tauri', 'icons');
if (!exists(srcIcons)) {
  console.error('Hiányzik a patch ikonmappája:', srcIcons);
  process.exit(1);
}

ensureDir(backupRoot);
backupDir(dstIcons, path.join(backupRoot, 'src-tauri', 'icons'));
copyDir(srcIcons, dstIcons);

const confPath = path.join(ROOT, 'src-tauri', 'tauri.conf.json');
if (exists(confPath)) {
  const raw = fs.readFileSync(confPath, 'utf8');
  const conf = JSON.parse(raw);
  conf.bundle = conf.bundle || {};
  conf.bundle.icon = [
    'icons/32x32.png',
    'icons/128x128.png',
    'icons/128x128@2x.png',
    'icons/icon.ico'
  ];
  fs.writeFileSync(confPath, JSON.stringify(conf, null, 2) + '\n', 'utf8');
  log('tauri.conf.json ikonlista ellenőrizve/javítva');
}

log('régi ikonok mentése:', backupRoot);
log('8-bit RGBA ikonok bemásolva: src-tauri/icons');
log('Most futtasd: npm run tauri build');
