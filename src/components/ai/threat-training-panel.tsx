import Link from "next/link";
import type { ThreatTrainingInsight } from "@/features/ai/insights";

type ThreatTrainingPanelProps = {
  threats: ThreatTrainingInsight[];
};

function severityClass(severity: ThreatTrainingInsight["severity"]): string {
  if (severity === "critical") return "bg-rose-100 text-rose-700";
  if (severity === "high") return "bg-amber-100 text-amber-700";
  return "bg-sky-100 text-sky-700";
}

export function ThreatTrainingPanel({ threats }: ThreatTrainingPanelProps) {
  return (
    <section className="surface-card p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Real-Time Security Threat Training</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">Threat Intelligence Feed</h2>
        </div>
        <span className="badge">{threats.length} active risk signals</span>
      </div>

      <div className="mt-4 space-y-3">
        {threats.map((threat) => (
          <article key={threat.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">{threat.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {threat.regulation} · score {threat.severityScore}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${severityClass(threat.severity)}`}>
                {threat.severity}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-600">{threat.summary}</p>

            {threat.signals.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs text-slate-500">
                {threat.signals.slice(0, 3).map((signal) => (
                  <li key={signal}>• {signal}</li>
                ))}
              </ul>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {threat.recommendedModuleId ? (
                <Link
                  href={`/training/${threat.recommendedModuleId}/learn`}
                  className="btn-primary rounded-md px-3 py-1.5 text-xs font-semibold"
                >
                  Start: {threat.recommendedModuleTitle ?? "Recommended module"}
                </Link>
              ) : null}
              <Link href="/training" className="btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold">
                Open training catalog
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
