export interface VesselIdentity {
  readonly kind: "vessel";
  readonly desk: "Command";
  readonly accent: string;
}

export const ZCOS_COMMANDER: VesselIdentity = Object.freeze({
  kind: "vessel",
  desk: "Command",
  accent: "#8b5cf6",
});
