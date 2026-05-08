mod emleksugo_commands;
use emleksugo_commands::{
    es_pick_import_file, es_save_project_as, es_window_close, es_window_minimize, es_window_toggle,
};
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            es_save_project_as,
            es_pick_import_file,
            es_window_close,
            es_window_minimize,
            es_window_toggle
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
