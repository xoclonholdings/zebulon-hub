import { describe, expect, it } from "vitest";

import { GALAXY_CONSTELLATION, galaxyById } from "./galaxyConstellation";
import { ZILLION_OPERATOR_PATH, zillionOperatorUrl } from "./ZillionGateway";

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
});
