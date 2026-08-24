import { createHash } from "crypto";
import type { ExternalSourceAdapter, ExternalSourceRequest, ExternalSourceResult } from "./ExternalSourceGateway.js";

function config() {
  const baseUrl = String(process.env.LIGHTNING_BASE_URL || process.env.LIGHTNING_AI_URL || "https://lightning.ai/api/v1").replace(/\/+$/, "");
  const apiKey = String(process.env.LIGHTNING_API_KEY || process.env.LIGHTNING_AI_API_KEY || process.env.LIGHTNING_TOKEN || "").trim();
  const configured = [...String(process.env.LIGHTNING_MODELS || "").split(","), String(process.env.LIGHTNING_MODEL || "")]
    .map((value) => value.trim()).filter(Boolean);
  const models = [...new Set(configured.length ? configured : ["lightning-ai/gemma-4-31B-it", "lightning-ai/gpt-oss-120b"])];
  return { baseUrl, apiKey, chatPath: process.env.LIGHTNING_CHAT_PATH || "/chat/completions", timeoutMs: Number(process.env.LIGHTNING_TIMEOUT_MS || 45000), models };
}

function extractText(payload: unknown): string {
  const data = payload as any;
  const content = data?.choices?.[0]?.message?.content ?? data?.output_text ?? data?.text ?? data?.response;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.map((part) => typeof part === "string" ? part : part?.text || "").join("\n").trim();
  return "";
}

export class LightningExternalSourceAdapter implements ExternalSourceAdapter {
  readonly id = "lightning";
  readonly kinds = ["model"] as const;

  isConfigured(): boolean {
    return Boolean(config().apiKey);
  }

  async retrieve(request: ExternalSourceRequest): Promise<ExternalSourceResult> {
    if (!request.sourceKinds.includes("model")) throw new Error("Lightning adapter only accepts model evidence requests");
    const cfg = config();
    if (!cfg.apiKey) throw Object.assign(new Error("Lightning external source is not configured: LIGHTNING_API_KEY is required"), { status: 503 });
    const errors: string[] = [];

    for (const model of cfg.models) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
      try {
        const response = await fetch(`${cfg.baseUrl}${cfg.chatPath}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "Return research evidence only. Preserve uncertainty, distinguish sourced facts from inference, and include source names or locators when known. Do not make decisions for ZCOS." },
              { role: "user", content: request.query },
            ],
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          errors.push(`${model}: HTTP ${response.status}${detail ? ` ${detail.slice(0, 300)}` : ""}`);
          continue;
        }
        const payload = await response.json();
        const content = extractText(payload);
        if (!content) {
          errors.push(`${model}: empty response`);
          continue;
        }
        const retrievedAt = new Date().toISOString();
        const sourceId = `lightning:${model}:${createHash("sha256").update(content).digest("hex").slice(0, 16)}`;
        return {
          requestId: request.requestId,
          evidence: [{ sourceId, sourceKind: "model", title: `Lightning model evidence (${model})`, locator: `${cfg.baseUrl}${cfg.chatPath}`, retrievedAt, content, provenance: { provider: "lightning", model, evidenceOnly: true } }],
          providerTrace: { provider: "lightning", model, evidenceOnly: true },
        };
      } catch (error) {
        errors.push(`${model}: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        clearTimeout(timer);
      }
    }

    throw Object.assign(new Error(`Lightning evidence retrieval failed: ${errors.join(" | ")}`), { status: 502 });
  }
}

export default LightningExternalSourceAdapter;
