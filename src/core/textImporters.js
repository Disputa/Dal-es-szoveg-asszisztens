import JSZip from "jszip";

export const SUPPORTED_IMPORT_ACCEPT = [
  ".txt",
  ".docx",
  ".pdf",
  ".odt",
  ".pages",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".tif",
  ".tiff",
  "text/plain",
  "application/pdf",
  "application/vnd.oasis.opendocument.text",
  "image/*",
].join(",");

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp"];

export async function readImportedText(file) {
  const lower = String(file?.name || "").toLowerCase();
  if (lower.endsWith(".txt")) return normalizeImportedText(await file.text());
  if (lower.endsWith(".docx")) return await readDocxText(file);
  if (lower.endsWith(".pdf")) return await readPdfText(file);
  if (lower.endsWith(".odt")) return await readOdtText(file);
  if (lower.endsWith(".pages")) return await readPagesText(file);
  if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return await readImageText(file);
  throw new Error("Nem támogatott importformátum.");
}

export async function readImportedTextFromNativeResult(result) {
  if (!result) return "";
  if (typeof result.text === "string" && result.text.trim()) {
    return normalizeImportedText(result.text);
  }
  if (Array.isArray(result.bytes) && result.bytes.length) {
    const bytes = Uint8Array.from(result.bytes);
    const fileName = result.fileName || `import.${result.extension || "txt"}`;
    const file = new File([bytes], fileName, { type: result.mimeType || "" });
    return await readImportedText(file);
  }
  throw new Error("A kiválasztott fájlból nem sikerült szöveget kinyerni.");
}

export function normalizeImportedText(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/\t/g, " ")
    .replace(/\r/g, "")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n[ ]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isSupportedImportFileName(fileName = "") {
  const lower = String(fileName || "").toLowerCase();
  return [".txt", ".docx", ".pdf", ".odt", ".pages", ...IMAGE_EXTENSIONS]
    .some((ext) => lower.endsWith(ext));
}

async function readDocxText(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entry = zip.file("word/document.xml");
  if (!entry) throw new Error("A DOCX-ben nincs document.xml.");
  const xml = await entry.async("string");
  return normalizeImportedText(extractParagraphTextFromXml(xml, "w"));
}

async function readOdtText(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entry = zip.file("content.xml");
  if (!entry) throw new Error("Az ODT-ben nincs content.xml.");
  const xml = await entry.async("string");
  return normalizeImportedText(extractParagraphTextFromXml(xml, "text"));
}

async function readPagesText(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const previewPdf = zip.file(/(^|\/)QuickLook\/Preview\.pdf$/i)[0] || zip.file(/Preview\.pdf$/i)[0];
  if (previewPdf) {
    throw new Error("A .pages előnézeti PDF-ből natív importtal lehet szöveget kinyerni.");
  }

  const textEntries = zip.file(/\.(xml|txt|html|plist)$/i);
  const chunks = [];
  for (const entry of textEntries) {
    const raw = await entry.async("string");
    const text = entry.name.toLowerCase().endsWith(".txt")
      ? raw
      : stripMarkup(raw);
    if (text.trim()) chunks.push(text);
  }

  const text = normalizeImportedText(chunks.join("\n\n"));
  if (text) return text;

  throw new Error("A .pages fájl modern bináris Apple formátum; natív LibreOffice import szükséges.");
}

async function readPdfText(file) {
  const _file = file;
  throw new Error("PDF importhoz a natív DSZA import szükséges.");
}

async function readImageText(file) {
  if (globalThis.Tesseract?.recognize) {
    const result = await globalThis.Tesseract.recognize(file, "hun+eng");
    return normalizeImportedText(result?.data?.text || "");
  }

  throw new Error(
    "Képfájl importhoz OCR motor szükséges. A natív DSZA import Windows OCR-rel próbálkozik; böngészős fallbackben nincs OCR motor."
  );
}

function extractParagraphTextFromXml(xml, preferredPrefix = "") {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) return stripMarkup(xml);

  const paragraphNames = preferredPrefix === "w"
    ? ["p"]
    : ["p", "h", "list-item"];
  const paragraphs = Array.from(doc.getElementsByTagName("*"))
    .filter((node) => paragraphNames.includes(node.localName));

  if (!paragraphs.length) return stripMarkup(xml);
  return paragraphs
    .map((node) => extractNodeText(node).trimEnd())
    .join("\n");
}

function extractNodeText(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
  const localName = node.localName || "";
  if (localName === "tab") return " ";
  if (localName === "line-break" || localName === "br") return "\n";
  if (localName === "s") {
    const count = Number(node.getAttribute("text:c") || node.getAttribute("c") || 1);
    return " ".repeat(Math.max(1, Math.min(count, 32)));
  }

  return Array.from(node.childNodes || [])
    .map((child) => extractNodeText(child))
    .join("");
}

function stripMarkup(raw) {
  const text = String(raw || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
  return normalizeImportedText(text);
}
