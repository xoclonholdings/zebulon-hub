import { GALAXY_CONTRACTS } from "../registry";
import { defineGalaxyDomain } from "../domainContract";

export const galaxy = GALAXY_CONTRACTS.zeta;
export const domains = Object.freeze({
  identity: defineGalaxyDomain("zeta", "identity"), memory: defineGalaxyDomain("zeta", "memory"), knowledge: defineGalaxyDomain("zeta", "knowledge"), apps: defineGalaxyDomain("zeta", "apps"), desk: defineGalaxyDomain("zeta", "desk"), settings: defineGalaxyDomain("zeta", "settings"), portal: defineGalaxyDomain("zeta", "portal"),
});
