import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildDisplayPayload } from "../src/core/displayPayload.js";
import { buildDisplayRenderModel } from "../src/core/displayRenderRules.js";
import { getDisplayProfile, getDisplayProfileList } from "../src/core/displayProfiles.js";

const requiredProfiles = ["stage-monitor", "audience-subtitle", "accessibility", "rehearsal"];
const profiles = getDisplayProfileList();

assert.deepEqual(
  profiles.map((profile) => profile.id),
  requiredProfiles,
  "A kijelzőprofil-lista nem a várt négy profilt tartalmazza."
);

function makeModel(profileId, overrides = {}) {
  const profile = getDisplayProfile(profileId);
  const item = {
    title: "Pilot dal",
    blocks: [
      { role: "Énekes", text: "Első sor\n[madárfütty]" },
      { role: "Kórus", text: "Második blokk" },
    ],
  };
  const project = {
    playbackMode: overrides.playbackMode || "blocks",
    items: [item],
  };
  const payload = buildDisplayPayload({
    project,
    item,
    block: item.blocks[0],
    state: {
      black: false,
      speed: 100,
      isPlaying: false,
      blockIndex: 0,
      itemIndex: 0,
    },
    uiPrefs: {
      displayProfileId: profile.id,
      showListDisplay: overrides.showListDisplay ?? profile.defaultShowList,
      showBlockRailDisplay: overrides.showBlockRailDisplay ?? profile.defaultShowBlockRail,
    },
    textStyle: profile.textStyle,
    roleStyle: profile.roleStyle,
    displaySize: { width: 1280, height: 720 },
  });

  return buildDisplayRenderModel(payload);
}

const stage = makeModel("stage-monitor");
assert.equal(stage.showSongTitle, true, "A színpadi monitor mutassa a címet.");
assert.equal(stage.showRole, true, "A színpadi monitor mutassa a megszólalót.");
assert.equal(stage.showBlockRail, true, "A színpadi monitor mutassa a blokk-sávot.");
assert.equal(stage.showTransportHud, true, "A színpadi monitoron elérhető legyen a vezérlő HUD.");

const audience = makeModel("audience-subtitle", { showListDisplay: true });
assert.equal(audience.showSongTitle, false, "A közönségfelirat ne mutasson címet.");
assert.equal(audience.showListVisible, false, "A közönségfelirat ne mutasson műsorlistát.");
assert.equal(audience.showTransportHud, false, "A közönségfelirat ne mutasson vezérlő HUD-ot.");
assert.equal(audience.showCredit, false, "A közönségfelirat ne mutasson credit sort.");

const audienceWithBlocks = makeModel("audience-subtitle", { showBlockRailDisplay: true });
assert.equal(audienceWithBlocks.showBlockRail, true, "A közönségfeliraton is választható legyen a szövegblokk-sáv.");

const accessibility = makeModel("accessibility");
assert.equal(accessibility.showRole, true, "Az akadálymentes profil mutassa a beszélőt.");
assert.match(
  accessibility.blockHtml,
  /<span class="display-cue">\[madárfütty\]<\/span>/,
  "Az akadálymentes profil emelje ki a hangeffekt-jelöléseket."
);

const accessibilityWithBlocks = makeModel("accessibility", { showBlockRailDisplay: true });
assert.equal(accessibilityWithBlocks.showBlockRail, true, "Az akadálymentes profilnál is választható legyen a szövegblokk-sáv.");

const rehearsal = makeModel("rehearsal");
assert.equal(rehearsal.showListVisible, true, "A próbamód alapból mutassa a műsorlistát.");
assert.equal(rehearsal.showBlockRail, true, "A próbamód mutassa a blokk-sávot.");
assert.equal(rehearsal.showTransportHud, true, "A próbamód mutassa a vezérlő HUD-ot.");

const rehearsalHiddenPanels = makeModel("rehearsal", { showListDisplay: false, showBlockRailDisplay: false });
assert.equal(rehearsalHiddenPanels.showListVisible, false, "A próbamódban is ki lehessen kapcsolni a műsorlistát.");
assert.equal(rehearsalHiddenPanels.showBlockRail, false, "A próbamódban is ki lehessen kapcsolni a szövegblokk-sávot.");

const indexHtml = readFileSync("index.html", "utf8");
assert.match(indexHtml, /accept="[^"]*\.dsa[^"]*\.esp[^"]*\.json/, "A projektmegnyitó fogadjon .dsa, .esp és .json fájlokat.");

const rustCommands = readFileSync("src-tauri/src/emleksugo_commands.rs", "utf8");
assert.match(rustCommands, /\.dsa/, "A natív mentés ismerje a .dsa kiterjesztést.");
assert.match(rustCommands, /\.esp/, "A natív mentés tartsa meg a .esp kompatibilitást.");
assert.match(rustCommands, /\.json/, "A natív mentés tartsa meg a JSON kompatibilitást.");

const mainJs = readFileSync("src/main.js", "utf8");
const displayJs = readFileSync("src/display.js", "utf8");
assert.match(mainJs, /buildDisplayRenderModel/, "A preview használja a közös render-modellt.");
assert.match(displayJs, /buildDisplayRenderModel/, "A Display2 használja a közös render-modellt.");

console.log("Display profile verification passed.");
