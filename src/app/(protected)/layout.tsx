import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUserContext();
  const supabase = await createClient();

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.userId)
    .is("read_at", null);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0">
      <div className="flex min-h-screen">
        <Sidebar role={user.role} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} unreadCount={unreadCount ?? 0} />
          <main className="w-full flex-1 overflow-x-hidden px-3 py-4 sm:px-4 md:px-6 md:py-6">
            <div className="mx-auto w-full max-w-[1800px]">{children}</div>
          </main>
        </div>
      </div>

      <MobileNav role={user.role} />
    </div>
  );
}
