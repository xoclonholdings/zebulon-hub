export const ZCOS_SHARED_DOMAINS = [
  "identity",
  "memory",
  "knowledge",
  "apps",
  "desk",
  "settings",
  "portal",
] as const;

export type ZcosSharedDomain = (typeof ZCOS_SHARED_DOMAINS)[number];

export type GalaxyId =
  | "zar"
  | "zync"
  | "zeta"
  | "zeno"
  | "zylo"
  | "zwap"
  | "zenith"
  | "zillion";

export interface GalaxyContract {
  id: GalaxyId;
  name: string;
  console: string;
  desk: string;
  dock: readonly ["Chat", "Upload", string, string, string];
}

export const GALAXY_CONTRACTS: Record<GalaxyId, GalaxyContract> = {
  zar: {
    id: "zar",
    name: "ZAR",
    console: "NEXYS",
    desk: "OPERATE",
    dock: ["Chat", "Upload", "Ideas", "Task", "Search"],
  },
  zync: {
    id: "zync",
    name: "ZYNC",
    console: "CANVAS",
    desk: "BUILD",
    dock: ["Chat", "Upload", "Code", "Design", "Publish"],
  },
  zeta: {
    id: "zeta",
    name: "ZETA",
    console: "CONTROL",
    desk: "INTEGRITY",
    dock: ["Chat", "Upload", "Logs", "Diagnostics", "Monitoring"],
  },
  zeno: {
    id: "zeno",
    name: "ZENO",
    console: "UNITE",
    desk: "FORUM",
    dock: ["Chat", "Upload", "Board", "Team", "Notes"],
  },
  zylo: {
    id: "zylo",
    name: "ZYLO",
    console: "COMPASS",
    desk: "AUTOMATE",
    dock: ["Chat", "Upload", "Flows", "Skills", "Tips"],
  },
  zwap: {
    id: "zwap",
    name: "ZWAP!",
    console: "DISCOVERY",
    desk: "EXPLORE",
    dock: ["Chat", "Upload", "Glow", "Move", "Play"],
  },
  zenith: {
    id: "zenith",
    name: "ZENITH",
    console: "LOGOS",
    desk: "SCHOLAR",
    dock: ["Chat", "Upload", "Files", "Study", "Library"],
  },
  zillion: {
    id: "zillion",
    name: "ZILLION",
    console: "PROSPER",
    desk: "CAPITAL",
    dock: ["Chat", "Upload", "Budget", "Trade", "Invest"],
  },
};

export const ZCOS_AUTHORITY = Object.freeze({
  authentication: "ZCOS Universal Auth",
  identity: "ZCOS Identity",
  rule: "One authenticated ZCOS identity is valid across every galaxy.",
});
