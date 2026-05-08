import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  DEFAULT_DISPLAY_BACKGROUND,
  getDisplayBackgroundColorId,
  normalizeDisplayBackground,
} from "../src/core/displayBackgrounds.js";
import {
  SUPPORTED_IMPORT_ACCEPT,
  isSupportedImportFileName,
  normalizeImportedText,
} from "../src/core/textImporters.js";

const requiredExtensions = [".txt", ".docx", ".pdf", ".odt", ".pages", ".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"];
for (const extension of requiredExtensions) {
  assert.ok(
    SUPPORTED_IMPORT_ACCEPT.includes(extension),
    `Az import accept listából hiányzik: ${extension}`
  );
  assert.equal(
    isSupportedImportFileName(`sample${extension}`),
    true,
    `Az import ellenőrző nem fogadja: ${extension}`
  );
}

assert.equal(
  normalizeImportedText("  Első\t sor\r\n\r\n\r\nMásodik   sor  "),
  "Első sor\n\nMásodik sor",
  "Az importált szöveg normalizálása hibás."
);

const defaultBackground = normalizeDisplayBackground();
assert.deepEqual(defaultBackground, DEFAULT_DISPLAY_BACKGROUND, "A DSZA alap háttere a Szigligeti logós fekete háttér legyen.");
assert.equal(normalizeDisplayBackground({ mode: "color", color: "#0b3a78" }).mode, "color");
assert.equal(getDisplayBackgroundColorId("#7f1d1d"), "red", "A piros homogén háttér legyen választható.");
assert.equal(
  normalizeDisplayBackground({ mode: "image", color: "#000000" }).mode,
  "logo",
  "Üres képháttér ne maradjon kép módban."
);

const indexHtml = readFileSync("index.html", "utf8");
assert.match(indexHtml, /displayBackgroundModeSelect/, "A felületen legyen Display2 háttér módválasztó.");
assert.match(indexHtml, /backgroundImageInput/, "A felületen legyen háttérkép-feltöltés.");
for (const extension of requiredExtensions) {
  assert.match(indexHtml, new RegExp(extension.replace(".", "\\.")), `Az index.html accept listából hiányzik: ${extension}`);
}

const rustCommands = readFileSync("src-tauri/src/emleksugo_commands.rs", "utf8");
assert.match(rustCommands, /es_pick_import_file/, "A natív import parancs hiányzik.");
assert.match(rustCommands, /LibreOffice/, "A LibreOffice import útvonal hiányzik.");
assert.match(rustCommands, /Windows OCR|Tesseract OCR/, "A képfájlos OCR útvonal hiányzik.");

assert.equal(existsSync("src/assets/szigligeti-logo-feher.png"), true, "A fehér Szigligeti logó hiányzik az assetek közül.");
assert.equal(existsSync("src/assets/szigligeti-logo-fekete.png"), true, "A fekete Szigligeti logó hiányzik az assetek közül.");

console.log("Importer and background verification passed.");
