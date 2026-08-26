"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, ChefHat, Clock, IndianRupee, Info, Mic, Pizza, Search, Sparkles, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CHEAT_ITEMS, CHEAT_PRIORITIES, dietAllowed } from "@/lib/constants";
import { computeHouseholdFit } from "@/lib/householdFit";
import { todayISO } from "@/lib/date";
import { Tag, SpiceFlames, LoadingScreen } from "@/components/ui";
import type { Database, DietPreference } from "@/lib/database.types";

type Recipe = Database["public"]["Tables"]["recipes"]["Row"];
type Member = Database["public"]["Tables"]["household_members"]["Row"];
type MealSlot = "breakfast" | "lunch" | "dinner";
const SLOTS: { id: MealSlot; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
];

function recipeMatches(recipe: Recipe, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const haystack = [
    recipe.name,
    recipe.region ?? "",
    recipe.diet ?? "",
    ...(recipe.tags ?? []),
    ...(recipe.ingredients ?? []).map((i) => i.name),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function regionScore(recipe: Recipe, regionPrefs: string[]): number {
  if (regionPrefs.length === 0) return 0;
  return recipe.tags.some((t) => regionPrefs.includes(t)) ? 1 : 0;
}

function SlotButtons({
  recipeId,
  filledSlots,
  onAdd,
}: {
  recipeId: string;
  filledSlots: Partial<Record<MealSlot, string>>;
  onAdd: (slot: MealSlot) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {SLOTS.map((s) => {
        const isThisDish = filledSlots[s.id] === recipeId;
        return (
          <button
            key={s.id}
            onClick={() => onAdd(s.id)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11px] font-medium ${
              isThisDish ? "bg-emerald-700 text-white" : "bg-stone-900 text-amber-50"
            }`}
          >
            {isThisDish && <Check size={11} />}
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

export default function DiscoverScreen() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [dietPref, setDietPref] = useState<DietPreference | null>(null);
  const [regionPrefs, setRegionPrefs] = useState<string[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [swipedMap, setSwipedMap] = useState<Record<string, "skip" | "save">>({});
  const [filledSlots, setFilledSlots] = useState<Partial<Record<MealSlot, string>>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [idx, setIdx] = useState(0);
  const [query, setQuery] = useState("");
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

      const [{ data: profile }, { data: recipeRows }, { data: swipes }, { data: memberRows }, { data: planRows }] = await Promise.all([
        supabase.from("profiles").select("diet_preference, region_preferences").eq("id", user.id).single(),
        supabase.from("recipes").select("*").eq("source", "discover").order("created_at"),
        supabase.from("discover_swipes").select("recipe_id, action").eq("user_id", user.id),
        supabase.from("household_members").select("*").eq("user_id", user.id),
        supabase.from("meal_plans").select("meal_slot, recipe_id").eq("user_id", user.id).eq("plan_date", todayISO()),
      ]);

      const map: Record<string, "skip" | "save"> = {};
      (swipes ?? []).forEach((s: any) => {
        map[s.recipe_id] = s.action;
      });
      const slots: Partial<Record<MealSlot, string>> = {};
      (planRows ?? []).forEach((p: any) => {
        slots[p.meal_slot as MealSlot] = p.recipe_id;
      });

      setDietPref((profile?.diet_preference as DietPreference | null) ?? null);
      setRegionPrefs(profile?.region_preferences ?? []);
      setAllRecipes(recipeRows ?? []);
      setSwipedMap(map);
      setFilledSlots(slots);
      setMembers(memberRows ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  const eligible = useMemo(
    () => allRecipes.filter((r) => dietAllowed(r.diet, dietPref)).sort((a, b) => regionScore(b, regionPrefs) - regionScore(a, regionPrefs)),
    [allRecipes, dietPref, regionPrefs]
  );
  const deck = useMemo(() => eligible.filter((r) => !swipedMap[r.id]), [eligible, swipedMap]);
  const searchResults = useMemo(() => (query.trim() ? eligible.filter((r) => recipeMatches(r, query)) : []), [eligible, query]);

  const dish = deck[idx];
  const fit = useMemo(() => (dish ? computeHouseholdFit(dish, members) : null), [dish, members]);

  const addToSlot = async (recipeId: string, slot: MealSlot) => {
    if (!userId) return;
    setFilledSlots((m) => ({ ...m, [slot]: recipeId }));
    setSwipedMap((m) => ({ ...m, [recipeId]: "save" }));
    await Promise.all([
      supabase
        .from("meal_plans")
        .upsert({ user_id: userId, plan_date: todayISO(), meal_slot: slot, recipe_id: recipeId }, { onConflict: "user_id,plan_date,meal_slot" }),
      supabase.from("discover_swipes").upsert({ user_id: userId, recipe_id: recipeId, action: "save" }, { onConflict: "user_id,recipe_id" }),
    ]);
    if (dish?.id === recipeId) setIdx((i) => i + 1);
  };

  const skip = async () => {
    if (!userId || !dish) return;
    setSwipedMap((m) => ({ ...m, [dish.id]: "skip" }));
    setIdx((i) => i + 1);
    await supabase.from("discover_swipes").upsert({ user_id: userId, recipe_id: dish.id, action: "skip" }, { onConflict: "user_id,recipe_id" });
  };

  const saveCheatItem = async (name: string) => {
    if (!userId) return;
    setCheatSaved((c) => [...c, name]);
    await supabase.from("cheat_log").insert({ user_id: userId, item_name: name, priority: cheatPriority });
  };

  if (loading) return <LoadingScreen label="Finding today's picks..." />;

  const done = idx >= deck.length;

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
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by dish, region, or ingredient"
              className="flex-1 text-sm outline-none placeholder:text-stone-400"
            />
            {query ? (
              <button onClick={() => setQuery("")} className="text-stone-400">
                <X size={16} />
              </button>
            ) : (
              <Mic size={16} className="text-red-900" />
            )}
          </div>

          {query.trim() ? (
            searchResults.length > 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-stone-400 font-mono">
                  {searchResults.length} match{searchResults.length !== 1 ? "es" : ""} for "{query.trim()}"
                </p>
                {searchResults.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        {r.region} · {r.diet}
                      </p>
                      <SpiceFlames level={r.spice_level ?? 1} />
                    </div>
                    <h3 className="mt-1 text-lg text-stone-900 font-serif font-semibold">{r.name}</h3>
                    <div className="mt-1 flex items-center gap-4 text-sm text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {r.time_minutes} min
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <IndianRupee size={12} />
                        {r.cost_estimate}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.tags.map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>
                    <div className="mt-3">
                      <SlotButtons recipeId={r.id} filledSlots={filledSlots} onAdd={(slot) => addToSlot(r.id, slot)} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-stone-300 py-14 text-center">
                <Search className="text-stone-400" />
                <p className="text-sm font-medium text-stone-700">No dishes match "{query.trim()}".</p>
                <p className="text-xs text-stone-400">Try a region, an ingredient, or part of the dish name.</p>
              </div>
            )
          ) : !done ? (
            <>
              <p className="text-xs text-stone-400 font-mono">
                {idx + 1} of {deck.length}
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
                  <div className="mt-4 flex flex-col gap-2">
                    <button onClick={skip} className="flex items-center justify-center gap-2 rounded-full border border-stone-300 py-2.5 text-stone-600">
                      <X size={18} /> Skip
                    </button>
                    <p className="text-center text-[11px] text-stone-400">Add to today's Rasoi</p>
                    <SlotButtons recipeId={dish.id} filledSlots={filledSlots} onAdd={(slot) => addToSlot(dish.id, slot)} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-stone-300 py-14 text-center">
              <Sparkles className="text-amber-600" />
              <p className="text-sm font-medium text-stone-700">You've been through today's picks.</p>
              <p className="text-xs text-stone-400">Search above to find something specific, or check back tomorrow.</p>
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
                  {cheatSaved.includes(item.name) ? "Saved" : "Save for this weekend"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
