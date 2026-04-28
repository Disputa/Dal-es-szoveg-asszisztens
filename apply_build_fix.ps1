# EmlékSúgó 2.0_FIX build javító patch
# Futtatás: projekt gyökeréből: powershell -ExecutionPolicy Bypass -File .\apply_build_fix.ps1
$ErrorActionPreference = "Stop"
$root = Get-Location
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $root "_backup_before_build_fix_$stamp"
New-Item -ItemType Directory -Force -Path $backup | Out-Null

function Backup-IfExists($relative) {
  $src = Join-Path $root $relative
  if (Test-Path $src) {
    $dst = Join-Path $backup $relative
    New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null
    Copy-Item $src $dst -Recurse -Force
  }
}

Backup-IfExists "src-tauri\tauri.conf.json"
Backup-IfExists "src-tauri\Cargo.toml"
Backup-IfExists "src-tauri\src\lib.rs"
Backup-IfExists "src-tauri\capabilities\default.json"
Backup-IfExists "package.json"
Backup-IfExists "public"
Backup-IfExists "src-tauri\icons"

Write-Host "Backup készült: $backup"

# 1) ikonok + nyitókép stabil public assetként
New-Item -ItemType Directory -Force -Path "src-tauri\icons" | Out-Null
Copy-Item ".\src-tauri\icons\*" "src-tauri\icons\" -Recurse -Force
New-Item -ItemType Directory -Force -Path "public" | Out-Null
Copy-Item ".\public\nyitokep.png" "public\nyitokep.png" -Force

# 2) capability csere
New-Item -ItemType Directory -Force -Path "src-tauri\capabilities" | Out-Null
Copy-Item ".\src-tauri\capabilities\default.json" "src-tauri\capabilities\default.json" -Force

# 3) plugin npm oldalon
npm install @tauri-apps/plugin-dialog @tauri-apps/plugin-fs

# 4) plugin Rust oldalon
Push-Location "src-tauri"
cargo add tauri-plugin-dialog
cargo add tauri-plugin-fs
Pop-Location

# 5) verziók package.json-ben
node -e "const fs=require('fs');const p='package.json';let j=JSON.parse(fs.readFileSync(p,'utf8'));j.version='2.0.0';fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');"

# 6) Cargo package version
$Cargo = "src-tauri\Cargo.toml"
$text = Get-Content $Cargo -Raw
$text = $text -replace '(?m)^version\s*=\s*"[^"]+"', 'version = "2.0.0"'
Set-Content $Cargo $text -Encoding UTF8

# 7) tauri.conf fő mezők + ikonok + bundle név
node - <<'NODE'
const fs = require('fs');
const path = 'src-tauri/tauri.conf.json';
const conf = JSON.parse(fs.readFileSync(path, 'utf8'));
conf.productName = 'EmlékSúgó 2.0_FIX';
conf.version = '2.0.0';
conf.identifier = 'hu.deme.emleksugo.v2fix';
conf.build = conf.build || {};
conf.build.frontendDist = '../dist';
conf.app = conf.app || {};
conf.app.windows = conf.app.windows || [{ label:'main' }];
conf.app.windows[0] = { ...conf.app.windows[0], label: conf.app.windows[0].label || 'main', title: 'EmlékSúgó 2.0_FIX' };
conf.app.security = conf.app.security || {};
conf.app.security.csp = null;
conf.bundle = conf.bundle || {};
conf.bundle.active = true;
conf.bundle.targets = conf.bundle.targets || ['msi','nsis'];
conf.bundle.icon = ['icons/32x32.png','icons/128x128.png','icons/128x128@2x.png','icons/icon.ico'];
conf.bundle.publisher = conf.bundle.publisher || 'Deme Gábor';
conf.bundle.shortDescription = 'EmlékSúgó 2.0_FIX';
conf.bundle.longDescription = 'EmlékSúgó koncert-súgó rendszer - V2 working fixed build.';
conf.bundle.fileAssociations = [{ ext:['esp'], name:'EmlékSúgóProjekt', description:'EmlékSúgó projektfájl', role:'Editor' }];
fs.writeFileSync(path, JSON.stringify(conf, null, 2) + '\n');
NODE

# 8) lib.rs ellenőrzés: automatikusan csak akkor szúrunk, ha még nincs benne
$lib = "src-tauri\src\lib.rs"
$libText = Get-Content $lib -Raw
if ($libText -notmatch 'tauri_plugin_dialog::init\(\)') {
  $libText = $libText -replace '(tauri::Builder::default\(\))', '$1`n        .plugin(tauri_plugin_dialog::init())'
}
if ($libText -notmatch 'tauri_plugin_fs::init\(\)') {
  $libText = $libText -replace '(tauri::Builder::default\(\)(?:\r?\n\s*\.plugin\(tauri_plugin_dialog::init\(\)\))?)', '$1`n        .plugin(tauri_plugin_fs::init())'
}
Set-Content $lib $libText -Encoding UTF8

# 9) nyitókép referencia javítás a forrásban: a hash-elt asset helyett public/nyitokep.png
$files = Get-ChildItem -Recurse -Include *.js,*.ts,*.jsx,*.tsx,*.html,*.css -Path src,index.html,display.html -ErrorAction SilentlyContinue
foreach ($f in $files) {
  $c = Get-Content $f.FullName -Raw
  $n = $c -replace '(\.\/|\/)?assets\/nyitokep-[A-Za-z0-9_-]+(?:-[A-Za-z0-9_-]+)?\.png', '/nyitokep.png'
  $n = $n -replace 'nyitokep-BZQKLQ9t(?:-BZQKLQ9t)?\.png', 'nyitokep.png'
  if ($n -ne $c) { Set-Content $f.FullName $n -Encoding UTF8 }
}

Write-Host "Patch lefutott. Most jöhet: npm run tauri build"
