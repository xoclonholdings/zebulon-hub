import { GALAXY_CONTRACTS } from "../registry";
import { defineGalaxyDomain } from "../domainContract";

export const galaxy = GALAXY_CONTRACTS.zylo;
export const domains = Object.freeze({
  identity: defineGalaxyDomain("zylo", "identity"), memory: defineGalaxyDomain("zylo", "memory"), knowledge: defineGalaxyDomain("zylo", "knowledge"), apps: defineGalaxyDomain("zylo", "apps"), desk: defineGalaxyDomain("zylo", "desk"), settings: defineGalaxyDomain("zylo", "settings"), portal: defineGalaxyDomain("zylo", "portal"),
});
