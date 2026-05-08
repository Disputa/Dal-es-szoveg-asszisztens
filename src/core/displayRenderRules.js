import { normalizeDisplayBackground } from "./displayBackgrounds.js";
import { getDisplayProfile } from "./displayProfiles.js";

export function buildDisplayRenderModel(payload = {}) {
  const profile = getDisplayProfile(payload.displayProfileId);
  const blocks = Array.isArray(payload.blocks) && payload.blocks.length
    ? payload.blocks
    : [{ role: payload.role || "", text: payload.fullText || payload.text || "" }];
  const activeIndex = Math.max(0, (Number(payload.blockIndex) || 1) - 1);
  const showListVisible = profile.allowShowList
    ? Boolean(payload.showListVisible ?? profile.defaultShowList)
    : false;
  const showBlockRail = Boolean((payload.showBlockRailVisible ?? profile.defaultShowBlockRail) && blocks.length > 1);
  const text = payload.text || "";

  return {
    profile,
    profileId: profile.id,
    className: profile.className,
    showSongTitle: Boolean(profile.showSongTitle),
    showRole: Boolean(profile.showRole),
    showListVisible,
    showBlockRail,
    showTransportHud: Boolean(profile.showTransportHud),
    showCredit: profile.showCredit !== false,
    songTitle: payload.songTitle || "",
    role: payload.role || "",
    text,
    blockHtml: formatDisplayText(text, profile),
    blocks: blocks.map((block) => ({
      role: block.role || "",
      text: block.text || "",
      html: formatDisplayText(block.text || "", profile),
    })),
    activeIndex,
    showListTitles: Array.isArray(payload.showListTitles) ? payload.showListTitles : [],
    currentItemIndex: Number(payload.currentItemIndex) || 0,
    displayBackground: normalizeDisplayBackground(payload.displayBackground),
  };
}

export function formatDisplayText(text = "", profile = getDisplayProfile()) {
  const escaped = escapeHtml(text);
  if (!profile.highlightCues) return escaped;

  return escaped.replace(/(\[[^\]\n]{1,80}\])/g, '<span class="display-cue">$1</span>');
}

export function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
