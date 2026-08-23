import { Flame, IndianRupee, Leaf, ShoppingCart, Sparkles } from "lucide-react";

export function Tag({ children, tone = "turmeric" }: { children: React.ReactNode; tone?: "turmeric" | "maroon" | "curry" | "stone" }) {
  const dot = { turmeric: "bg-amber-500", maroon: "bg-red-900", curry: "bg-emerald-800", stone: "bg-stone-400" }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-700">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

export function SpiceFlames({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4].map((n) => (
        <Flame key={n} size={13} className={n <= level ? "text-red-600 fill-red-600" : "text-stone-300 fill-stone-200"} />
      ))}
    </span>
  );
}

export function VendorIcon({ type }: { type: string }) {
  const cls = "h-4 w-4";
  if (type === "kirana") return <ShoppingCart className={cls} />;
  if (type === "sabziwala") return <Leaf className={cls} />;
  if (type === "dairy") return <IndianRupee className={cls} />;
  return <Sparkles className={cls} />;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400 font-mono">{children}</p>;
}

export function NutrientBar({
  label,
  value,
  target,
  unit,
  tone = "amber",
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  tone?: "amber" | "red" | "emerald" | "purple";
}) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const barTone = { amber: "bg-amber-500", red: "bg-red-800", emerald: "bg-emerald-700", purple: "bg-purple-700" }[tone];
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-stone-600">
        <span>{label}</span>
        <span className="font-mono">
          {Math.round(value)}
          {unit} / {Math.round(target)}
          {unit}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${barTone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function LoadingScreen({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-2 text-stone-400">
      <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-xs">{label}</p>
    </div>
  );
}
