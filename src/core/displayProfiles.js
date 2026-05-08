export const DEFAULT_DISPLAY_PROFILE_ID = "stage-monitor";

export const DISPLAY_PROFILES = {
  "stage-monitor": {
    id: "stage-monitor",
    label: "Színpadi monitor",
    shortLabel: "Monitor",
    description: "Nagy, erős szöveg előadói monitorra, blokk-sávval.",
    className: "display-profile-stage-monitor",
    showSongTitle: true,
    showRole: true,
    defaultShowBlockRail: true,
    allowShowList: true,
    defaultShowList: false,
    showTransportHud: true,
    showCredit: true,
    highlightCues: false,
    textStyle: { fontSize: 60, offsetX: 0, offsetY: 0 },
    roleStyle: { fontSize: 46, offsetX: 0, offsetY: 0 },
  },
  "audience-subtitle": {
    id: "audience-subtitle",
    label: "Közönségfelirat",
    shortLabel: "Felirat",
    description: "Letisztult, kontrasztos nézőtéri felirat zavaró kezelőelemek nélkül.",
    className: "display-profile-audience-subtitle",
    showSongTitle: false,
    showRole: true,
    defaultShowBlockRail: false,
    allowShowList: false,
    defaultShowList: false,
    showTransportHud: false,
    showCredit: false,
    highlightCues: false,
    textStyle: { fontSize: 46, offsetX: 0, offsetY: 115 },
    roleStyle: { fontSize: 30, offsetX: 0, offsetY: 0 },
  },
  accessibility: {
    id: "accessibility",
    label: "Akadálymentesített felirat",
    shortLabel: "Akadálymentes",
    description: "Nagy kontraszt, erős beszélőjelölés és kiemelt hangeffekt-jelölések.",
    className: "display-profile-accessibility",
    showSongTitle: false,
    showRole: true,
    defaultShowBlockRail: false,
    allowShowList: false,
    defaultShowList: false,
    showTransportHud: false,
    showCredit: false,
    highlightCues: true,
    textStyle: { fontSize: 54, offsetX: 0, offsetY: 82 },
    roleStyle: { fontSize: 38, offsetX: 0, offsetY: 0 },
  },
  rehearsal: {
    id: "rehearsal",
    label: "Próbamód",
    shortLabel: "Próba",
    description: "Több kontrollinformáció próbára: műsorlista, blokk-sáv és vezérlő HUD.",
    className: "display-profile-rehearsal",
    showSongTitle: true,
    showRole: true,
    defaultShowBlockRail: true,
    allowShowList: true,
    defaultShowList: true,
    showTransportHud: true,
    showCredit: true,
    highlightCues: true,
    textStyle: { fontSize: 34, offsetX: 0, offsetY: 0 },
    roleStyle: { fontSize: 34, offsetX: 0, offsetY: 0 },
  },
};

export const DISPLAY_PROFILE_CLASS_NAMES = Object.values(DISPLAY_PROFILES).map((profile) => profile.className);

export function getDisplayProfile(profileId = DEFAULT_DISPLAY_PROFILE_ID) {
  return DISPLAY_PROFILES[profileId] || DISPLAY_PROFILES[DEFAULT_DISPLAY_PROFILE_ID];
}

export function getDisplayProfileList() {
  return Object.values(DISPLAY_PROFILES);
}

export function resolveDisplayProfileId(profileId) {
  return getDisplayProfile(profileId).id;
}
