import { describe, expect, it } from "vitest";

import { GALAXY_CONSTELLATION, galaxyById } from "./galaxyConstellation";
import { GALAXY_SURFACES, ZCOS_SHARED_DOMAINS, isGalaxyId, isZcosDomain } from "./ZillionGateway";

describe("ZCOS constellation routing", () => {
  it("contains the eight canonical application galaxies", () => {
    expect(GALAXY_CONSTELLATION.map((galaxy) => galaxy.name)).toEqual([
      "ZAR", "ZETA", "ZYNC", "ZYLO", "ZENO", "ZWAP!", "ZENITH", "ZILLION",
    ]);
  });

  it("defines all seven shared domains for native galaxy partition pages", () => {
    expect(ZCOS_SHARED_DOMAINS).toEqual(["identity", "memory", "knowledge", "apps", "desk", "settings", "portal"]);
    expect(isZcosDomain("memory")).toBe(true);
    expect(isZcosDomain("unknown")).toBe(false);
  });

  it("defines every non-ZAR galaxy as a native ZCOS surface", () => {
    expect(Object.keys(GALAXY_SURFACES).sort()).toEqual(["zenith", "zeno", "zeta", "zillion", "zync", "zylo", "zwap"].sort());
    expect(isGalaxyId("zillion")).toBe(true);
    expect(GALAXY_SURFACES.zillion.desk).toBe("CAPITAL");
    expect(GALAXY_SURFACES.zeta.console).toBe("CONTROL");
  });

  it("keeps the constellation objects mapped to the expected galaxies", () => {
    expect(galaxyById("zillion")?.name).toBe("ZILLION");
    expect(galaxyById("zeta")?.name).toBe("ZETA");
    expect(galaxyById("zar")?.name).toBe("ZAR");
  });
});
