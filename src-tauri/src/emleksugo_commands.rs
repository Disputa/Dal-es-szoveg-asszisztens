use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Window;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportReadResult {
    file_name: String,
    extension: String,
    text: Option<String>,
    bytes: Option<Vec<u8>>,
    mime_type: Option<String>,
    source: String,
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn es_save_project_as(
    defaultFilename: String,
    contents: String,
) -> Result<Option<String>, String> {
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
pub fn es_pick_import_file() -> Result<Option<ImportReadResult>, String> {
    let picked = rfd::FileDialog::new()
        .set_title("Szigligeti DSZA import")
        .add_filter(
            "DSZA import",
            &[
                "txt", "docx", "pdf", "odt", "pages", "png", "jpg", "jpeg", "webp", "tif", "tiff",
                "bmp",
            ],
        )
        .add_filter("Szövegfájl", &["txt"])
        .add_filter("Dokumentum", &["docx", "odt", "pages", "pdf"])
        .add_filter(
            "Kép / OCR",
            &["png", "jpg", "jpeg", "webp", "tif", "tiff", "bmp"],
        )
        .pick_file();

    let Some(path) = picked else {
        return Ok(None);
    };

    read_import_path(&path).map(Some)
}

#[tauri::command]
pub fn es_window_minimize(window: Window) -> Result<(), String> {
    if window.is_fullscreen().map_err(|err| err.to_string())? {
        window
            .set_fullscreen(false)
            .map_err(|err| err.to_string())?;
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

fn read_import_path(path: &Path) -> Result<ImportReadResult, String> {
    let file_name = path
        .file_name()
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_else(|| "import".to_string());
    let extension = path
        .extension()
        .map(|value| value.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    match extension.as_str() {
        "txt" => Ok(ImportReadResult {
            file_name,
            extension,
            text: Some(read_text_lossy(path)?),
            bytes: None,
            mime_type: Some("text/plain".to_string()),
            source: "native-text".to_string(),
        }),
        "docx" | "odt" | "pages" => match convert_document_with_libreoffice(path, &extension) {
            Ok(text) if !text.trim().is_empty() => Ok(ImportReadResult {
                file_name,
                extension: extension.clone(),
                text: Some(text),
                bytes: None,
                mime_type: Some(mime_type_for_extension(&extension).to_string()),
                source: "libreoffice".to_string(),
            }),
            _ => read_import_bytes(path, file_name, extension, "native-bytes"),
        },
        "png" | "jpg" | "jpeg" | "webp" | "tif" | "tiff" | "bmp" => {
            match read_image_text_with_native_ocr(path) {
                Ok(text) if !text.trim().is_empty() => Ok(ImportReadResult {
                    file_name,
                    extension: extension.clone(),
                    text: Some(text),
                    bytes: None,
                    mime_type: Some(mime_type_for_extension(&extension).to_string()),
                    source: "native-ocr".to_string(),
                }),
                _ => read_import_bytes(path, file_name, extension, "native-image-bytes"),
            }
        }
        "pdf" => Ok(ImportReadResult {
            file_name,
            extension,
            text: Some(read_pdf_text(path)?),
            bytes: None,
            mime_type: Some("application/pdf".to_string()),
            source: "native-pdf".to_string(),
        }),
        _ => Err("Nem támogatott importformátum.".to_string()),
    }
}

fn read_import_bytes(
    path: &Path,
    file_name: String,
    extension: String,
    source: &str,
) -> Result<ImportReadResult, String> {
    let bytes =
        std::fs::read(path).map_err(|err| format!("Nem sikerült beolvasni a fájlt: {}", err))?;
    Ok(ImportReadResult {
        file_name,
        extension: extension.clone(),
        text: None,
        bytes: Some(bytes),
        mime_type: Some(mime_type_for_extension(&extension).to_string()),
        source: source.to_string(),
    })
}

fn read_text_lossy(path: &Path) -> Result<String, String> {
    let bytes = std::fs::read(path)
        .map_err(|err| format!("Nem sikerült beolvasni a szövegfájlt: {}", err))?;
    Ok(String::from_utf8_lossy(&bytes).to_string())
}

fn read_pdf_text(path: &Path) -> Result<String, String> {
    pdf_extract::extract_text(path)
        .map_err(|err| format!("Nem sikerült PDF szöveget kinyerni: {}", err))
}

fn convert_document_with_libreoffice(path: &Path, extension: &str) -> Result<String, String> {
    let office =
        find_libreoffice_binary().ok_or_else(|| "LibreOffice nem található.".to_string())?;
    let workspace = make_temp_import_dir("lo")?;
    let profile_dir = workspace.join("profile");
    let output_dir = workspace.join("out");
    std::fs::create_dir_all(&profile_dir).map_err(|err| err.to_string())?;
    std::fs::create_dir_all(&output_dir).map_err(|err| err.to_string())?;

    let input_path = workspace.join(format!("input.{}", extension));
    std::fs::copy(path, &input_path)
        .map_err(|err| format!("Nem sikerült előkészíteni a LibreOffice importot: {}", err))?;

    let output = {
        let mut command = Command::new(&office);
        if let Some(parent) = office.parent() {
            command.current_dir(parent);
        }
        command
            .arg(format!("-env:UserInstallation={}", file_uri(&profile_dir)))
            .arg("--headless")
            .arg("--invisible")
            .arg("--norestore")
            .arg("--nodefault")
            .arg("--nolockcheck")
            .arg("--nofirststartwizard")
            .arg("--convert-to")
            .arg("txt:Text")
            .arg("--outdir")
            .arg(&output_dir)
            .arg(&input_path)
            .output()
            .map_err(|err| format!("LibreOffice nem indítható: {}", err))?
    };

    let txt_path = output_dir.join("input.txt");
    if !txt_path.exists() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        let _ = std::fs::remove_dir_all(&workspace);
        return Err(format!(
            "LibreOffice nem készített szövegkimenetet. {} {}",
            stdout.trim(),
            stderr.trim()
        ));
    }

    let text = read_text_lossy(&txt_path)?;
    let _ = std::fs::remove_dir_all(&workspace);
    Ok(text)
}

fn find_libreoffice_binary() -> Option<PathBuf> {
    if let Ok(path) = std::env::var("LIBREOFFICE_PATH") {
        let candidate = PathBuf::from(path);
        if candidate.exists() {
            return Some(candidate);
        }
    }

    let candidates = if cfg!(target_os = "windows") {
        vec![
            r"C:\Program Files\LibreOffice\program\soffice.com",
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.com",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        ]
    } else if cfg!(target_os = "macos") {
        vec![
            "/Applications/LibreOffice.app/Contents/MacOS/soffice",
            "/opt/homebrew/bin/soffice",
            "/usr/local/bin/soffice",
        ]
    } else {
        vec![
            "/usr/bin/libreoffice",
            "/usr/bin/soffice",
            "/snap/bin/libreoffice",
        ]
    };

    candidates
        .into_iter()
        .map(PathBuf::from)
        .find(|candidate| candidate.exists())
}

fn read_image_text_with_native_ocr(path: &Path) -> Result<String, String> {
    if let Some(text) = read_image_text_with_tesseract(path)? {
        return Ok(text);
    }

    #[cfg(target_os = "windows")]
    {
        return read_image_text_with_windows_ocr(path);
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = path;
        Err("Nincs elérhető natív OCR motor.".to_string())
    }
}

fn read_image_text_with_tesseract(path: &Path) -> Result<Option<String>, String> {
    let candidates = if cfg!(target_os = "windows") {
        vec![
            PathBuf::from(r"C:\Program Files\Tesseract-OCR\tesseract.exe"),
            PathBuf::from(r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"),
        ]
    } else {
        vec![
            PathBuf::from("/usr/bin/tesseract"),
            PathBuf::from("/opt/homebrew/bin/tesseract"),
        ]
    };
    let Some(binary) = candidates.into_iter().find(|candidate| candidate.exists()) else {
        return Ok(None);
    };

    let output = Command::new(binary)
        .arg(path)
        .arg("stdout")
        .arg("-l")
        .arg("hun+eng")
        .output()
        .map_err(|err| format!("Tesseract OCR nem indítható: {}", err))?;
    if !output.status.success() {
        return Ok(None);
    }
    Ok(Some(String::from_utf8_lossy(&output.stdout).to_string()))
}

#[cfg(target_os = "windows")]
fn read_image_text_with_windows_ocr(path: &Path) -> Result<String, String> {
    let script = WINDOWS_OCR_SCRIPT.replace(
        "__PATH__",
        &escape_powershell_single(&path.to_string_lossy()),
    );
    let output = Command::new("powershell.exe")
        .arg("-NoProfile")
        .arg("-ExecutionPolicy")
        .arg("Bypass")
        .arg("-Command")
        .arg(script)
        .output()
        .map_err(|err| format!("Windows OCR nem indítható: {}", err))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[cfg(target_os = "windows")]
const WINDOWS_OCR_SCRIPT: &str = r#"
$ErrorActionPreference = 'Stop'
$path = '__PATH__'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Storage.FileAccessMode, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$taskMethods = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' }
function Await-WinRt($operation, $resultType) {
  $method = $script:taskMethods | Where-Object { $_.IsGenericMethodDefinition -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
  $task = $method.MakeGenericMethod($resultType).Invoke($null, @($operation))
  $task.Wait()
  return $task.Result
}
$file = Await-WinRt ([Windows.Storage.StorageFile]::GetFileFromPathAsync($path)) ([Windows.Storage.StorageFile])
$stream = Await-WinRt ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$decoder = Await-WinRt ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bitmap = Await-WinRt ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if ($null -eq $engine) { throw 'Nincs Windows OCR nyelvi motor.' }
$result = Await-WinRt ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
$result.Lines | ForEach-Object { $_.Text }
"#;

fn make_temp_import_dir(prefix: &str) -> Result<PathBuf, String> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|err| err.to_string())?
        .as_millis();
    let dir = std::env::temp_dir().join(format!(
        "szigligeti_dsza_{}_{}_{}",
        prefix,
        std::process::id(),
        now
    ));
    std::fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    Ok(dir)
}

fn file_uri(path: &Path) -> String {
    let normalized = path.to_string_lossy().replace('\\', "/");
    if cfg!(target_os = "windows") {
        format!("file:///{}", normalized)
    } else {
        format!("file://{}", normalized)
    }
}

fn escape_powershell_single(value: &str) -> String {
    value.replace('\'', "''")
}

fn mime_type_for_extension(extension: &str) -> &'static str {
    match extension {
        "txt" => "text/plain",
        "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "odt" => "application/vnd.oasis.opendocument.text",
        "pdf" => "application/pdf",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "tif" | "tiff" => "image/tiff",
        "bmp" => "image/bmp",
        _ => "application/octet-stream",
    }
}
