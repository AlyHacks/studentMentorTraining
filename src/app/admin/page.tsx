import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserProgressSummary } from "@/lib/progress";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const rows = await Promise.all(
    users.map(async (user) => {
      const summary = await getUserProgressSummary(user.id);
      const certificate = await prisma.certificate.findFirst({ where: { userId: user.id } });
      return { user, summary, certificate };
    })
  );

  const componentNames = rows[0]?.summary.components.map((c) => c.name) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">All Students</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Progress across every registered account. Click a row for the full task breakdown.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Role</th>
              {componentNames.map((name) => (
                <th key={name} className="px-4 py-3 font-medium">
                  {name}
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Certificate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950">
            {rows.map(({ user, summary, certificate }) => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                <td className="px-4 py-3">
                  <Link href={`/admin/${user.id}`} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    {user.name}
                  </Link>
                  <div className="text-xs text-slate-400">{user.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{user.role}</td>
                {summary.components.map((c) => (
                  <td key={c.id} className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">
                    {c.percent.toFixed(0)}%
                  </td>
                ))}
                <td className="px-4 py-3 font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                  {summary.totalPercent.toFixed(0)}%
                </td>
                <td className="px-4 py-3">
                  {certificate ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Issued
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
