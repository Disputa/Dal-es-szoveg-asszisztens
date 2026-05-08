export const DISPLAY_BACKGROUND_CLASS_NAMES = [
  "display-background-logo",
  "display-background-color",
  "display-background-image",
];

export const DISPLAY_BACKGROUND_COLORS = [
  { id: "black", label: "Fekete", value: "#000000" },
  { id: "blue", label: "Kék", value: "#0b3a78" },
  { id: "green", label: "Zöld", value: "#0f5132" },
  { id: "red", label: "Piros", value: "#7f1d1d" },
  { id: "white", label: "Fehér", value: "#f8f8f8" },
  { id: "custom", label: "Egyedi", value: "#000000" },
];

export const DEFAULT_DISPLAY_BACKGROUND = {
  mode: "logo",
  color: "#000000",
  imageDataUrl: "",
  imageName: "",
};

export function normalizeDisplayBackground(background = {}) {
  const mode = ["logo", "color", "image"].includes(background?.mode)
    ? background.mode
    : DEFAULT_DISPLAY_BACKGROUND.mode;
  const color = normalizeColor(background?.color, DEFAULT_DISPLAY_BACKGROUND.color);
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

export function getDisplayBackgroundColorOptions() {
  return DISPLAY_BACKGROUND_COLORS.map((entry) => ({ ...entry }));
}

export function getDisplayBackgroundColorId(color) {
  const normalized = normalizeColor(color, DEFAULT_DISPLAY_BACKGROUND.color).toLowerCase();
  const match = DISPLAY_BACKGROUND_COLORS.find((entry) => entry.id !== "custom" && entry.value.toLowerCase() === normalized);
  return match?.id || "custom";
}

export function getDisplayBackgroundColorValue(id, fallback = DEFAULT_DISPLAY_BACKGROUND.color) {
  const match = DISPLAY_BACKGROUND_COLORS.find((entry) => entry.id === id);
  return normalizeColor(match?.value, fallback);
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

function normalizeColor(value, fallback) {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function cssEscapeUrl(value) {
  return String(value || "").replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
