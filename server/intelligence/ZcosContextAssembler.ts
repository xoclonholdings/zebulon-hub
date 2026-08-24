import { storage } from "../storage-prisma.js";
import type { GalaxyId } from "../core/GalaxyRegistry.js";
import type { ZcosContextItem } from "./types.js";

/**
 * Builds reasoning context only from canonical ZCOS authorities.
 * Request bodies are not accepted as Memory/Knowledge authority.
 */
export class ZcosContextAssembler {
  static async assemble(ownerUserId: string, galaxyId: GalaxyId): Promise<ZcosContextItem[]> {
    const [memoryEnabled, knowledge] = await Promise.all([
      storage.getMemoryEnabled(ownerUserId),
      storage.listKnowledge(ownerUserId, galaxyId, true),
    ]);
    const memory = memoryEnabled ? await storage.listMemory(ownerUserId, galaxyId, true) : [];

    const memoryContext: ZcosContextItem[] = memory.map((record) => ({
      id: record.id,
      authority: "memory",
      content: record.content,
      source: record.sourceRefs.join(","),
      confidence: record.confidence ?? undefined,
      lifecycle: record.lifecycleState,
      galaxyId,
      trust: "canonical",
    }));

    const knowledgeContext: ZcosContextItem[] = knowledge.map((record) => ({
      id: record.id,
      authority: "knowledge",
      content: [record.canonicalName, record.summary || ""].filter(Boolean).join(" — "),
      source: record.sourceBindings.join(","),
      confidence: record.confidence ?? undefined,
      lifecycle: record.lifecycleState,
      currency: record.currency,
      galaxyId,
      trust: "canonical",
    }));

    return [...memoryContext, ...knowledgeContext];
  }
}

export default ZcosContextAssembler;
