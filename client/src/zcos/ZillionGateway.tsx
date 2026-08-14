import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Orbit, Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export const ZCOS_SHARED_DOMAINS = ["identity", "memory", "knowledge", "apps", "desk", "settings", "portal"] as const;
export type ZcosDomain = (typeof ZCOS_SHARED_DOMAINS)[number];

type MemorySurface = "you" | "topics" | "galaxies";
type KnowledgeSurface = "topics" | "map" | "sources" | "lexicon" | "curation";

const MEMORY_SURFACES: readonly MemorySurface[] = ["you", "topics", "galaxies"];
const KNOWLEDGE_SURFACES: readonly KnowledgeSurface[] = ["topics", "map", "sources", "lexicon", "curation"];

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

function domainLabel(domain: string): string {
  return domain.charAt(0).toUpperCase() + domain.slice(1).replace(/_/g, " ");
}

function SurfaceCard({ title, detail, onClick }: { title: string; detail?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[72px] w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-5 text-left transition hover:bg-white/[0.07]">
      <span>
        <span className="block text-sm font-medium text-white/80">{title}</span>
        {detail && <span className="mt-1 block text-xs leading-5 text-white/40">{detail}</span>}
      </span>
      <ChevronRight size={18} className="shrink-0 text-white/30" />
    </button>
  );
}

function MemoryRecordCard({ config, record, onChanged }: { config: GalaxySurfaceConfig; record: any; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(String(record.content || ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const mutate = async (action: "confirm" | "reject" | "correct" | "forget") => {
    setBusy(true);
    setError("");
    try {
      if (action === "forget") {
        await apiRequest(`/api/zcos/${config.id}/memory/${record.id}`, "DELETE", undefined, config.name);
      } else if (action === "correct") {
        await apiRequest(`/api/zcos/${config.id}/memory/${record.id}/correct`, "PATCH", { content }, config.name);
        setEditing(false);
      } else {
        await apiRequest(`/api/zcos/${config.id}/memory/${record.id}/${action}`, "PATCH", {}, config.name);
      }
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update memory");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-white/80">{record.canonicalName}</h3>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/30">{record.memoryType?.replace(/_/g, " ")} · {record.lifecycleState}</p>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/35">{record.galaxyId}</span>
      </div>

      {editing ? (
        <div className="mt-3">
          <textarea className="min-h-24 w-full resize-none rounded-xl border border-white/10 bg-black/35 p-3 text-sm text-white/75 outline-none" value={content} onChange={(e) => setContent(e.target.value)} />
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={busy || !content.trim()} onClick={() => void mutate("correct")} className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 text-xs"><Check size={14} /> Save correction</button>
            <button type="button" disabled={busy} onClick={() => { setEditing(false); setContent(String(record.content || "")); }} className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/10 px-3 text-xs text-white/55"><X size={14} /> Cancel</button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-white/55">{record.content}</p>
      )}

      {Array.isArray(record.topics) && record.topics.length > 0 && <p className="mt-3 text-xs text-white/35">{record.topics.join(" · ")}</p>}
      {error && <p className="mt-3 text-xs text-red-200">{error}</p>}

      {!editing && (
        <div className="mt-4 flex flex-wrap gap-2">
          {record.lifecycleState === "proposed" && <button type="button" disabled={busy} onClick={() => void mutate("confirm")} className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-white/10 px-3 text-xs text-white/65"><Check size={14} /> Confirm</button>}
          {record.lifecycleState === "proposed" && <button type="button" disabled={busy} onClick={() => void mutate("reject")} className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-white/10 px-3 text-xs text-white/65"><X size={14} /> Reject</button>}
          {["active", "confirmed", "corrected"].includes(record.lifecycleState) && <button type="button" disabled={busy} onClick={() => setEditing(true)} className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-white/10 px-3 text-xs text-white/65"><Pencil size={14} /> Correct</button>}
          <button type="button" disabled={busy} onClick={() => void mutate("forget")} className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-red-400/15 px-3 text-xs text-red-200/70"><Trash2 size={14} /> Forget</button>
        </div>
      )}
    </article>
  );
}

function MemoryDomain({ config, surface }: { config: GalaxySurfaceConfig; surface?: string }) {
  const [, navigate] = useLocation();
  const [records, setRecords] = useState<any[]>([]);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const activeSurface = MEMORY_SURFACES.includes(surface as MemorySurface) ? surface as MemorySurface : undefined;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest(`/api/zcos/${config.id}/memory?review=true`, "GET", undefined, config.name);
      setRecords(Array.isArray(result.records) ? result.records : []);
      setMemoryEnabled(result.memoryEnabled !== false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load Memory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [config.id]);

  const save = async () => {
    if (!name.trim() || !detail.trim() || !memoryEnabled) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/api/zcos/${config.id}/memory`, "POST", { memoryType: "user_directed", canonicalName: name.trim(), content: detail.trim() }, config.name);
      setName("");
      setDetail("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save Memory");
    } finally {
      setSaving(false);
    }
  };

  const groupedTopics = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const record of records) {
      const topics = Array.isArray(record.topics) && record.topics.length ? record.topics : ["Uncategorized"];
      for (const topic of topics) groups.set(String(topic), [...(groups.get(String(topic)) || []), record]);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [records]);

  if (!activeSurface) {
    return (
      <div className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <SurfaceCard title="You" detail="Experiences, decisions, people, and direct memories." onClick={() => navigate(`/${config.id}/memory/you`)} />
          <SurfaceCard title="Topics" detail="The same memories grouped by recurring subjects." onClick={() => navigate(`/${config.id}/memory/topics`)} />
          <SurfaceCard title="Galaxies" detail="Enter each actual ZCOS Memory partition." onClick={() => navigate(`/${config.id}/memory/galaxies`)} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white/75">Tell ZAR what to remember</p>
            <span className={`text-xs ${memoryEnabled ? "text-emerald-200/60" : "text-amber-200/60"}`}>{memoryEnabled ? "Memory on" : "Memory off"}</span>
          </div>
          <input disabled={!memoryEnabled} className="mt-3 min-h-[44px] w-full rounded-xl border border-white/10 bg-black/35 px-3 text-sm outline-none disabled:opacity-40" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea disabled={!memoryEnabled} className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-black/35 p-3 text-sm outline-none disabled:opacity-40" placeholder="What should be retained?" value={detail} onChange={(e) => setDetail(e.target.value)} />
          <button type="button" disabled={saving || !memoryEnabled || !name.trim() || !detail.trim()} onClick={() => void save()} className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 text-sm disabled:opacity-40"><Plus size={16} />{saving ? "Saving…" : "Remember"}</button>
        </div>
        {error && <p className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      </div>
    );
  }

  if (activeSurface === "galaxies") {
    return (
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {Object.values(GALAXY_SURFACES).map((galaxy) => <SurfaceCard key={galaxy.id} title={galaxy.name} detail={`${galaxy.console} Memory partition`} onClick={() => navigate(`/${galaxy.id}/memory/you`)} />)}
        <SurfaceCard title="ZAR" detail="Nexys Memory partition" onClick={() => navigate("/zar")} />
      </div>
    );
  }

  if (loading) return <p className="mt-5 text-sm text-white/40">Loading…</p>;
  if (error) return <p className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>;

  if (activeSurface === "topics") {
    return groupedTopics.length === 0 ? <p className="mt-5 text-sm text-white/40">No retained topics in this partition yet.</p> : (
      <div className="mt-5 space-y-5">
        {groupedTopics.map(([topic, items]) => (
          <section key={topic}>
            <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-white/35">{topic}</h3>
            <div className="space-y-2">{items.map((record) => <MemoryRecordCard key={record.id} config={config} record={record} onChanged={load} />)}</div>
          </section>
        ))}
      </div>
    );
  }

  return records.length === 0 ? <p className="mt-5 text-sm text-white/40">Nothing retained in this {config.name} partition yet.</p> : (
    <div className="mt-5 space-y-2">{records.map((record) => <MemoryRecordCard key={record.id} config={config} record={record} onChanged={load} />)}</div>
  );
}

function KnowledgeDomain({ config, surface }: { config: GalaxySurfaceConfig; surface?: string }) {
  const [, navigate] = useLocation();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const activeSurface = KNOWLEDGE_SURFACES.includes(surface as KnowledgeSurface) ? surface as KnowledgeSurface : undefined;

  const endpoint = activeSurface ? `/api/zcos/${config.id}/knowledge/${activeSurface}` : `/api/zcos/${config.id}/knowledge?review=true`;

  const load = async () => {
    setLoading(true);
    setError("");
    try { setData(await apiRequest(endpoint, "GET", undefined, config.name)); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load Knowledge"); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [endpoint, config.name]);

  const save = async () => {
    if (!name.trim() || !detail.trim()) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/api/zcos/${config.id}/knowledge`, "POST", { objectType: "concept", canonicalName: name.trim(), summary: detail.trim(), originClass: "UGC / Uploaded", sourceType: "direct text", evidenceExcerpt: detail.trim() }, config.name);
      setName("");
      setDetail("");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to add Knowledge"); }
    finally { setSaving(false); }
  };

  if (!activeSurface) {
    const records = Array.isArray(data?.records) ? data.records : [];
    return (
      <div className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <SurfaceCard title="Topics" detail="Canonical subjects organizing this partition." onClick={() => navigate(`/${config.id}/knowledge/topics`)} />
          <SurfaceCard title="Knowledge Map" detail="Objects and evidence-backed relationships." onClick={() => navigate(`/${config.id}/knowledge/map`)} />
          <SurfaceCard title="Sources" detail="UGC / Uploaded and Extracted / Compiled provenance." onClick={() => navigate(`/${config.id}/knowledge/sources`)} />
          <SurfaceCard title="Lexicon" detail="Contextual meanings, variants, and vocabulary." onClick={() => navigate(`/${config.id}/knowledge/lexicon`)} />
          <SurfaceCard title="Curation" detail="Conflicts, gaps, currency, and governed review." onClick={() => navigate(`/${config.id}/knowledge/curation`)} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-sm font-medium text-white/75">Add Knowledge</p>
          <input className="mt-3 min-h-[44px] w-full rounded-xl border border-white/10 bg-black/35 px-3 text-sm outline-none" placeholder="Canonical name" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-black/35 p-3 text-sm outline-none" placeholder="Source-grounded understanding" value={detail} onChange={(e) => setDetail(e.target.value)} />
          <button type="button" disabled={saving || !name.trim() || !detail.trim()} onClick={() => void save()} className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 text-sm disabled:opacity-40"><Plus size={16} />{saving ? "Saving…" : "Add candidate"}</button>
        </div>

        {records.length > 0 && <div className="space-y-2">{records.map((record: any) => <article key={record.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-medium text-white/80">{record.canonicalName}</h3><span className="text-[10px] uppercase tracking-wider text-white/30">{record.lifecycleState}</span></div><p className="mt-2 text-sm leading-6 text-white/50">{record.summary || "No summary."}</p><p className="mt-2 text-xs text-white/30">{record.originClass} · {record.currency}</p></article>)}</div>}
        {error && <p className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      </div>
    );
  }

  if (loading) return <p className="mt-5 text-sm text-white/40">Loading…</p>;
  if (error) return <p className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>;

  const items = activeSurface === "topics" ? data?.topics : activeSurface === "sources" ? data?.sources : activeSurface === "lexicon" ? data?.senses : activeSurface === "curation" ? data?.findings : data?.objects;
  const list = Array.isArray(items) ? items : [];

  if (activeSurface === "map") {
    const relationships = Array.isArray(data?.relationships) ? data.relationships : [];
    return (
      <div className="mt-5 space-y-4">
        <div><h3 className="text-xs uppercase tracking-[0.2em] text-white/35">Objects</h3><div className="mt-2 space-y-2">{list.length ? list.map((item: any) => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="text-sm text-white/75">{item.canonicalName}</p><p className="mt-1 text-xs text-white/35">{item.objectType} · {item.lifecycleState}</p></article>) : <p className="text-sm text-white/40">No Knowledge Map objects yet.</p>}</div></div>
        <div><h3 className="text-xs uppercase tracking-[0.2em] text-white/35">Relationships</h3><div className="mt-2 space-y-2">{relationships.length ? relationships.map((item: any) => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">{item.subjectId} → {item.predicate} → {item.objectId}</article>) : <p className="text-sm text-white/40">No evidence-backed relationships yet.</p>}</div></div>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-2">
      {list.length === 0 ? <p className="text-sm text-white/40">No {domainLabel(activeSurface)} records in this partition yet.</p> : list.map((item: any) => (
        <article key={item.id || item.sourceId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-medium text-white/80">{item.canonicalLabel || item.canonicalForm || item.canonicalName || item.title || item.sourceId}</h3>
            <span className="text-[10px] uppercase tracking-wider text-white/30">{item.lifecycleState || item.originClass || item.sourceType}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/50">{item.description || item.definition || item.summary || item.evidenceExcerpt || ""}</p>
          {item.currency && <p className="mt-2 text-xs text-white/30">{item.currency}</p>}
        </article>
      ))}
    </div>
  );
}

function SettingsDomain({ config }: { config: GalaxySurfaceConfig }) {
  const [memoryEnabled, setMemoryEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void apiRequest(`/api/zcos/${config.id}/memory/settings`, "GET", undefined, config.name)
      .then((result) => setMemoryEnabled(Boolean(result.memoryEnabled)))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load Settings"));
  }, [config.id, config.name]);

  const toggle = async () => {
    if (memoryEnabled === null) return;
    try {
      const result = await apiRequest(`/api/zcos/${config.id}/memory/settings`, "PATCH", { memoryEnabled: !memoryEnabled }, config.name);
      setMemoryEnabled(Boolean(result.memoryEnabled));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update Memory setting"); }
  };

  return (
    <div className="mt-5 space-y-3">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-white/35">System</p>
        <button type="button" disabled={memoryEnabled === null} onClick={() => void toggle()} className="mt-3 flex min-h-[52px] w-full items-center justify-between rounded-xl border border-white/10 px-4 text-left">
          <span><span className="block text-sm text-white/75">Enable Memory</span><span className="mt-1 block text-xs text-white/35">Controls long-term extraction and response retrieval across ZCOS.</span></span>
          <span className={`rounded-full px-3 py-1 text-xs ${memoryEnabled ? "bg-emerald-400/10 text-emerald-200/70" : "bg-white/5 text-white/40"}`}>{memoryEnabled ? "On" : "Off"}</span>
        </button>
      </section>
      {error && <p className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
    </div>
  );
}

function GalaxyConsole({ config, domain, surface }: { config: GalaxySurfaceConfig; domain?: ZcosDomain; surface?: string }) {
  const [, navigate] = useLocation();
  const root = `/${config.id}`;
  useEffect(() => { if (domain === "portal") navigate("/"); }, [domain, navigate]);

  return (
    <main className="min-h-[100dvh] overflow-y-auto bg-[radial-gradient(circle_at_50%_15%,#121225_0%,#05050b_46%,#010103_100%)] px-4 pb-16 pt-5 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <button type="button" className="mb-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white/70" onClick={() => navigate(surface ? `${root}/${domain}` : domain ? root : "/")}><ArrowLeft size={16} /> {surface ? domainLabel(domain || "") : domain ? config.name : "Constellation"}</button>
        <header className="rounded-[2rem] border border-white/10 bg-black/35 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-white/45"><Orbit size={16} /> {config.console} Console</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{config.name}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">{config.description}</p>
        </header>

        {domain && domain !== "portal" ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">{config.name} Partition</p>
            <h2 className="mt-2 text-2xl font-semibold">{surface ? domainLabel(surface) : domainLabel(domain)}</h2>
            {domain === "desk" ? (
              <div className="mt-5"><p className="text-sm font-medium text-white/70">{config.desk} Desk</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{config.deskSurfaces.map((deskSurface) => <div key={deskSurface} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/75">{deskSurface}</div>)}</div></div>
            ) : domain === "memory" ? (
              <MemoryDomain config={config} surface={surface} />
            ) : domain === "knowledge" ? (
              <KnowledgeDomain config={config} surface={surface} />
            ) : domain === "settings" ? (
              <SettingsDomain config={config} />
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
  const params = useParams<{ galaxy?: string; domain?: string; surface?: string }>();
  const segments = window.location.pathname.split("/").filter(Boolean);
  const offset = segments[0] === "galaxy" ? 1 : 0;
  const pathGalaxy = segments[offset];
  const pathDomain = segments[offset + 1];
  const pathSurface = segments[offset + 2];
  const galaxy = params.galaxy || pathGalaxy;
  const domain = params.domain || pathDomain;
  const surface = params.surface || pathSurface;
  if (!isGalaxyId(galaxy)) return <main className="flex min-h-[100dvh] items-center justify-center bg-black text-white">Unknown ZCOS galaxy.</main>;
  return <GalaxyConsole config={GALAXY_SURFACES[galaxy]} domain={isZcosDomain(domain) ? domain : undefined} surface={surface} />;
}

export function ZcosPathGateway() {
  return <main className="flex min-h-[100dvh] items-center justify-center bg-black px-4 text-center text-white"><p className="text-sm text-white/55">This legacy path remains available during ZCOS migration.</p></main>;
}
