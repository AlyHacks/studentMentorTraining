"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ResourceItem = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  componentKey: string | null;
};

type ComponentOption = { key: string; name: string };

export function ResourcesClient({
  resources,
  components,
  isAdmin,
}: {
  resources: ResourceItem[];
  components: ComponentOption[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [componentKey, setComponentKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url, description, componentKey: componentKey || undefined }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not add resource.");
      return;
    }
    setTitle("");
    setUrl("");
    setDescription("");
    setComponentKey("");
    router.refresh();
  };

  const remove = async (id: string) => {
    await fetch(`/api/resources/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const grouped = new Map<string, ResourceItem[]>();
  grouped.set("general", []);
  for (const c of components) grouped.set(c.key, []);
  for (const r of resources) {
    const key = r.componentKey && grouped.has(r.componentKey) ? r.componentKey : "general";
    grouped.get(key)!.push(r);
  }

  const sections: { key: string; name: string; items: ResourceItem[] }[] = [
    ...components.map((c) => ({ key: c.key, name: c.name, items: grouped.get(c.key) ?? [] })),
    { key: "general", name: "General", items: grouped.get("general") ?? [] },
  ].filter((s) => s.items.length > 0 || isAdmin);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Resources</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Everything you need across programming, CAD, presentation skills, onboarding, and scenario quests.
      </p>

      {isAdmin && (
        <form
          onSubmit={submit}
          className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Add a resource</h2>
          <input
            required
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <input
            required
            type="url"
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <textarea
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <select
            value={componentKey}
            onChange={(e) => setComponentKey(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="">General (no specific component)</option>
            {components.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {submitting ? "Adding…" : "Add resource"}
          </button>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.key}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {section.name}
            </h2>
            {section.items.length === 0 ? (
              <p className="text-sm text-slate-400">No resources yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {section.items.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {r.title}
                      </a>
                      {r.description && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{r.description}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => remove(r.id)}
                        className="shrink-0 text-xs text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
