import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { buildPersonalizedRecommendations, buildThreatTrainingInsights } from "@/features/ai/insights";
import { PersonalizedLearningPanel } from "@/components/ai/personalized-learning-panel";
import { ThreatTrainingPanel } from "@/components/ai/threat-training-panel";

export default async function DashboardAiAssistantPage() {
  const user = await requireUserContext();
  const supabase = await createClient();

  const [recommendations, threats] = await Promise.all([
    buildPersonalizedRecommendations(supabase, {
      id: user.userId,
      organizationId: user.organizationId,
      role: user.role,
    }, 6),
    buildThreatTrainingInsights(supabase, {
      id: user.userId,
      organizationId: user.organizationId,
      role: user.role,
    }, 4),
  ]);

  return (
    <div className="space-y-6">
      <section className="hero-card p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">AI Intelligence Hub</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Personalized Learning + Threat Training</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Adaptive recommendations are generated from your learning trajectory, while the threat feed updates training
          priorities from current compliance and behavior signals.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <PersonalizedLearningPanel recommendations={recommendations} />
        <ThreatTrainingPanel threats={threats} />
      </div>
    </div>
  );
}
