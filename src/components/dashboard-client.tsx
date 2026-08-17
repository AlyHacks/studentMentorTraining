"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/components/progress-bar";
import { QuizModal } from "@/components/components/quiz-modal";
import type { UserProgressSummary } from "@/lib/progress";

export function DashboardClient({
  summary,
  hasCertificate,
}: {
  summary: UserProgressSummary;
  hasCertificate: boolean;
}) {
  const router = useRouter();
  const [pendingTask, setPendingTask] = useState<string | null>(null);
  const [quizTask, setQuizTask] = useState<{ id: string; title: string } | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const components = useMemo(() => {
    const withOverrides = summary.components.map((component) => {
      const tasks = component.tasks.map((task) => ({
        ...task,
        completed: overrides[task.id] ?? task.completed,
      }));
      const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
      const earnedPoints = tasks.reduce((sum, t) => sum + (t.completed ? t.points : 0), 0);
      const percent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 1000) / 10 : 0;
      return { ...component, tasks, totalPoints, earnedPoints, percent };
    });
    const weightSum = withOverrides.reduce((sum, c) => sum + c.weight, 0);
    const totalPercent =
      weightSum > 0
        ? Math.round(
            (withOverrides.reduce((sum, c) => sum + c.percent * c.weight, 0) / weightSum) * 10
          ) / 10
        : 0;
    return { components: withOverrides, totalPercent, isComplete: totalPercent >= 100 };
  }, [summary, overrides]);

  const toggleTask = async (taskId: string, completed: boolean) => {
    setPendingTask(taskId);
    setTaskError(null);
    setOverrides((o) => ({ ...o, [taskId]: completed }));

    const res = await fetch("/api/progress/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, completed }),
    });
    setPendingTask(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setTaskError(data.error ?? "Could not update task.");
      setOverrides((o) => {
        const next = { ...o };
        delete next[taskId];
        return next;
      });
      return;
    }
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">My Progress</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Check off tasks as you complete them. Quiz-graded tasks are marked automatically.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <ProgressBar percent={components.totalPercent} label="Total completion" size="lg" />
      </div>

      {components.isComplete && (
        <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-emerald-800 dark:text-emerald-200">
              🎉 You&apos;ve completed 100% of the curriculum!
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              {hasCertificate
                ? "Your certificate has already been generated — download it again anytime."
                : "Download your certificate below. If email is configured, a copy will also be sent to your inbox."}
            </p>
          </div>
          <a
            href="/api/certificate"
            className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            Download certificate
          </a>
        </div>
      )}

      {taskError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {taskError}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-6">
        {components.components.map((component) => (
          <div
            key={component.id}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <ProgressBar
              percent={component.percent}
              label={component.name}
              sublabel={`${component.earnedPoints} / ${component.totalPoints} tasks complete`}
            />

            <ul className="mt-4 flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {component.tasks.map((task) => (
                <li key={task.id} className="flex items-start gap-3 py-3">
                  {task.hasQuiz ? (
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                        task.completed
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 text-transparent dark:border-slate-600"
                      }`}
                    >
                      ✓
                    </span>
                  ) : (
                    <input
                      type="checkbox"
                      checked={task.completed}
                      disabled={pendingTask === task.id}
                      onChange={(e) => toggleTask(task.id, e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-indigo-600"
                    />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        task.completed
                          ? "text-slate-400 line-through dark:text-slate-500"
                          : "text-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{task.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {task.hasQuiz && (
                        <button
                          onClick={() => setQuizTask({ id: task.id, title: task.title })}
                          className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
                        >
                          {task.completed ? "Retake quiz" : "Take quiz"}
                        </button>
                      )}
                      {task.source === "auto" && task.score !== null && (
                        <span className="text-xs text-slate-400">
                          Auto-graded: {Math.round(task.score * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {quizTask && (
        <QuizModal
          taskId={quizTask.id}
          taskTitle={quizTask.title}
          onGraded={() => router.refresh()}
          onClose={() => setQuizTask(null)}
        />
      )}
    </div>
  );
}
