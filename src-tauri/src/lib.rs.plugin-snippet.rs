// src-tauri/src/lib.rs – ensure these plugins are registered in Builder
// Keep your existing commands/plugins; add these two .plugin(...) lines before .run(...).

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
