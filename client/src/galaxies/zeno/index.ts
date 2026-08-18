import { GALAXY_CONTRACTS } from "../registry";
import { defineGalaxyDomain } from "../domainContract";

export const galaxy = GALAXY_CONTRACTS.zeno;
export const domains = Object.freeze({
  identity: defineGalaxyDomain("zeno", "identity"), memory: defineGalaxyDomain("zeno", "memory"), knowledge: defineGalaxyDomain("zeno", "knowledge"), apps: defineGalaxyDomain("zeno", "apps"), desk: defineGalaxyDomain("zeno", "desk"), settings: defineGalaxyDomain("zeno", "settings"), portal: defineGalaxyDomain("zeno", "portal"),
});
