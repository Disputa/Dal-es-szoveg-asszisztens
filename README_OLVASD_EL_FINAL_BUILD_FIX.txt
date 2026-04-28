EmlékSúgó 2.0_FIX — FINAL BUILD FIX

A mostani hiba oka:
- A src-tauri/capabilities valamelyik JSON fájlja még mindig tartalmaz dialog:default sort.
- A projekt Rust oldala közben nem ismeri a dialog plugint, ezért a Tauri build azonnal megáll.

Ez a patch NEM a dialog/fs pluginokra épít.
Helyette natív Rust parancsot használ:
- es_save_project_as: Save As .esp dialógus + fájlírás
- es_window_minimize: tálcára rakás
- es_window_toggle: ablak/teljes képernyő váltás
- es_window_close: bezárás

HASZNÁLAT:
1. A ZIP tartalmát másold a projekt gyökerébe:
   C:\Users\Deme\Desktop\CODEING\EmlékSúgó_clean

2. PowerShellben ugyanitt futtasd:
   node apply_emleksugo_2_0_final_build_fix.js

3. Utána:
   npm run tauri build

Mit csinál:
- backupot készít .emleksugo_backup_YYYYMMDDHHMMSS néven
- minden capability fájlból kiveszi a dialog:/fs: permissionöket
- beköti a Rust oldali saját Save As és ablakparancsokat
- tauri.conf.json: productName = EmlékSúgó 2.0_FIX, version = 2.0.0
- Cargo.toml: rfd = 0.15, version = 2.0.0
- nyitókép: public/nyitokep.png stabil útvonalra állítva
- ikonokat bemásolja src-tauri/icons alá
