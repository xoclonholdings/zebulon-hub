import { useEffect, useState } from "react";
import { ArrowLeft, Database, BookOpen, FolderOpen, ShieldCheck, Trash2 } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";

const GALAXIES = ["ZAR", "ZYNC", "ZETA", "ZENO", "ZYLO", "ZWAP!", "ZENITH", "ZILLION"] as const;
type CommandSurface = "memory" | "knowledge" | "projects" | "access";
const COMMAND_SURFACES = new Set<CommandSurface>(["memory", "knowledge", "projects", "access"]);

function RecordList({ records, kind }: { records: any[]; kind: "memory" | "knowledge" }) {
  if (!records.length) return <p className="text-sm text-white/40">No canonical {kind} records are available yet.</p>;
  return (
    <div className="space-y-2">
      {records.map((record) => (
        <article key={record.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-medium text-white/80">{record.canonicalName}</h3>
            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/35">{record.galaxyId}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/50">{kind === "memory" ? record.content : record.summary || ""}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-white/30">{record.lifecycleState}</p>
        </article>
      ))}
    </div>
  );
}

function AdminAccess() {
  const [grants, setGrants] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [sourceGalaxyId, setSourceGalaxyId] = useState("ZAR");
  const [targetGalaxyId, setTargetGalaxyId] = useState("ZILLION");
  const [authorityKind, setAuthorityKind] = useState("memory");
  const [permissions, setPermissions] = useState<string[]>(["read"]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError("");
    try {
      const [grantResult, auditResult] = await Promise.all([
        apiRequest("/api/zcos/admin/grants"),
        apiRequest("/api/zcos/admin/audit?limit=50"),
      ]);
      setGrants(Array.isArray(grantResult.grants) ? grantResult.grants : []);
      setAudit(Array.isArray(auditResult.events) ? auditResult.events : []);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load Admin Access"); }
  };

  useEffect(() => { void load(); }, []);

  const togglePermission = (permission: string) => {
    setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);
  };

  const createGrant = async () => {
    if (sourceGalaxyId === targetGalaxyId || permissions.length === 0) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest("/api/zcos/admin/grants", "POST", { sourceGalaxyId, targetGalaxyId, authorityKind, permissions });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create grant"); }
    finally { setBusy(false); }
  };

  const revoke = async (id: string) => {
    setBusy(true);
    setError("");
    try { await apiRequest(`/api/zcos/admin/grants/${id}`, "DELETE"); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to revoke grant"); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="text-sm font-medium text-white/80">Cross-galaxy authorization</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-white/45">From
            <select value={sourceGalaxyId} onChange={(e) => setSourceGalaxyId(e.target.value)} className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white/75">{GALAXIES.map((galaxy) => <option key={galaxy}>{galaxy}</option>)}</select>
          </label>
          <label className="text-xs text-white/45">To
            <select value={targetGalaxyId} onChange={(e) => setTargetGalaxyId(e.target.value)} className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white/75">{GALAXIES.map((galaxy) => <option key={galaxy}>{galaxy}</option>)}</select>
          </label>
          <label className="text-xs text-white/45">Authority
            <select value={authorityKind} onChange={(e) => setAuthorityKind(e.target.value)} className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white/75"><option value="memory">Memory</option><option value="knowledge">Knowledge</option></select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["read", "write", "contribute", "admin"].map((permission) => <button key={permission} type="button" onClick={() => togglePermission(permission)} className={`min-h-[38px] rounded-full border px-3 text-xs ${permissions.includes(permission) ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100" : "border-white/10 text-white/45"}`}>{permission}</button>)}
        </div>
        <button type="button" disabled={busy || sourceGalaxyId === targetGalaxyId || permissions.length === 0} onClick={() => void createGrant()} className="mt-4 min-h-[44px] rounded-full border border-white/10 bg-white/10 px-4 text-sm text-white/75 disabled:opacity-35">Save authorization</button>
      </section>

      <section>
        <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-white/35">Active and historical grants</h3>
        <div className="space-y-2">{grants.length ? grants.map((grant) => <article key={grant.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div><p className="text-sm text-white/75">{grant.sourceGalaxyId} → {grant.targetGalaxyId}</p><p className="mt-1 text-xs text-white/35">{grant.authorityKind} · {grant.permissions.join(", ")} {grant.revokedAt ? "· revoked" : ""}</p></div>{!grant.revokedAt && <button type="button" disabled={busy} onClick={() => void revoke(grant.id)} className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-red-400/15 px-3 text-xs text-red-200/70"><Trash2 size={14} /> Revoke</button>}</article>) : <p className="text-sm text-white/40">No grants configured.</p>}</div>
      </section>

      <section>
        <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-white/35">Audit</h3>
        <div className="space-y-2">{audit.length ? audit.map((event) => <article key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><p className="text-sm text-white/65">{event.eventType}</p><p className="mt-1 text-xs text-white/30">{event.galaxyId || "ZCOS"} · {new Date(event.createdAt).toLocaleString()}</p></article>) : <p className="text-sm text-white/40">No audit events yet.</p>}</div>
      </section>
      {error && <p className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
    </div>
  );
}

export default function ZcosCommandDesk() {
  const [, navigate] = useLocation();
  const params = useParams<{ surface?: string }>();
  const routeSurface = params.surface && COMMAND_SURFACES.has(params.surface as CommandSurface) ? params.surface as CommandSurface : null;
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (routeSurface !== "memory" && routeSurface !== "knowledge") { setRecords([]); return; }
    setLoading(true);
    setError("");
    void apiRequest(`/api/zcos/admin/all-${routeSurface}`)
      .then((result) => setRecords(Array.isArray(result.records) ? result.records : []))
      .catch((e) => setError(e instanceof Error ? e.message : `Unable to load All ${routeSurface}`))
      .finally(() => setLoading(false));
  }, [routeSurface]);

  const cards: Array<{ id: CommandSurface; title: string; detail: string; Icon: typeof Database }> = [
    { id: "memory", title: "All Memory", detail: "Unified administrative view across all eight Memory partitions.", Icon: Database },
    { id: "knowledge", title: "All Knowledge", detail: "Unified view of canonical Knowledge while preserving galaxy origin.", Icon: BookOpen },
    { id: "projects", title: "All Projects", detail: "Unified view of work created through galaxy Desks.", Icon: FolderOpen },
    { id: "access", title: "Admin Access", detail: "Cross-galaxy authorization, revocation, permissions, and audit governance.", Icon: ShieldCheck },
  ];

  return (
    <main className="min-h-[100dvh] overflow-y-auto bg-[radial-gradient(circle_at_50%_15%,#121225_0%,#05050b_46%,#010103_100%)] px-4 pb-16 pt-5 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <button type="button" onClick={() => navigate(routeSurface ? "/admin" : "/")} className="mb-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white/70"><ArrowLeft size={16} /> {routeSurface ? "Command Desk" : "Constellation"}</button>
        <header className="rounded-[2rem] border border-white/10 bg-black/35 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.28em] text-white/40">ZCOS</p>
          <h1 className="mt-2 text-3xl font-semibold">Command Desk</h1>
          <p className="mt-3 text-sm leading-6 text-white/50">System-wide visibility and authorization without collapsing galaxy ownership.</p>
        </header>

        {!routeSurface ? (
          <section className="mt-5 grid gap-3 sm:grid-cols-2">{cards.map(({ id, title, detail, Icon }) => <button key={id} type="button" onClick={() => navigate(`/admin/${id}`)} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left"><Icon size={19} className="text-white/55" /><h2 className="mt-3 text-sm font-medium text-white/80">{title}</h2><p className="mt-2 text-xs leading-5 text-white/40">{detail}</p></button>)}</section>
        ) : (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold">{cards.find((card) => card.id === routeSurface)?.title}</h2>
            <div className="mt-5">
              {routeSurface === "access" ? <AdminAccess /> : routeSurface === "projects" ? <p className="text-sm leading-6 text-white/45">The canonical Project service is not connected to ZCOS Command yet. Existing project/workspace records remain migration sources until Phase 6 ownership migration is completed.</p> : loading ? <p className="text-sm text-white/40">Loading…</p> : error ? <p className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : <RecordList records={records} kind={routeSurface} />}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
