import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

import { apiRequest } from "@/lib/queryClient";

interface AuditEvent {
  readonly id: string;
  readonly eventType?: string;
  readonly galaxyId?: string | null;
  readonly createdAt?: string;
}

export default function HistoryPage() {
  const [, navigate] = useLocation();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void apiRequest("/api/zcos/admin/audit?limit=50")
      .then((result) => { if (active) setEvents(Array.isArray(result.events) ? result.events : []); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load History."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-[100dvh] overflow-y-auto bg-[radial-gradient(circle_at_50%_15%,#121225_0%,#05050b_46%,#010103_100%)] px-4 pb-16 pt-5 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <button type="button" onClick={() => navigate("/")} className="mb-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white/70">
          <ArrowLeft size={16} /> Constellation
        </button>
        <header className="rounded-[2rem] border border-white/10 bg-black/35 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.28em] text-white/40">ZCOS Commander</p>
          <h1 className="mt-2 text-3xl font-semibold">History</h1>
          <p className="mt-3 text-sm leading-6 text-white/50">Recent authorized activity across ZCOS.</p>
        </header>
        <section className="mt-5">
          {loading ? <p className="text-sm text-white/40">Loading history…</p> : error ? (
            <p className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>
          ) : events.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">No activity has been recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <article key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-sm text-white/65">{event.eventType || "event"}</p>
                  <p className="mt-1 text-xs text-white/30">{event.galaxyId || "ZCOS"}{event.createdAt ? ` · ${new Date(event.createdAt).toLocaleString()}` : ""}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
