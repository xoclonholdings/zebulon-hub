import { GALAXY_CONTRACTS } from "../registry";
import { defineGalaxyDomain } from "../domainContract";

export const galaxy = GALAXY_CONTRACTS.zar;
export const domains = Object.freeze({
  identity: defineGalaxyDomain("zar", "identity"),
  memory: defineGalaxyDomain("zar", "memory"),
  knowledge: defineGalaxyDomain("zar", "knowledge"),
  apps: defineGalaxyDomain("zar", "apps"),
  desk: defineGalaxyDomain("zar", "desk"),
  settings: defineGalaxyDomain("zar", "settings"),
  portal: defineGalaxyDomain("zar", "portal"),
});
