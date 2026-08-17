"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UpdateItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: { name: string };
};

export function UpdatesClient({
  updates,
  isAdmin,
}: {
  updates: UpdateItem[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not post update.");
      return;
    }
    setTitle("");
    setBody("");
    router.refresh();
  };

  const remove = async (id: string) => {
    await fetch(`/api/updates/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Updates</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Announcements and changes from the program team.
      </p>

      {isAdmin && (
        <form
          onSubmit={submit}
          className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Post a new update</h2>
          <input
            required
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <textarea
            required
            placeholder="What's new?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post update"}
          </button>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {updates.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No updates yet — check back soon.</p>
        )}
        {updates.map((update) => (
          <div
            key={update.id}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50">{update.title}</h3>
              {isAdmin && (
                <button
                  onClick={() => remove(update.id)}
                  className="text-xs text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
              {update.body}
            </p>
            <p className="mt-3 text-xs text-slate-400">
              {update.author.name} ·{" "}
              {new Date(update.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
