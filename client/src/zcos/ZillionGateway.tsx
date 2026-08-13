import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Orbit, Plus } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export const ZCOS_SHARED_DOMAINS = ["identity", "memory", "knowledge", "apps", "desk", "settings", "portal"] as const;
export type ZcosDomain = (typeof ZCOS_SHARED_DOMAINS)[number];

export interface GalaxySurfaceConfig {
  id: "zeta" | "zync" | "zylo" | "zeno" | "zwap" | "zenith" | "zillion";
  name: string;
  console: string;
  desk: string;
  deskSurfaces: readonly string[];
  description: string;
}

export const GALAXY_SURFACES: Record<GalaxySurfaceConfig["id"], GalaxySurfaceConfig> = {
  zeta: { id: "zeta", name: "ZETA", console: "CONTROL", desk: "INTEGRITY", deskSurfaces: ["Logs", "Diagnostics", "Monitoring"], description: "System integrity, diagnostics, monitoring, and operational control." },
  zync: { id: "zync", name: "ZYNC", console: "CANVAS", desk: "BUILD", deskSurfaces: ["Coding", "Design", "Publish"], description: "Creation and production across code, design, and publishing." },
  zylo: { id: "zylo", name: "ZYLO", console: "COMPASS", desk: "AUTOMATE", deskSurfaces: ["Flows / Loops", "Skills", "Templates"], description: "Automation, reusable capabilities, and repeatable operating patterns." },
  zeno: { id: "zeno", name: "ZENO", console: "UNITE", desk: "FORUM", deskSurfaces: ["Threads", "Notes", "Rooms"], description: "Scheduling, collaboration, conversation, and shared work." },
  zwap: { id: "zwap", name: "ZWAP!", console: "DISCOVERY", desk: "EXPLORE", deskSurfaces: ["Glow", "News", "Journal / Blog"], description: "Discovery, adaptation, exploration, and personal growth." },
  zenith: { id: "zenith", name: "ZENITH", console: "LOGOS", desk: "SCHOLAR", deskSurfaces: ["Learning Studio", "Library", "Files"], description: "Learning, source material, files, and structured study." },
  zillion: { id: "zillion", name: "ZILLION", console: "PROSPER", desk: "CAPITAL", deskSurfaces: ["Budgeting", "Trading", "Investing"], description: "Capital intelligence for budgeting, trading, and investing." },
};

export function isGalaxyId(value: string | undefined): value is GalaxySurfaceConfig["id"] {
  return Boolean(value && Object.prototype.hasOwnProperty.call(GALAXY_SURFACES, value));
}
export function isZcosDomain(value: string | undefined): value is ZcosDomain {
  return Boolean(value && (ZCOS_SHARED_DOMAINS as readonly string[]).includes(value));
}
function domainLabel(domain: ZcosDomain): string { return domain.charAt(0).toUpperCase() + domain.slice(1); }

function CanonicalRecords({ config, domain }: { config: GalaxySurfaceConfig; domain: "memory" | "knowledge" }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest(`/api/zcos/${config.id}/${domain}`, "GET", undefined, config.name);
      setRecords(Array.isArray(result.records) ? result.records : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Unable to load ${domain}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [config.id, domain]);

  const save = async () => {
    if (!name.trim() || !detail.trim()) return;
    setSaving(true);
    setError("");
    try {
      const body = domain === "memory"
        ? { memoryType: "user_directed", canonicalName: name.trim(), content: detail.trim() }
        : { objectType: "concept", canonicalName: name.trim(), summary: detail.trim(), originClass: "UGC / Uploaded" };
      await apiRequest(`/api/zcos/${config.id}/${domain}`, "POST", body, config.name);
      setName("");
      setDetail("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Unable to save ${domain}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <p className="text-sm font-medium text-white/75">{domain === "memory" ? "Tell ZCOS what to remember" : "Add Knowledge"}</p>
        <input className="mt-3 min-h-[44px] w-full rounded-xl border border-white/10 bg-black/35 px-3 text-sm outline-none" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-black/35 p-3 text-sm outline-none" placeholder={domain === "memory" ? "What should be retained?" : "What should this partition understand?"} value={detail} onChange={(e) => setDetail(e.target.value)} />
        <button type="button" disabled={saving || !name.trim() || !detail.trim()} onClick={() => void save()} className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 text-sm disabled:opacity-40"><Plus size={16} />{saving ? "Saving…" : "Save"}</button>
      </div>

      {error && <p className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {loading ? <p className="text-sm text-white/40">Loading…</p> : records.length === 0 ? <p className="text-sm text-white/40">Nothing retained in this {config.name} partition yet.</p> : (
        <div className="space-y-2">
          {records.map((record) => (
            <article key={record.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-medium text-white/80">{record.canonicalName}</h3><span className="text-[10px] uppercase tracking-wider text-white/30">{record.lifecycleState}</span></div>
              <p className="mt-2 text-sm leading-6 text-white/50">{domain === "memory" ? record.content : record.summary || "No summary yet."}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function GalaxyConsole({ config, domain }: { config: GalaxySurfaceConfig; domain?: ZcosDomain }) {
  const [, navigate] = useLocation();
  const root = `/${config.id}`;
  useEffect(() => { if (domain === "portal") navigate("/"); }, [domain, navigate]);

  return (
    <main className="min-h-[100dvh] overflow-y-auto bg-[radial-gradient(circle_at_50%_15%,#121225_0%,#05050b_46%,#010103_100%)] px-4 pb-16 pt-5 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <button type="button" className="mb-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white/70" onClick={() => navigate(domain ? root : "/")}><ArrowLeft size={16} /> {domain ? config.name : "Constellation"}</button>
        <header className="rounded-[2rem] border border-white/10 bg-black/35 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-white/45"><Orbit size={16} /> {config.console} Console</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{config.name}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">{config.description}</p>
        </header>

        {domain && domain !== "portal" ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">{config.name} Partition</p>
            <h2 className="mt-2 text-2xl font-semibold">{domainLabel(domain)}</h2>
            {domain === "desk" ? (
              <div className="mt-5"><p className="text-sm font-medium text-white/70">{config.desk} Desk</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{config.deskSurfaces.map((surface) => <div key={surface} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/75">{surface}</div>)}</div></div>
            ) : domain === "memory" || domain === "knowledge" ? (
              <CanonicalRecords config={config} domain={domain} />
            ) : (
              <p className="mt-4 text-sm leading-6 text-white/55">This is the {config.name} projection of the shared ZCOS {domainLabel(domain)} authority. Records retain {config.name} partition origin while canonical ownership remains governed by ZCOS.</p>
            )}
          </section>
        ) : (
          <section className="mt-5 grid gap-3 sm:grid-cols-2">{ZCOS_SHARED_DOMAINS.map((item) => (
            <button key={item} type="button" className="flex min-h-[68px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-5 text-left transition hover:bg-white/[0.07]" onClick={() => navigate(item === "portal" ? "/" : `${root}/${item}`)}><span><span className="block text-sm font-medium">{item === "desk" ? `${config.desk} Desk` : domainLabel(item)}</span>{item === "desk" && <span className="mt-1 block text-xs text-white/40">{config.deskSurfaces.join(" · ")}</span>}</span><ChevronRight size={18} className="text-white/35" /></button>
          ))}</section>
        )}
      </div>
    </main>
  );
}

export default function ZillionGateway() { return <GalaxyConsole config={GALAXY_SURFACES.zillion} />; }
export function ZarGateway() {
  const destination = (import.meta.env.VITE_ZAR_APP_URL || "https://zar-ai.online").replace(/\/$/, "");
  useEffect(() => { window.location.assign(destination); }, [destination]);
  return <main className="flex min-h-[100dvh] items-center justify-center bg-black px-4 text-center text-white"><p className="text-sm text-white/55">Opening ZAR at {destination}…</p></main>;
}
export function GalaxyGateway() {
  const params = useParams<{ galaxy?: string; domain?: string }>();
  const segments = window.location.pathname.split("/").filter(Boolean);
  const pathGalaxy = segments[0] === "galaxy" ? segments[1] : segments[0];
  const pathDomain = segments[0] === "galaxy" ? segments[2] : segments[1];
  const galaxy = params.galaxy || pathGalaxy;
  const domain = params.domain || pathDomain;
  if (!isGalaxyId(galaxy)) return <main className="flex min-h-[100dvh] items-center justify-center bg-black text-white">Unknown ZCOS galaxy.</main>;
  return <GalaxyConsole config={GALAXY_SURFACES[galaxy]} domain={isZcosDomain(domain) ? domain : undefined} />;
}
export function ZcosPathGateway() { return <main className="flex min-h-[100dvh] items-center justify-center bg-black px-4 text-center text-white"><p className="text-sm text-white/55">This legacy path remains available during ZCOS migration.</p></main>; }
