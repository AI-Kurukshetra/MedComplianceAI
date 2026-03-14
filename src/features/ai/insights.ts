import type { createClient } from "@/lib/supabase/server";
import { REGULATIONS, type Regulation } from "@/lib/constants/regulations";
import { audienceFilterForRole, canRoleAccessAudience } from "@/lib/training/role-access";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type AuthUser = {
  id: string;
  organizationId: string;
  role: string;
};

type ModuleRow = {
  id: string;
  title: string;
  description: string;
  regulation: Regulation;
  audience_role: string;
  estimated_minutes: number;
};

type AssignmentRow = {
  module_id: string;
  status: "assigned" | "in_progress" | "completed" | "overdue";
  score: number | null;
  due_date: string | null;
  time_spent_minutes: number;
};

type AttemptRow = {
  module_id: string;
  score: number | null;
  passed: boolean;
  completed_at: string | null;
  training_modules: { regulation: Regulation }[] | null;
};

type AuditSignalRow = {
  action: string;
  created_at: string;
};

type NotificationSignalRow = {
  kind: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
};

type OrgAssignmentRow = {
  user_id: string;
  status: "assigned" | "in_progress" | "completed" | "overdue";
  score: number | null;
  due_date: string | null;
  assigned_at: string;
  completed_at: string | null;
  training_modules: { regulation: Regulation }[] | null;
};

type OrgAttemptRow = {
  user_id: string;
  score: number | null;
  passed: boolean;
  completed_at: string | null;
};

export type PersonalizedRecommendation = {
  moduleId: string;
  title: string;
  regulation: Regulation;
  estimatedMinutes: number;
  priority: number;
  currentStatus: "not_assigned" | "assigned" | "in_progress" | "completed" | "overdue";
  reason: string;
  suggestedAction: string;
};

export type ThreatTrainingInsight = {
  id: string;
  title: string;
  regulation: Regulation;
  severity: "critical" | "high" | "medium";
  severityScore: number;
  summary: string;
  signals: string[];
  recommendedModuleId: string | null;
  recommendedModuleTitle: string | null;
  updatedAt: string;
};

export type PredictiveUserRisk = {
  userId: string;
  fullName: string;
  email: string | null;
  role: string;
  assigned: number;
  completed: number;
  overdue: number;
  dueSoon: number;
  avgScore: number | null;
  completionPct: number;
  inactivityDays: number | null;
  riskScore: number;
  riskTier: "critical" | "high" | "medium" | "low";
};

export type PredictiveRegulationRisk = {
  regulation: Regulation;
  assigned: number;
  completionPct: number;
  avgScore: number | null;
  overdue: number;
  riskScore: number;
};

export type PredictiveAnalyticsResult = {
  generatedAt: string;
  horizonDays: number;
  organizationRiskScore: number;
  predictedOverdueCount: number;
  atRiskUsers: number;
  criticalUsers: number;
  interventions: string[];
  userRisks: PredictiveUserRisk[];
  regulationRisks: PredictiveRegulationRisk[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toRiskTier(score: number): "critical" | "high" | "medium" | "low" {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function lastIsoTimestamp(values: Array<string | null | undefined>): string | null {
  const timestamps = values.filter((value): value is string => Boolean(value));
  if (timestamps.length === 0) {
    return null;
  }

  return timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
}

function computeCompletionPct(completed: number, assigned: number): number {
  return assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
}

function computeAverage(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

export async function buildPersonalizedRecommendations(
  supabase: SupabaseServerClient,
  user: AuthUser,
  limit = 6,
): Promise<PersonalizedRecommendation[]> {
  const safeLimit = clamp(limit, 1, 12);

  const [moduleRes, assignmentRes, attemptRes] = await Promise.all([
    supabase
      .from("training_modules")
      .select("id, title, description, regulation, audience_role, estimated_minutes")
      .eq("organization_id", user.organizationId)
      .eq("is_active", true)
      .or(audienceFilterForRole(user.role)),
    supabase
      .from("module_assignments")
      .select("module_id, status, score, due_date, time_spent_minutes")
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.id),
    supabase
      .from("assessment_attempts")
      .select("module_id, score, passed, completed_at, training_modules(regulation)")
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(120),
  ]);

  const modules = (moduleRes.data ?? []) as ModuleRow[];
  const assignments = (assignmentRes.data ?? []) as AssignmentRow[];
  const attempts = (attemptRes.data ?? []) as AttemptRow[];

  const assignmentByModule = new Map(assignments.map((item) => [item.module_id, item]));
  const failedAttemptsByModule = new Map<string, number>();
  const avgScoreByRegulation = new Map<Regulation, number>();

  for (const regulation of REGULATIONS) {
    const regulationScores = attempts
      .filter((item) => item.training_modules?.[0]?.regulation === regulation)
      .map((item) => Number(item.score ?? 0));
    avgScoreByRegulation.set(regulation, computeAverage(regulationScores) ?? 0);
  }

  for (const attempt of attempts) {
    if (attempt.passed) continue;
    failedAttemptsByModule.set(
      attempt.module_id,
      (failedAttemptsByModule.get(attempt.module_id) ?? 0) + 1,
    );
  }

  const recommendations = modules.map((module) => {
    const assignment = assignmentByModule.get(module.id);
    const failedAttempts = failedAttemptsByModule.get(module.id) ?? 0;
    const regulationAvg = avgScoreByRegulation.get(module.regulation) ?? 0;

    let priority = 12;
    const reasons: string[] = [];
    let suggestedAction = "Start this module";
    let status: PersonalizedRecommendation["currentStatus"] = "not_assigned";

    if (!assignment) {
      priority += 34;
      reasons.push("Not yet assigned to your learning track");
    } else {
      status = assignment.status;
      if (assignment.status === "overdue") {
        priority += 40;
        reasons.push("Marked overdue and requires immediate completion");
        suggestedAction = "Resume now";
      } else if (assignment.status === "assigned") {
        priority += 24;
        reasons.push("Already assigned and waiting to be started");
      } else if (assignment.status === "in_progress") {
        priority += 18;
        reasons.push("In progress and ready for completion");
        suggestedAction = "Continue learning";
      } else if (assignment.status === "completed") {
        priority -= 14;
        reasons.push("Completed previously");
        suggestedAction = "Refresh knowledge";
      }

      if (assignment.score !== null && assignment.score < 80) {
        priority += Math.round((80 - assignment.score) * 0.6);
        reasons.push(`Prior score ${assignment.score}% indicates remediation needed`);
      }
    }

    if (failedAttempts > 0) {
      priority += failedAttempts * 14;
      reasons.push(`${failedAttempts} failed assessment attempt${failedAttempts > 1 ? "s" : ""} on this module`);
      suggestedAction = "Review module and retake quiz";
    }

    if (regulationAvg > 0 && regulationAvg < 80) {
      priority += Math.round((80 - regulationAvg) * 0.55);
      reasons.push(`${module.regulation} average score is ${Math.round(regulationAvg)}% across your attempts`);
    }

    priority = clamp(priority, 0, 100);

    return {
      moduleId: module.id,
      title: module.title,
      regulation: module.regulation,
      estimatedMinutes: module.estimated_minutes,
      priority,
      currentStatus: status,
      reason: reasons[0] ?? "Recommended based on your compliance progression pattern",
      suggestedAction,
    };
  });

  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, safeLimit);
}

export async function buildThreatTrainingInsights(
  supabase: SupabaseServerClient,
  user: AuthUser,
  limit = 4,
): Promise<ThreatTrainingInsight[]> {
  const safeLimit = clamp(limit, 1, 10);
  const threatLookbackDays = 14;
  const lookbackIso = new Date(Date.now() - threatLookbackDays * 86400000).toISOString();

  const [moduleRes, assignmentRes, attemptRes, auditRes, notificationRes] = await Promise.all([
    supabase
      .from("training_modules")
      .select("id, title, description, regulation, audience_role, estimated_minutes")
      .eq("organization_id", user.organizationId)
      .eq("is_active", true)
      .or(audienceFilterForRole(user.role)),
    supabase
      .from("module_assignments")
      .select("module_id, status, score, due_date, time_spent_minutes")
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.id),
    supabase
      .from("assessment_attempts")
      .select("module_id, score, passed, completed_at, training_modules(regulation)")
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.id)
      .gte("completed_at", lookbackIso),
    supabase
      .from("audit_logs")
      .select("action, created_at")
      .eq("organization_id", user.organizationId)
      .eq("actor_user_id", user.id)
      .gte("created_at", lookbackIso),
    supabase
      .from("notifications")
      .select("kind, created_at")
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.id)
      .is("read_at", null)
      .gte("created_at", lookbackIso),
  ]);

  const modules = (moduleRes.data ?? []) as ModuleRow[];
  const assignments = (assignmentRes.data ?? []) as AssignmentRow[];
  const attempts = (attemptRes.data ?? []) as AttemptRow[];
  const audits = (auditRes.data ?? []) as AuditSignalRow[];
  const notifications = (notificationRes.data ?? []) as NotificationSignalRow[];
  const assignmentByModule = new Map(assignments.map((item) => [item.module_id, item]));

  const failedAttempts = attempts.filter((attempt) => !attempt.passed).length;
  const overdueAssignments = assignments.filter((assignment) => assignment.status === "overdue").length;
  const dueSoonNotices = notifications.filter((item) => item.kind === "due_soon").length;
  const overdueNotices = notifications.filter((item) => item.kind === "overdue").length;
  const remedialEvents = audits.filter((item) => item.action === "remedial_training_assigned").length;

  const threatTemplates: Array<{
    id: string;
    title: string;
    regulation: Regulation;
    base: number;
    summary: string;
    scoreBoost: (value: {
      failedAttempts: number;
      overdueAssignments: number;
      dueSoonNotices: number;
      overdueNotices: number;
      remedialEvents: number;
    }) => number;
    signalFactory: (value: {
      failedAttempts: number;
      overdueAssignments: number;
      dueSoonNotices: number;
      overdueNotices: number;
      remedialEvents: number;
    }) => string[];
  }> = [
    {
      id: "identity-phishing",
      title: "Phishing and credential compromise",
      regulation: "HIPAA",
      base: 44,
      summary: "Current learning signals indicate elevated exposure to identity-targeted attacks.",
      scoreBoost: ({ failedAttempts, overdueAssignments }) => failedAttempts * 8 + overdueAssignments * 4,
      signalFactory: ({ failedAttempts, overdueAssignments }) => [
        `${failedAttempts} failed assessment attempts in the last ${threatLookbackDays} days`,
        `${overdueAssignments} overdue training assignments increasing exposure window`,
      ],
    },
    {
      id: "incident-response-lag",
      title: "Delayed incident response readiness",
      regulation: "HITECH",
      base: 40,
      summary: "Your current completion behavior suggests incident escalation readiness needs reinforcement.",
      scoreBoost: ({ dueSoonNotices, overdueNotices, remedialEvents }) =>
        dueSoonNotices * 5 + overdueNotices * 7 + remedialEvents * 8,
      signalFactory: ({ dueSoonNotices, overdueNotices, remedialEvents }) => [
        `${dueSoonNotices} due-soon reminders are still unresolved`,
        `${overdueNotices} overdue alerts indicate escalating compliance lag`,
        `${remedialEvents} remedial events triggered recently`,
      ],
    },
    {
      id: "access-governance-drift",
      title: "Access governance drift risk",
      regulation: "SOX",
      base: 34,
      summary: "Behavior trends suggest controls around least privilege may become inconsistent.",
      scoreBoost: ({ failedAttempts, overdueAssignments }) =>
        Math.round(failedAttempts * 5 + overdueAssignments * 6),
      signalFactory: ({ failedAttempts, overdueAssignments }) => [
        `${failedAttempts} low-retention signals from assessment performance`,
        `${overdueAssignments} pending control-focused modules`,
      ],
    },
    {
      id: "connected-device-exposure",
      title: "Connected medical device exposure",
      regulation: "FDA",
      base: 36,
      summary: "Training patterns show potential gaps in secure device handling and reporting controls.",
      scoreBoost: ({ failedAttempts, dueSoonNotices }) => failedAttempts * 6 + dueSoonNotices * 4,
      signalFactory: ({ failedAttempts, dueSoonNotices }) => [
        `${failedAttempts} recent assessment misses in compliance topics`,
        `${dueSoonNotices} upcoming deadlines for operational safety training`,
      ],
    },
  ];

  const nowIso = new Date().toISOString();

  const insights = threatTemplates
    .map((template) => {
      const severityScore = clamp(
        template.base
          + template.scoreBoost({
            failedAttempts,
            overdueAssignments,
            dueSoonNotices,
            overdueNotices,
            remedialEvents,
          }),
        0,
        100,
      );

      const severity: ThreatTrainingInsight["severity"] = severityScore >= 75
        ? "critical"
        : severityScore >= 55
          ? "high"
          : "medium";

      const moduleCandidate = modules
        .filter((module) => module.regulation === template.regulation)
        .filter((module) => canRoleAccessAudience(user.role, module.audience_role))
        .map((module) => ({
          module,
          assignment: assignmentByModule.get(module.id),
        }))
        .sort((a, b) => {
          const aScore = a.assignment?.status === "overdue"
            ? 5
            : a.assignment?.status === "assigned"
              ? 4
              : a.assignment?.status === "in_progress"
                ? 3
                : a.assignment?.status === "completed"
                  ? 1
                  : 6;
          const bScore = b.assignment?.status === "overdue"
            ? 5
            : b.assignment?.status === "assigned"
              ? 4
              : b.assignment?.status === "in_progress"
                ? 3
                : b.assignment?.status === "completed"
                  ? 1
                  : 6;
          return bScore - aScore;
        })[0];

      return {
        id: template.id,
        title: template.title,
        regulation: template.regulation,
        severity,
        severityScore,
        summary: template.summary,
        signals: template
          .signalFactory({
            failedAttempts,
            overdueAssignments,
            dueSoonNotices,
            overdueNotices,
            remedialEvents,
          })
          .filter((signal) => !signal.startsWith("0 ")),
        recommendedModuleId: moduleCandidate?.module.id ?? null,
        recommendedModuleTitle: moduleCandidate?.module.title ?? null,
        updatedAt: nowIso,
      } satisfies ThreatTrainingInsight;
    })
    .sort((a, b) => b.severityScore - a.severityScore)
    .slice(0, safeLimit);

  return insights;
}

export async function buildPredictiveAnalytics(
  supabase: SupabaseServerClient,
  organizationId: string,
  horizonDays = 30,
): Promise<PredictiveAnalyticsResult> {
  const safeHorizon = clamp(horizonDays, 7, 90);
  const now = Date.now();
  const horizonBoundary = new Date(now + safeHorizon * 86400000);
  const attemptsLookbackIso = new Date(now - 90 * 86400000).toISOString();

  const [profileRes, assignmentRes, attemptRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("module_assignments")
      .select("user_id, status, score, due_date, assigned_at, completed_at, training_modules(regulation)")
      .eq("organization_id", organizationId),
    supabase
      .from("assessment_attempts")
      .select("user_id, score, passed, completed_at")
      .eq("organization_id", organizationId)
      .gte("completed_at", attemptsLookbackIso),
  ]);

  const profiles = (profileRes.data ?? []) as ProfileRow[];
  const assignments = (assignmentRes.data ?? []) as OrgAssignmentRow[];
  const attempts = (attemptRes.data ?? []) as OrgAttemptRow[];

  const userRisks: PredictiveUserRisk[] = profiles.map((profile) => {
    const scopedAssignments = assignments.filter((item) => item.user_id === profile.id);
    const scopedAttempts = attempts.filter((item) => item.user_id === profile.id);

    const assigned = scopedAssignments.length;
    const completed = scopedAssignments.filter((item) => item.status === "completed").length;
    const overdue = scopedAssignments.filter((item) => item.status === "overdue").length;
    const dueSoon = scopedAssignments.filter((item) => {
      if (item.status === "completed" || !item.due_date) return false;
      const dueDate = new Date(item.due_date).getTime();
      return dueDate >= now && dueDate <= horizonBoundary.getTime();
    }).length;

    const completionPct = computeCompletionPct(completed, assigned);
    const scoreCandidates = [
      ...scopedAssignments
        .filter((item) => item.score !== null)
        .map((item) => Number(item.score)),
      ...scopedAttempts
        .filter((item) => item.score !== null)
        .map((item) => Number(item.score)),
    ];
    const avgScore = computeAverage(scoreCandidates);
    const recentFailures = scopedAttempts.filter((item) => !item.passed).length;

    const lastActivity = lastIsoTimestamp([
      ...scopedAssignments.map((item) => item.completed_at),
      ...scopedAssignments.map((item) => item.assigned_at),
      ...scopedAttempts.map((item) => item.completed_at),
    ]);

    const inactivityDays = lastActivity
      ? Math.floor((now - new Date(lastActivity).getTime()) / 86400000)
      : null;

    const rawRisk = 15
      + overdue * 18
      + dueSoon * 7
      + recentFailures * 11
      + Math.max(0, 70 - completionPct) * 0.45
      + Math.max(0, 80 - (avgScore ?? 70)) * 0.55
      + Math.max(0, (inactivityDays ?? 0) - 14) * 1.4;

    const riskScore = clamp(Math.round(rawRisk), 0, 100);

    return {
      userId: profile.id,
      fullName: profile.full_name ?? "Unknown User",
      email: profile.email ?? null,
      role: profile.role,
      assigned,
      completed,
      overdue,
      dueSoon,
      avgScore,
      completionPct,
      inactivityDays,
      riskScore,
      riskTier: toRiskTier(riskScore),
    };
  });

  const regulationRisks: PredictiveRegulationRisk[] = REGULATIONS.map((regulation) => {
    const scopedAssignments = assignments.filter(
      (item) => item.training_modules?.[0]?.regulation === regulation,
    );
    const assigned = scopedAssignments.length;
    const completed = scopedAssignments.filter((item) => item.status === "completed").length;
    const overdue = scopedAssignments.filter((item) => item.status === "overdue").length;
    const avgScore = computeAverage(
      scopedAssignments
        .filter((item) => item.score !== null)
        .map((item) => Number(item.score)),
    );
    const completionPct = computeCompletionPct(completed, assigned);
    const riskScore = clamp(
      Math.round(
        25
          + overdue * 8
          + Math.max(0, 75 - completionPct) * 0.7
          + Math.max(0, 80 - (avgScore ?? 72)) * 0.6,
      ),
      0,
      100,
    );

    return {
      regulation,
      assigned,
      completionPct,
      avgScore,
      overdue,
      riskScore,
    };
  });

  userRisks.sort((a, b) => b.riskScore - a.riskScore);
  regulationRisks.sort((a, b) => b.riskScore - a.riskScore);

  const organizationRiskScore = userRisks.length > 0
    ? Math.round(userRisks.reduce((sum, row) => sum + row.riskScore, 0) / userRisks.length)
    : 0;
  const atRiskUsers = userRisks.filter((row) => row.riskTier === "high" || row.riskTier === "critical").length;
  const criticalUsers = userRisks.filter((row) => row.riskTier === "critical").length;
  const basePredictedOverdue = userRisks.reduce((sum, row) => sum + row.dueSoon, 0);
  const predictedOverdueCount = Math.round(basePredictedOverdue + criticalUsers * 0.5 + atRiskUsers * 0.2);

  const interventions: string[] = [];
  if (criticalUsers > 0) {
    interventions.push(`Initiate focused intervention plans for ${criticalUsers} critical-risk users in the next 7 days.`);
  }
  if (predictedOverdueCount > 0) {
    interventions.push(`Auto-prioritize ${predictedOverdueCount} assignments forecasted to become overdue within ${safeHorizon} days.`);
  }
  const highestRiskRegulation = regulationRisks[0];
  if (highestRiskRegulation) {
    interventions.push(
      `Increase targeted reinforcement for ${highestRiskRegulation.regulation} modules where risk score is ${highestRiskRegulation.riskScore}.`,
    );
  }
  if (interventions.length === 0) {
    interventions.push("Current trend is stable. Maintain weekly monitoring and continue proactive assignments.");
  }

  return {
    generatedAt: new Date().toISOString(),
    horizonDays: safeHorizon,
    organizationRiskScore,
    predictedOverdueCount,
    atRiskUsers,
    criticalUsers,
    interventions,
    userRisks,
    regulationRisks,
  };
}
