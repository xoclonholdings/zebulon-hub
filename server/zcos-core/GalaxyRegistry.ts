export const ZCOS_GALAXIES = [
  "ZAR",
  "ZYNC",
  "ZETA",
  "ZENO",
  "ZYLO",
  "ZWAP!",
  "ZENITH",
  "ZILLION",
] as const;

export type GalaxyId = (typeof ZCOS_GALAXIES)[number];

const NORMALIZED_GALAXIES: Record<string, GalaxyId> = {
  zar: "ZAR",
  zync: "ZYNC",
  zeta: "ZETA",
  zeno: "ZENO",
  zylo: "ZYLO",
  zwap: "ZWAP!",
  "zwap!": "ZWAP!",
  zenith: "ZENITH",
  zillion: "ZILLION",
};

export function normalizeGalaxyId(value: string | undefined | null): GalaxyId | null {
  if (!value) return null;
  return NORMALIZED_GALAXIES[value.trim().toLowerCase()] ?? null;
}

export function requireGalaxyId(value: string | undefined | null): GalaxyId {
  const galaxyId = normalizeGalaxyId(value);
  if (!galaxyId) {
    throw new Error(`Unknown ZCOS galaxy: ${value ?? "<missing>"}`);
  }
  return galaxyId;
}
