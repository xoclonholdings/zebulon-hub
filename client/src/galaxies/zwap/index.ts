import { GALAXY_CONTRACTS } from "../registry";
import { defineGalaxyDomain } from "../domainContract";

export const galaxy = GALAXY_CONTRACTS.zwap;
export const domains = Object.freeze({
  identity: defineGalaxyDomain("zwap", "identity"), memory: defineGalaxyDomain("zwap", "memory"), knowledge: defineGalaxyDomain("zwap", "knowledge"), apps: defineGalaxyDomain("zwap", "apps"), desk: defineGalaxyDomain("zwap", "desk"), settings: defineGalaxyDomain("zwap", "settings"), portal: defineGalaxyDomain("zwap", "portal"),
});
