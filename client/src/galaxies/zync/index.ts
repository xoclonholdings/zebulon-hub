import { GALAXY_CONTRACTS } from "../registry";
import { defineGalaxyDomain } from "../domainContract";

export const galaxy = GALAXY_CONTRACTS.zync;
export const domains = Object.freeze({
  identity: defineGalaxyDomain("zync", "identity"),
  memory: defineGalaxyDomain("zync", "memory"),
  knowledge: defineGalaxyDomain("zync", "knowledge"),
  apps: defineGalaxyDomain("zync", "apps"),
  desk: defineGalaxyDomain("zync", "desk"),
  settings: defineGalaxyDomain("zync", "settings"),
  portal: defineGalaxyDomain("zync", "portal"),
});
