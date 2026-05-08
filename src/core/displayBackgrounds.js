export const DISPLAY_BACKGROUND_CLASS_NAMES = [
  "display-background-logo",
  "display-background-color",
  "display-background-image",
];

export const DISPLAY_BACKGROUND_COLORS = [
  { id: "black", label: "Fekete", value: "#000000" },
  { id: "anthracite", label: "Antracit", value: "#111111" },
  { id: "blue", label: "Kék", value: "#0b3a78" },
  { id: "green", label: "Zöld", value: "#0f5132" },
  { id: "red", label: "Piros", value: "#7f1d1d" },
  { id: "yellow", label: "Sárga", value: "#ffd95f" },
  { id: "white", label: "Fehér", value: "#f8f8f8" },
  { id: "custom", label: "Egyedi", value: "#000000" },
];

export const DISPLAY_TEXT_COLORS = [
  { id: "white", label: "Fehér", value: "#ffffff" },
  { id: "warm-white", label: "Meleg fehér", value: "#fff5d6" },
  { id: "yellow", label: "Sárga", value: "#ffd95f" },
  { id: "cyan", label: "Cian", value: "#7dd3fc" },
  { id: "green", label: "Zöld", value: "#86efac" },
  { id: "red", label: "Piros", value: "#fca5a5" },
  { id: "black", label: "Fekete", value: "#111111" },
  { id: "custom", label: "Egyedi", value: "#ffffff" },
];

export const DEFAULT_DISPLAY_BACKGROUND = {
  mode: "logo",
  color: "#000000",
  imageDataUrl: "",
  imageName: "",
};

export const DEFAULT_DISPLAY_COLORS = {
  text: "#ffffff",
  role: "#ffd95f",
};

export function normalizeDisplayBackground(background = {}) {
  const mode = ["logo", "color", "image"].includes(background?.mode)
    ? background.mode
    : DEFAULT_DISPLAY_BACKGROUND.mode;
  const color = normalizeHexColor(background?.color, DEFAULT_DISPLAY_BACKGROUND.color);
  const imageDataUrl = typeof background?.imageDataUrl === "string" ? background.imageDataUrl : "";
  const imageName = typeof background?.imageName === "string" ? background.imageName : "";

  if (mode === "image" && !imageDataUrl) {
    return { ...DEFAULT_DISPLAY_BACKGROUND, color };
  }

  return {
    mode,
    color,
    imageDataUrl,
    imageName,
  };
}

export function normalizeDisplayColors(colors = {}) {
  return {
    text: normalizeHexColor(colors?.text, DEFAULT_DISPLAY_COLORS.text),
    role: normalizeHexColor(colors?.role, DEFAULT_DISPLAY_COLORS.role),
  };
}

export function getDisplayBackgroundColorOptions() {
  return DISPLAY_BACKGROUND_COLORS.map((entry) => ({ ...entry }));
}

export function getDisplayTextColorOptions() {
  return DISPLAY_TEXT_COLORS.map((entry) => ({ ...entry }));
}

export function getDisplayBackgroundColorId(color) {
  const normalized = normalizeHexColor(color, DEFAULT_DISPLAY_BACKGROUND.color).toLowerCase();
  const match = DISPLAY_BACKGROUND_COLORS.find((entry) => entry.id !== "custom" && entry.value.toLowerCase() === normalized);
  return match?.id || "custom";
}

export function getDisplayBackgroundColorValue(id, fallback = DEFAULT_DISPLAY_BACKGROUND.color) {
  if (id === "custom") return normalizeHexColor(fallback, DEFAULT_DISPLAY_BACKGROUND.color);
  const match = DISPLAY_BACKGROUND_COLORS.find((entry) => entry.id === id);
  return normalizeHexColor(match?.value, fallback);
}

export function getDisplayTextColorId(color, fallback = DEFAULT_DISPLAY_COLORS.text) {
  const normalized = normalizeHexColor(color, fallback).toLowerCase();
  const match = DISPLAY_TEXT_COLORS.find((entry) => entry.id !== "custom" && entry.value.toLowerCase() === normalized);
  return match?.id || "custom";
}

export function applyDisplayBackgroundToElement(element, background = DEFAULT_DISPLAY_BACKGROUND, options = {}) {
  if (!element) return normalizeDisplayBackground(background);
  const normalized = normalizeDisplayBackground(background);
  const logoImageUrl = typeof options.logoImageUrl === "string" ? options.logoImageUrl : "";
  element.classList.remove(...DISPLAY_BACKGROUND_CLASS_NAMES);
  element.classList.add(`display-background-${normalized.mode}`);
  element.style.setProperty("--display-bg-color", normalized.color);
  element.style.setProperty(
    "--display-logo-image",
    normalized.mode === "logo" && logoImageUrl
      ? `url("${cssEscapeUrl(logoImageUrl)}")`
      : "none"
  );
  element.style.setProperty(
    "--display-bg-image",
    normalized.mode === "image" && normalized.imageDataUrl
      ? `url("${cssEscapeUrl(normalized.imageDataUrl)}")`
      : "none"
  );
  return normalized;
}

export function applyDisplayColorsToElement(element, colors = DEFAULT_DISPLAY_COLORS) {
  if (!element) return normalizeDisplayColors(colors);
  const normalized = normalizeDisplayColors(colors);
  element.style.setProperty("--display-text-color", normalized.text);
  element.style.setProperty("--display-role-color", normalized.role);
  return normalized;
}

export function normalizeHexColor(value, fallback = "#000000") {
  const color = String(value || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toLowerCase();
  }
  if (/^[0-9a-f]{6}$/i.test(color)) return `#${color}`.toLowerCase();
  if (/^[0-9a-f]{3}$/i.test(color)) {
    return `#${color[0]}${color[0]}${color[1]}${color[1]}${color[2]}${color[2]}`.toLowerCase();
  }
  return fallback;
}

function cssEscapeUrl(value) {
  return String(value || "").replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
