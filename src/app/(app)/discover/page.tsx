"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ChefHat, Clock, Heart, IndianRupee, Info, Mic, Pizza, Search, Sparkles, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CHEAT_ITEMS, CHEAT_PRIORITIES } from "@/lib/constants";
import { computeHouseholdFit } from "@/lib/householdFit";
import { Tag, SpiceFlames, LoadingScreen } from "@/components/ui";
import type { Database } from "@/lib/database.types";

type Recipe = Database["public"]["Tables"]["recipes"]["Row"];
type Member = Database["public"]["Tables"]["household_members"]["Row"];

export default function DiscoverScreen() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [idx, setIdx] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [cheatMode, setCheatMode] = useState(false);
  const [cheatPriority, setCheatPriority] = useState<"protein" | "light" | "balance" | "enjoy">("balance");
  const [cheatSaved, setCheatSaved] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: allRecipes }, { data: swipes }, { data: memberRows }] = await Promise.all([
        supabase.from("recipes").select("*").eq("source", "discover").order("created_at"),
        supabase.from("discover_swipes").select("recipe_id").eq("user_id", user.id),
        supabase.from("household_members").select("*").eq("user_id", user.id),
      ]);

      const swiped = new Set((swipes ?? []).map((s) => s.recipe_id));
      const remaining = (allRecipes ?? []).filter((r) => !swiped.has(r.id));
      setRecipes(remaining);
      setSavedCount((swipes ?? []).filter((s: any) => s.action === "save").length);
      setMembers(memberRows ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  const dish = recipes[idx];
  const fit = useMemo(() => (dish ? computeHouseholdFit(dish, members) : null), [dish, members]);

  const swipe = async (action: "skip" | "save") => {
    if (!userId || !dish) return;
    setIdx((i) => i + 1);
    if (action === "save") setSavedCount((c) => c + 1);
    await supabase.from("discover_swipes").insert({ user_id: userId, recipe_id: dish.id, action });
  };

  const saveCheatItem = async (name: string) => {
    if (!userId) return;
    setCheatSaved((c) => [...c, name]);
    await supabase.from("cheat_log").insert({ user_id: userId, item_name: name, priority: cheatPriority });
  };

  if (loading) return <LoadingScreen label="Finding today's picks..." />;

  const done = idx >= recipes.length;

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-stone-900 font-serif font-semibold">Discover</h1>
        <button
          onClick={() => setCheatMode(!cheatMode)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${cheatMode ? "bg-red-900 text-amber-50" : "border border-stone-200 bg-white text-stone-600"}`}
        >
          <Pizza size={14} /> Cheat day
        </button>
      </div>

      {!cheatMode ? (
        <>
          <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2">
            <Search size={16} className="text-stone-400" />
            <input placeholder="Search by dish, region, or ingredient" className="flex-1 text-sm outline-none placeholder:text-stone-400" />
            <Mic size={16} className="text-red-900" />
          </div>

          {!done ? (
            <>
              <p className="text-xs text-stone-400 font-mono">
                {idx + 1} of {recipes.length}
              </p>
              <div className="rounded-3xl border border-stone-200 bg-white overflow-hidden">
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-amber-400 to-red-800">
                  <ChefHat size={44} className="text-amber-50 opacity-90" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      {dish.region} · {dish.diet}
                    </p>
                    <SpiceFlames level={dish.spice_level ?? 1} />
                  </div>
                  <h2 className="mt-1 text-xl text-stone-900 font-serif font-semibold">{dish.name}</h2>
                  <div className="mt-2 flex items-center gap-4 text-sm text-stone-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {dish.time_minutes} min
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <IndianRupee size={13} />
                      {dish.cost_estimate}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {dish.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                  {fit && (fit.goodFor.length > 0 || fit.cautions.length > 0) && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-stone-600">
                      <Users size={14} className="mt-0.5 shrink-0 text-stone-500" />
                      <div>
                        {fit.goodFor.length > 0 && (
                          <p>
                            <span className="font-medium text-stone-800">Good for:</span> {fit.goodFor.join(", ")}
                          </p>
                        )}
                        {fit.cautions.map((c) => (
                          <p key={c} className="mt-1 flex items-start gap-1 text-red-800">
                            <AlertCircle size={12} className="mt-0.5 shrink-0" /> {c}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex gap-3">
                    <button onClick={() => swipe("skip")} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-stone-300 py-2.5 text-stone-600">
                      <X size={18} /> Skip
                    </button>
                    <button onClick={() => swipe("save")} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-900 py-2.5 text-amber-50">
                      <Heart size={18} /> Save
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-stone-300 py-14 text-center">
              <Sparkles className="text-amber-600" />
              <p className="text-sm font-medium text-stone-700">You've been through today's picks.</p>
              <p className="text-xs text-stone-400">Saved {savedCount} · check back tomorrow for more</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400 font-mono">Today, prioritize</p>
            <div className="flex flex-wrap gap-2">
              {CHEAT_PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setCheatPriority(p.id)}
                  className={`rounded-full px-3 py-1.5 text-xs border ${cheatPriority === p.id ? "bg-stone-900 text-amber-50 border-stone-900" : "bg-white text-stone-600 border-stone-200"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {CHEAT_ITEMS.map((item) => (
              <div key={item.name} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base text-stone-900 font-serif font-semibold">{item.name}</h3>
                  <span className="text-xs text-stone-500 font-mono">{item.calories} kcal</span>
                </div>
                <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-stone-700">
                  <Info size={13} className="mt-0.5 shrink-0 text-amber-700" />
                  {item.tips[cheatPriority]}
                </div>
                <button
                  onClick={() => saveCheatItem(item.name)}
                  disabled={cheatSaved.includes(item.name)}
                  className="mt-3 flex items-center gap-1 text-sm font-medium text-red-900 disabled:opacity-50"
                >
                  <Heart size={15} /> {cheatSaved.includes(item.name) ? "Saved" : "Save for this weekend"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
