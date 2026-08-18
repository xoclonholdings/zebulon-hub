import { GALAXY_CONTRACTS } from "../registry";
import { defineGalaxyDomain } from "../domainContract";

export const galaxy = GALAXY_CONTRACTS.zillion;
export const domains = Object.freeze({
  identity: defineGalaxyDomain("zillion", "identity"), memory: defineGalaxyDomain("zillion", "memory"), knowledge: defineGalaxyDomain("zillion", "knowledge"), apps: defineGalaxyDomain("zillion", "apps"), desk: defineGalaxyDomain("zillion", "desk"), settings: defineGalaxyDomain("zillion", "settings"), portal: defineGalaxyDomain("zillion", "portal"),
});
