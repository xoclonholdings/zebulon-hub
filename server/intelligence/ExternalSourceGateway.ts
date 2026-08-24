export type ExternalSourceKind = "web" | "model" | "database" | "connector" | "tool";

export interface ExternalSourceRequest {
  requestId: string;
  objective: string;
  sourceKinds: ExternalSourceKind[];
  query: string;
  ownerUserId: string;
  galaxyId: string;
}

export interface ExternalSourceEvidence {
  sourceId: string;
  sourceKind: ExternalSourceKind;
  title?: string;
  locator?: string;
  retrievedAt: string;
  content: string;
  provenance: Record<string, unknown>;
}

export interface ExternalSourceResult {
  requestId: string;
  evidence: ExternalSourceEvidence[];
  providerTrace?: Record<string, unknown>;
}

export interface ExternalSourceAdapter {
  readonly id: string;
  readonly kinds: ExternalSourceKind[];
  retrieve(request: ExternalSourceRequest): Promise<ExternalSourceResult>;
}

/**
 * Provider-neutral external information gateway.
 *
 * This is deliberately not a reasoning authority. Lightning, models, web
 * providers, databases and connectors may implement adapters, but all output
 * returns as untrusted evidence for ZCOS provenance/validation before use.
 */
export class ExternalSourceGateway {
  private readonly adapters = new Map<string, ExternalSourceAdapter>();

  register(adapter: ExternalSourceAdapter): void {
    if (!adapter.id.trim()) throw new Error("External source adapter id is required");
    if (this.adapters.has(adapter.id)) throw new Error(`External source adapter already registered: ${adapter.id}`);
    this.adapters.set(adapter.id, adapter);
  }

  unregister(adapterId: string): void {
    this.adapters.delete(adapterId);
  }

  list(): Array<{ id: string; kinds: ExternalSourceKind[] }> {
    return [...this.adapters.values()].map(({ id, kinds }) => ({ id, kinds: [...kinds] }));
  }

  async retrieve(adapterId: string, request: ExternalSourceRequest): Promise<ExternalSourceResult> {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) throw new Error(`External source adapter is not registered: ${adapterId}`);
    if (!request.ownerUserId.trim()) throw new Error("Authenticated ZCOS owner is required");
    const result = await adapter.retrieve(request);
    if (result.requestId !== request.requestId) throw new Error("External source result request mismatch");
    return {
      ...result,
      evidence: result.evidence.map((item) => ({
        ...item,
        provenance: { ...item.provenance, adapterId },
      })),
    };
  }
}

export const externalSourceGateway = new ExternalSourceGateway();
