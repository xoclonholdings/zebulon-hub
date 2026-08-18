import { GALAXY_CONTRACTS } from "../registry";
import { defineGalaxyDomain } from "../domainContract";

export const galaxy = GALAXY_CONTRACTS.zenith;
export const domains = Object.freeze({
  identity: defineGalaxyDomain("zenith", "identity"), memory: defineGalaxyDomain("zenith", "memory"), knowledge: defineGalaxyDomain("zenith", "knowledge"), apps: defineGalaxyDomain("zenith", "apps"), desk: defineGalaxyDomain("zenith", "desk"), settings: defineGalaxyDomain("zenith", "settings"), portal: defineGalaxyDomain("zenith", "portal"),
});
