import type { CSSProperties } from "react";
import Link from "next/link";

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  assignmentCount: number;
  completionRate: number;
};

export function UserTable({ users }: { users: UserRow[] }) {
  if (users.length === 0) {
    return (
      <div className="surface-card p-5">
        <p className="text-sm text-slate-600">No users found for this organization.</p>
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="responsive-table">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Staff Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Assignments</th>
              <th className="px-4 py-3">Completion</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{user.fullName}</p>
                  <p className="text-xs text-slate-500 break-all">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{user.assignmentCount}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="progress-width h-full bg-primary"
                        style={{ "--progress-width": `${user.completionRate}%` } as CSSProperties}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{user.completionRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/users/${user.id}`} className="btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
