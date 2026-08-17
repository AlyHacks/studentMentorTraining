import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserProgressSummary } from "@/lib/progress";
import { ProgressBar } from "@/components/progress-bar";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { userId } = await params;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) notFound();

  const [summary, certificate] = await Promise.all([
    getUserProgressSummary(user.id),
    prisma.certificate.findFirst({ where: { userId: user.id } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/admin" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
        ← All students
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{user.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {user.email} · {user.role} · joined{" "}
            {user.createdAt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
        {certificate && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Certificate issued {certificate.issuedAt.toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <ProgressBar percent={summary.totalPercent} label="Total completion" size="lg" />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {summary.components.map((component) => (
          <div
            key={component.id}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <ProgressBar
              percent={component.percent}
              label={component.name}
              sublabel={`${component.earnedPoints} / ${component.totalPoints} tasks complete`}
            />
            <ul className="mt-4 flex flex-col divide-y divide-slate-100 text-sm dark:divide-slate-800">
              {component.tasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 py-2">
                  <span
                    className={
                      task.completed
                        ? "text-slate-500 line-through dark:text-slate-500"
                        : "text-slate-700 dark:text-slate-200"
                    }
                  >
                    {task.title}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {task.completed
                      ? task.source === "auto"
                        ? `Auto-graded (${Math.round((task.score ?? 0) * 100)}%)`
                        : "Completed"
                      : "Incomplete"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
