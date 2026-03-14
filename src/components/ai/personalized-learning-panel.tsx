import Link from "next/link";
import type { PersonalizedRecommendation } from "@/features/ai/insights";

type PersonalizedLearningPanelProps = {
  recommendations: PersonalizedRecommendation[];
};

function priorityClass(priority: number): string {
  if (priority >= 80) return "bg-rose-100 text-rose-700";
  if (priority >= 60) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export function PersonalizedLearningPanel({ recommendations }: PersonalizedLearningPanelProps) {
  return (
    <section className="surface-card p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">AI-Powered Personalized Learning</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">Adaptive Recommendations</h2>
        </div>
        <span className="badge">{recommendations.length} prioritized modules</span>
      </div>

      <div className="mt-4 space-y-3">
        {recommendations.map((item) => (
          <article key={item.moduleId} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.regulation} · {item.estimatedMinutes} min · status: {item.currentStatus.replace("_", " ")}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${priorityClass(item.priority)}`}>
                Priority {item.priority}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-600">{item.reason}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={`/training/${item.moduleId}/learn`}
                className="btn-primary rounded-md px-3 py-1.5 text-xs font-semibold"
              >
                {item.suggestedAction}
              </Link>
              <Link
                href={`/training/${item.moduleId}`}
                className="btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold"
              >
                View module
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
