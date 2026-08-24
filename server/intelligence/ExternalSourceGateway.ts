import LightningExternalSourceAdapter from "./LightningExternalSourceAdapter.js";

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
  readonly kinds: readonly ExternalSourceKind[];
  isConfigured?(): boolean;
  retrieve(request: ExternalSourceRequest): Promise<ExternalSourceResult>;
}

/** Provider-neutral evidence gateway. Providers never become reasoning authority. */
export class ExternalSourceGateway {
  private readonly adapters = new Map<string, ExternalSourceAdapter>();

  register(adapter: ExternalSourceAdapter): void {
    if (!adapter.id.trim()) throw new Error("External source adapter id is required");
    if (!adapter.kinds.length) throw new Error(`External source adapter ${adapter.id} must declare at least one source kind`);
    if (this.adapters.has(adapter.id)) throw new Error(`External source adapter already registered: ${adapter.id}`);
    this.adapters.set(adapter.id, adapter);
  }

  unregister(adapterId: string): void { this.adapters.delete(adapterId); }

  list(): Array<{ id: string; kinds: ExternalSourceKind[]; configured: boolean }> {
    return [...this.adapters.values()].map((adapter) => ({ id: adapter.id, kinds: [...adapter.kinds], configured: adapter.isConfigured ? adapter.isConfigured() : true }));
  }

  async retrieve(adapterId: string, request: ExternalSourceRequest): Promise<ExternalSourceResult> {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) throw Object.assign(new Error(`External source adapter is not registered: ${adapterId}`), { status: 404 });
    if (adapter.isConfigured && !adapter.isConfigured()) throw Object.assign(new Error(`External source adapter is not configured: ${adapterId}`), { status: 503 });
    if (!request.ownerUserId.trim()) throw new Error("Authenticated ZCOS owner is required");
    if (!request.galaxyId.trim()) throw new Error("Active galaxy is required");
    if (!request.requestId.trim() || !request.query.trim()) throw new Error("External source requestId and query are required");
    if (!request.sourceKinds.length || request.sourceKinds.some((kind) => !adapter.kinds.includes(kind))) throw Object.assign(new Error(`External source request asks ${adapterId} for an unsupported source kind`), { status: 400 });
    const result = await adapter.retrieve(request);
    if (result.requestId !== request.requestId) throw new Error("External source result request mismatch");
    return { ...result, evidence: result.evidence.map((item) => ({ ...item, provenance: { ...item.provenance, adapterId } })) };
  }
}

export const externalSourceGateway = new ExternalSourceGateway();
externalSourceGateway.register(new LightningExternalSourceAdapter());
