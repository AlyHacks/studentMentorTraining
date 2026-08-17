export function ProgressBar({
  percent,
  label,
  sublabel,
  size = "md",
}: {
  percent: number;
  label: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg";
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const barHeight = size === "lg" ? "h-4" : size === "sm" ? "h-2" : "h-3";
  const color =
    clamped >= 100
      ? "bg-emerald-500"
      : clamped >= 50
      ? "bg-indigo-500"
      : "bg-amber-500";

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span
          className={`font-medium text-slate-800 dark:text-slate-100 ${
            size === "lg" ? "text-base" : "text-sm"
          }`}
        >
          {label}
        </span>
        <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
          {clamped.toFixed(0)}%
        </span>
      </div>
      <div
        className={`w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 ${barHeight}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${barHeight} rounded-full ${color} transition-[width] duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {sublabel && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sublabel}</p>
      )}
    </div>
  );
}
