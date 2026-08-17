"use client";

import { useEffect, useState } from "react";

type Question = { id: string; prompt: string; choices: string[] };

export function QuizModal({
  taskId,
  taskTitle,
  onClose,
  onGraded,
}: {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
  onGraded: (result: { passed: boolean; score: number }) => void;
}) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [passingScore, setPassingScore] = useState(0.8);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    passed: boolean;
    score: number;
    correctCount: number;
    totalQuestions: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/progress/quiz/${taskId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setQuestions(data.questions);
          setPassingScore(data.passingScore);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load quiz.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const submit = async () => {
    if (!questions) return;
    setSubmitting(true);
    setError(null);
    const orderedAnswers = questions.map((q) => answers[q.id] ?? -1);
    const res = await fetch(`/api/progress/quiz/${taskId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: orderedAnswers }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setResult(data);
    onGraded({ passed: data.passed, score: data.score });
  };

  const allAnswered = questions ? questions.every((q) => answers[q.id] !== undefined) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{taskTitle}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading quiz…</p>}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {!loading && questions && !result && (
          <div className="flex flex-col gap-5">
            {questions.map((q, i) => (
              <fieldset key={q.id}>
                <legend className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                  {i + 1}. {q.prompt}
                </legend>
                <div className="flex flex-col gap-1.5">
                  {q.choices.map((choice, ci) => (
                    <label
                      key={ci}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 has-checked:border-indigo-400 has-checked:bg-indigo-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:has-checked:border-indigo-500 dark:has-checked:bg-indigo-950"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === ci}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: ci }))}
                        className="accent-indigo-600"
                      />
                      {choice}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <button
              disabled={!allAnswered || submitting}
              onClick={submit}
              className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? "Grading…" : "Submit answers"}
            </button>
            <p className="text-xs text-slate-400">
              Passing score: {Math.round(passingScore * 100)}%. This task is graded automatically.
            </p>
          </div>
        )}

        {result && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
                result.passed
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
              }`}
            >
              {result.passed ? "✓" : "!"}
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {result.passed ? "Task complete!" : "Not quite there yet"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You scored {result.correctCount} / {result.totalQuestions} (
              {Math.round(result.score * 100)}%).
            </p>
            <div className="mt-2 flex gap-2">
              {!result.passed && (
                <button
                  onClick={() => {
                    setResult(null);
                    setAnswers({});
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Try again
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
