export interface ConsoleIdentity {
  readonly galaxy: string;
  readonly console: string;
  readonly accent: string;
}

// Compatibility export while system-level consumers are migrated to the ZAR partition.
export { ZAR_NEXYS_CONSOLE } from "@/galaxies/zar/nexys/consoleIdentity";
