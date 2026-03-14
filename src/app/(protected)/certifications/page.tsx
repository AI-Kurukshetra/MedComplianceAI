import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { daysUntil } from "@/lib/utils/date";
import { CertificationsView } from "@/components/certifications/certifications-view";

type CertificationRow = {
  id: string;
  certificate_no: string;
  issued_at: string;
  expires_at: string;
  training_modules: { title: string; regulation: string }[] | null;
};

type CompletedAssignmentRow = {
  completed_at: string | null;
  training_modules: { title: string; regulation: string; estimated_minutes: number }[] | null;
};

function titleOf(cert: CertificationRow): string {
  return cert.training_modules?.[0]?.title ?? "Compliance Certification";
}

export default async function CertificationsPage() {
  const user = await requireUserContext();
  const supabase = await createClient();

  const [{ data: certificationsData }, { data: completedAssignmentsData }] = await Promise.all([
    supabase
      .from("certifications")
      .select("id, certificate_no, issued_at, expires_at, training_modules(title, regulation)")
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.userId)
      .order("issued_at", { ascending: false })
      .limit(50),
    supabase
      .from("module_assignments")
      .select("completed_at, training_modules(title, regulation, estimated_minutes)")
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.userId)
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(50),
  ]);

  const certifications = (certificationsData ?? []) as unknown as CertificationRow[];
  const completedAssignments = (completedAssignmentsData ?? []) as unknown as CompletedAssignmentRow[];
  const expiringSoon = certifications.filter((cert) => {
    const remaining = daysUntil(cert.expires_at);
    return remaining !== null && remaining <= 45;
  }).length;
  const totalMinutes = completedAssignments.reduce((total, row) => {
    return total + (row.training_modules?.[0]?.estimated_minutes ?? 0);
  }, 0);
  const earnedBadges = Math.max(certifications.length, completedAssignments.length);
  const verifiedSkills = completedAssignments.length * 2;
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const timeline = [
    ...certifications.map((cert) => ({
      at: cert.issued_at,
      title: `Certificate issued: ${titleOf(cert)}`,
      detail: cert.training_modules?.[0]?.regulation ?? "Compliance",
      kind: "certificate" as const,
    })),
    ...completedAssignments.map((assignment) => ({
      at: assignment.completed_at ?? "",
      title: `Training completed: ${assignment.training_modules?.[0]?.title ?? "Training module"}`,
      detail: assignment.training_modules?.[0]?.regulation ?? "Compliance",
      kind: "training" as const,
    })),
  ]
    .filter((item) => Boolean(item.at))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 7);

  return (
    <CertificationsView
      certifications={certifications.map((cert) => ({
        id: cert.id,
        certificateNo: cert.certificate_no,
        title: titleOf(cert),
        issuedAt: cert.issued_at,
        expiresAt: cert.expires_at,
      }))}
      timeline={timeline}
      expiringSoon={expiringSoon}
      earnedBadges={earnedBadges}
      verifiedSkills={verifiedSkills}
      totalHours={totalHours}
      userName={user.fullName || user.email || "User"}
    />
  );
}
