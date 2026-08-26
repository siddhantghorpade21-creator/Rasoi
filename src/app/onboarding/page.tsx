"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DIET_OPTIONS, REGION_OPTIONS } from "@/lib/constants";
import type { DietPreference } from "@/lib/database.types";

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [diet, setDiet] = useState<DietPreference | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [other, setOther] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("onboarding_completed").eq("id", user.id).single();
      if (profile?.onboarding_completed) {
        router.replace("/discover");
        return;
      }
      setLoading(false);
    })();
  }, [supabase, router]);

  const toggleRegion = (r: string) => {
    setRegions((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));
  };

  const finish = async () => {
    if (!diet) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({
        diet_preference: diet,
        region_preferences: regions,
        region_preference_other: other.trim() || null,
        onboarding_completed: true,
      })
      .eq("id", user.id);
    router.replace("/discover");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-100">
        <Loader2 className="animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] rounded-[2.5rem] border-8 border-stone-900 bg-amber-50 shadow-2xl overflow-hidden font-sans">
        <div className="flex min-h-[720px] flex-col gap-6 px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-900">
              <ChefHat size={18} className="text-amber-50" />
            </div>
            <div>
              <h1 className="text-xl text-stone-900 font-serif font-semibold">A couple of quick things</h1>
              <p className="text-xs text-stone-500">Helps us suggest dishes you'll actually cook.</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400 font-mono">Dietary preference</p>
            <div className="flex flex-col gap-2">
              {DIET_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDiet(opt.id)}
                  className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left ${
                    diet === opt.id ? "border-red-900 bg-red-900 text-amber-50" : "border-stone-200 bg-white text-stone-800"
                  }`}
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className={`text-xs ${diet === opt.id ? "text-amber-100" : "text-stone-400"}`}>{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400 font-mono">
              Regional preference <span className="normal-case font-normal text-stone-400">(optional, pick any)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {REGION_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => toggleRegion(r)}
                  className={`rounded-full px-3 py-1.5 text-sm border ${
                    regions.includes(r) ? "bg-stone-900 text-amber-50 border-stone-900" : "bg-white text-stone-600 border-stone-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              value={other}
              onChange={(e) => setOther(e.target.value)}
              placeholder="Something else? Type it in (e.g. Bengali, Kashmiri)"
              className="mt-2 w-full rounded-full border border-stone-300 bg-white px-4 py-2 text-sm outline-none focus:border-amber-600 placeholder:text-stone-400"
            />
          </div>

          <p className="text-xs text-stone-400">You can change either of these anytime from Profile.</p>

          <div className="mt-auto">
            <button
              onClick={finish}
              disabled={!diet || saving}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-medium text-amber-50 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Continue to Rasoi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
