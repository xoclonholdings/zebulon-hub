import { describe, expect, it } from "vitest";

import { GALAXY_CONSTELLATION, galaxyById } from "./galaxyConstellation";
import { ZILLION_OPERATOR_PATH, zcosOperatorUrl, zillionOperatorUrl } from "./ZillionGateway";

describe("ZCOS constellation routing", () => {
  it("contains the eight canonical application galaxies", () => {
    expect(GALAXY_CONSTELLATION.map((galaxy) => galaxy.name)).toEqual([
      "ZAR", "ZETA", "ZYNC", "ZYLO", "ZENO", "ZWAP!", "ZENITH", "ZILLION",
    ]);
  });

  it("routes the ZILLION celestial object through the authenticated ZAR Capital gateway", () => {
    expect(galaxyById("zillion")).toMatchObject({ console: "PROSPER", route: "/galaxy/zillion" });
    expect(ZILLION_OPERATOR_PATH).toBe("/workspaces/finance");
    expect(zillionOperatorUrl("https://zar.example")).toBe("https://zar.example/workspaces/finance");
  });

  it("keeps ZAR and sibling galaxies in the shared runtime", () => {
    expect(galaxyById("zar")?.route).toBe("/nexys");
    expect(zcosOperatorUrl("https://zar.example", "/nexys")).toBe("https://zar.example/nexys");
    expect(zcosOperatorUrl("https://zar.example", "/galaxy/zeta")).toBe("https://zar.example/galaxy/zeta");
  });
});
