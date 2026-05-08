use tauri::Window;

#[tauri::command]
#[allow(non_snake_case)]
pub fn es_save_project_as(defaultFilename: String, contents: String) -> Result<Option<String>, String> {
    let mut default_name = defaultFilename.trim().to_string();
    if default_name.is_empty() {
        default_name = "Szigligeti_DSZA.dsa".to_string();
    }

    let lower = default_name.to_lowercase();
    if !lower.ends_with(".dsa") && !lower.ends_with(".esp") && !lower.ends_with(".json") {
        default_name.push_str(".dsa");
    }

    let picked = rfd::FileDialog::new()
        .set_title("Szigligeti DSZA projekt mentése")
        .add_filter("Szigligeti DSZA Projekt", &["dsa"])
        .add_filter("Régi EmlékSúgó Projekt", &["esp"])
        .add_filter("JSON", &["json"])
        .set_file_name(&default_name)
        .save_file();

    let Some(mut path) = picked else {
        return Ok(None);
    };

    if path.extension().is_none() {
        path.set_extension("dsa");
    }

    std::fs::write(&path, contents)
        .map_err(|err| format!("Nem sikerült menteni a projektfájlt: {}", err))?;

    Ok(Some(path.to_string_lossy().to_string()))
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
