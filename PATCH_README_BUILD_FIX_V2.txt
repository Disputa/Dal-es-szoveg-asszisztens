EmlékSúgó 2.0_FIX – buildhiba javító csomag

A mostani buildhibád oka:
- A src-tauri/capabilities/default.json már hivatkozik dialog/fs plugin jogosultságokra.
- De a projektben a dialog és fs plugin nincs Rust oldalon telepítve/regisztrálva.
- Ezért írja: Permission dialog:default not found.

Kötelező javítás:
1) Projekt gyökerében:
   npm install @tauri-apps/plugin-dialog @tauri-apps/plugin-fs

2) src-tauri mappában:
   cargo add tauri-plugin-dialog
   cargo add tauri-plugin-fs

3) src-tauri/src/lib.rs Builder láncába a .run(...) ELÉ:
   .plugin(tauri_plugin_dialog::init())
   .plugin(tauri_plugin_fs::init())

4) src-tauri/capabilities/default.json cserélhető a csomagban lévőre.

5) tauri.conf.json-ban:
   productName: "EmlékSúgó 2.0_FIX"
   version: "2.0.0"
   identifier: "hu.deme.emleksugo.v2fix"
   bundle.icon: icons/32x32.png, icons/128x128.png, icons/128x128@2x.png, icons/icon.ico

6) src-tauri/Cargo.toml [package] version:
   version = "2.0.0"

7) package.json version:
   "version": "2.0.0"

8) Nyitókép:
   public/nyitokep.png legyen a projektben.
   A forrásban ne assets/nyitokep-HASH.png legyen hardcode-olva, hanem /nyitokep.png.
   Így Vite build után nem kap új hash-t, és Tauri alatt is stabilan elérhető.

A csomagban van apply_build_fix.ps1 is. Ez backupot készít, majd megpróbálja a fenti lépéseket automatizálni.
