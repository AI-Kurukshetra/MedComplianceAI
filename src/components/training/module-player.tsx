import Link from "next/link";
import { ModuleTimeTracker } from "@/components/training/module-time-tracker";

type ModulePlayerProps = {
  moduleId: string;
  title: string;
  description: string;
  contentMarkdown: string;
  contentUrl: string | null;
  estimatedMinutes: number;
};

export function ModulePlayer({
  moduleId,
  title,
  description,
  contentMarkdown,
  contentUrl,
  estimatedMinutes,
}: ModulePlayerProps) {
  const lowerUrl = contentUrl?.toLowerCase() ?? "";
  const isDirectVideo =
    lowerUrl.endsWith(".mp4") || lowerUrl.endsWith(".webm") || lowerUrl.endsWith(".ogg");

  return (
    <section className="space-y-6">
      <ModuleTimeTracker moduleId={moduleId} estimatedMinutes={estimatedMinutes} />

      <div className="surface-card overflow-hidden">
        <div className="aspect-video bg-slate-900">
          {contentUrl ? (
            isDirectVideo ? (
              <video
                src={contentUrl}
                title={title}
                className="h-full w-full"
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <iframe
                src={contentUrl}
                title={title}
                className="h-full w-full"
                allowFullScreen
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-100">Interactive lesson preview</p>
                <p className="mt-1 text-xs text-slate-300">No media URL was configured for this module yet.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-5">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
          {contentMarkdown.trim() ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Custom Organization Content</p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
                {contentMarkdown}
              </pre>
            </div>
          ) : null}
        </div>
      </div>

      <div className="surface-card p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Next Step</h3>
        <p className="mt-2 text-sm text-slate-600">After reviewing this lesson, complete the assessment to update your assignment status.</p>
        <Link href={`/training/${moduleId}/quiz`} className="btn-primary mt-4 inline-flex w-full justify-center rounded-md px-4 py-2 text-sm font-semibold sm:w-auto">
          Start Assessment
        </Link>
      </div>
    </section>
  );
}
