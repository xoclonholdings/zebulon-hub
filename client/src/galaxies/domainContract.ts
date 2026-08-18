import type { GalaxyId, ZcosSharedDomain } from "./registry";

export interface GalaxyDomainContract {
  galaxyId: GalaxyId;
  domain: ZcosSharedDomain;
  route: string;
}

export function defineGalaxyDomain(galaxyId: GalaxyId, domain: ZcosSharedDomain): GalaxyDomainContract {
  return Object.freeze({ galaxyId, domain, route: `/${galaxyId}/${domain}` });
}
