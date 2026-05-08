export function createProject({ title = "Szigligeti DSZA", playbackMode = "blocks", items = [] } = {}) {
  return {
    title,
    playbackMode: normalizePlaybackMode(playbackMode),
    items: normalizeItems(items),
  };
}

export function normalizeProject(project) {
  return createProject({
    title: project?.title || "Szigligeti DSZA",
    playbackMode: project?.playbackMode || "blocks",
    items: Array.isArray(project?.items) ? project.items : [],
  });
}

export function normalizeItems(items) {
  return items.map((item) => ({
    title: String(item?.title || "").trim() || "Névtelen tétel",
    duration: String(item?.duration || "").trim(),
    type: item?.type === "announcement" ? "announcement" : "song",
    blocks: normalizeBlocks(item?.blocks),
  }));
}

export function normalizeBlocks(blocks) {
  const normalized = Array.isArray(blocks)
    ? blocks
        .map((block) => ({
          role: String(block?.role || "").trim(),
          text: String(block?.text || "").trim(),
        }))
        .filter((block) => block.role || block.text)
    : [];

  return normalized.length ? normalized : [{ role: "", text: "" }];
}

export function normalizePlaybackMode(mode) {
  return ["blocks", "scroll-up", "scroll-down"].includes(mode) ? mode : "blocks";
}
