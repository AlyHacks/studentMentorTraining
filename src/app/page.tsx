import Link from "next/link";
import { auth } from "@/lib/auth";

const COMPONENTS = [
  { name: "Programming", emoji: "💻" },
  { name: "CAD", emoji: "📐" },
  { name: "Presentational Skills", emoji: "🎤" },
  { name: "Onboarding Program", emoji: "🧭" },
  { name: "Scenario Quest", emoji: "🗺️" },
];

export default async function Home() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
          Curriculum Completion Tracker
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Track your progress across the full navigation-device curriculum, view team updates, access
          resources, and earn your certificate of completion.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href={session ? "/dashboard" : "/register"}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500"
          >
            {session ? "Go to my dashboard" : "Get started"}
          </Link>
          {!session && (
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {COMPONENTS.map((c) => (
          <div
            key={c.name}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="text-2xl">{c.emoji}</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
