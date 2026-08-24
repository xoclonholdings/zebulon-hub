import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../storage-prisma.js";
import type { ExternalSourceEvidence } from "./ExternalSourceGateway.js";
import type { ZcosContextItem } from "./types.js";

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export class ExternalEvidenceStore {
  static async persist(ownerUserId: string, galaxyId: string, requestId: string, evidence: ExternalSourceEvidence[]) {
    const records = [];
    for (const item of evidence) {
      const contentHash = createHash("sha256").update(item.content).digest("hex");
      const sourceType = `external_${item.sourceKind}`;
      const existing = await prisma.sourceRecord.findFirst({ where: { ownerUserId, galaxyId, sourceType, sourceId: item.sourceId, contentHash } });
      if (existing) {
        records.push(existing);
        continue;
      }
      records.push(await prisma.sourceRecord.create({
        data: {
          ownerUserId,
          galaxyId,
          sourceGalaxyId: galaxyId,
          sourceType,
          sourceId: item.sourceId,
          originClass: "Extracted / Compiled",
          title: item.title,
          locator: item.locator,
          evidenceExcerpt: item.content.slice(0, 12000),
          extractionMethod: "external source retrieval",
          contentHash,
          metadata: jsonValue({ requestId, sourceKind: item.sourceKind, provenance: item.provenance }),
          accessedAt: new Date(item.retrievedAt),
        },
      }));
    }
    return records;
  }

  static async loadContext(ownerUserId: string, galaxyId: string, sourceRecordIds: string[]): Promise<ZcosContextItem[]> {
    if (!sourceRecordIds.length) return [];
    const records = await prisma.sourceRecord.findMany({ where: { ownerUserId, galaxyId, id: { in: sourceRecordIds } } });
    return records.map((record) => ({
      id: `external:${record.id}`,
      authority: "external_evidence",
      content: record.evidenceExcerpt || "",
      source: record.locator || record.title || record.sourceId,
      lifecycle: "supported",
      currency: "current",
      galaxyId,
      trust: "authorized_projection",
    }));
  }
}

export default ExternalEvidenceStore;
