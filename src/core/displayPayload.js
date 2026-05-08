import { APP_NAME, APP_RELEASE_LABEL, APP_SHORT_NAME } from "./appInfo.js";
import { getDisplayProfile } from "./displayProfiles.js";

export function buildDisplayPayload({
  project,
  item,
  block,
  state,
  uiPrefs,
  textStyle,
  roleStyle,
  displaySize,
}) {
  if (!item || !block) return null;

  const blocks = Array.isArray(item.blocks) ? item.blocks : [];
  const displayProfile = getDisplayProfile(uiPrefs.displayProfileId);

  return {
    appName: APP_NAME,
    appShortName: APP_SHORT_NAME,
    appVersion: APP_RELEASE_LABEL,
    displayProfileId: displayProfile.id,
    displayProfile,
    songTitle: item.title,
    role: block.role || "",
    text: block.text || "",
    fullText: blocks.map((entry) => entry.text || "").join("\n\n"),
    mode: project.playbackMode,
    black: !!state.black,
    speed: state.speed,
    isPlaying: !!state.isPlaying,
    blockIndex: state.blockIndex + 1,
    blockCount: blocks.length,
    showListVisible: !!uiPrefs.showListDisplay,
    showBlockRailVisible: !!uiPrefs.showBlockRailDisplay,
    showListTitles: project.items.map((it) => it.title),
    currentItemIndex: state.itemIndex,
    blocks: blocks.map((entry) => ({ role: entry.role || "", text: entry.text || "" })),
    textStyle,
    roleStyle,
    displaySize,
  };
}
