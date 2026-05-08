import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  DEFAULT_DISPLAY_BACKGROUND,
  DEFAULT_DISPLAY_COLORS,
  getDisplayBackgroundColorId,
  getDisplayBackgroundColorValue,
  normalizeDisplayColors,
  normalizeDisplayBackground,
  normalizeHexColor,
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
assert.equal(getDisplayBackgroundColorValue("custom", "#123456"), "#123456", "Az egyedi háttérszín ne írja felül a megadott színkódot.");
assert.deepEqual(normalizeDisplayColors({ text: "fff", role: "#abc" }), {
  text: "#ffffff",
  role: "#aabbcc",
}, "A Display2 betűszín színkód-normalizálása hibás.");
assert.deepEqual(normalizeDisplayColors(), DEFAULT_DISPLAY_COLORS, "A Display2 alap betűszínei legyenek stabilak.");
assert.equal(normalizeHexColor("7dd3fc"), "#7dd3fc", "A # nélküli színkódot is kezelni kell.");
assert.equal(
  normalizeDisplayBackground({ mode: "image", color: "#000000" }).mode,
  "logo",
  "Üres képháttér ne maradjon kép módban."
);

const indexHtml = readFileSync("index.html", "utf8");
assert.match(indexHtml, /displayBackgroundModeSelect/, "A felületen legyen Display2 háttér módválasztó.");
assert.match(indexHtml, /backgroundImageInput/, "A felületen legyen háttérkép-feltöltés.");
assert.match(indexHtml, /displayTextColorInput/, "A felületen legyen Display2 betűszín-választó.");
assert.match(indexHtml, /displayRoleColorInput/, "A felületen legyen megszólaló-szín választó.");
assert.match(indexHtml, /pickBackgroundColorBtn/, "A felületen legyen Display2 háttér pipetta gomb.");
assert.match(indexHtml, /data-app-mode="song-assistant"/, "Az indítóképernyőn legyen Dal Asszisztens panel.");
assert.match(indexHtml, /data-app-mode="show-captioner"/, "Az indítóképernyőn legyen Előadás feliratozó panel.");
for (const extension of requiredExtensions) {
  assert.match(indexHtml, new RegExp(extension.replace(".", "\\.")), `Az index.html accept listából hiányzik: ${extension}`);
}

const mainJs = readFileSync("src/main.js", "utf8");
const displayJs = readFileSync("src/display.js", "utf8");
assert.match(mainJs, /szigligeti-logo-fekete\.png/, "A főablak alapértelmezett Display2 háttere a fekete logós assetet használja.");
assert.match(displayJs, /szigligeti-logo-fekete\.png/, "A Display2 alapértelmezett háttere a fekete logós assetet használja.");
assert.match(mainJs, /dsza-splash-backdrop\.svg/, "Az indítóképernyő DSZA háttérgrafikája nincs bekötve.");
assert.match(mainJs, /applyDisplayColorsToElement/, "A Display2 betűszínek nincsenek bekötve az előnézetbe.");

const rustCommands = readFileSync("src-tauri/src/emleksugo_commands.rs", "utf8");
assert.match(rustCommands, /es_pick_import_file/, "A natív import parancs hiányzik.");
assert.match(rustCommands, /LibreOffice/, "A LibreOffice import útvonal hiányzik.");
assert.match(rustCommands, /Windows OCR|Tesseract OCR/, "A képfájlos OCR útvonal hiányzik.");

assert.equal(existsSync("src/assets/szigligeti-logo-feher.png"), true, "A fehér Szigligeti logó hiányzik az assetek közül.");
assert.equal(existsSync("src/assets/szigligeti-logo-fekete.png"), true, "A fekete Szigligeti logó hiányzik az assetek közül.");
assert.equal(existsSync("src/assets/dsza-splash-backdrop.svg"), true, "A DSZA indítóháttér hiányzik az assetek közül.");
assert.equal(existsSync("src/assets/dsza-panel-song-assistant.svg"), true, "A Dal Asszisztens panel-háttér hiányzik.");
assert.equal(existsSync("src/assets/dsza-panel-show-captioner.svg"), true, "Az Előadás feliratozó panel-háttér hiányzik.");
assert.equal(existsSync("src/assets/dsza-app-icon.svg"), true, "A DSZA app-ikon forrása hiányzik.");
assert.equal(existsSync("src-tauri/icons/icon.icns"), true, "A macOS ikoncsomag hiányzik.");

console.log("Importer and background verification passed.");
