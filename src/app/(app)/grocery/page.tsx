"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChefHat, MessageCircle, Plus, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GAP_NUTRIENTS, sumNutrition } from "@/lib/constants";
import { isoWeekStart, todayISO } from "@/lib/date";
import { aggregateIngredients, type AggregatedIngredient } from "@/lib/ingredientPricing";
import { NutrientBar, SectionLabel, LoadingScreen } from "@/components/ui";
import type { Database } from "@/lib/database.types";

type GroceryItem = Database["public"]["Tables"]["grocery_items"]["Row"];
type Targets = Database["public"]["Tables"]["nutrition_targets"]["Row"];

export default function GroceryScreen() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [addonCatalog, setAddonCatalog] = useState<GroceryItem[]>([]);
  const [toBuy, setToBuy] = useState<Record<string, boolean>>({});
  const [addedExtras, setAddedExtras] = useState<string[]>([]);
  const [targets, setTargets] = useState<Targets | null>(null);
  const [todayNutrition, setTodayNutrition] = useState(sumNutrition([]));
  const [dishIngredients, setDishIngredients] = useState<AggregatedIngredient[]>([]);
  const weekStart = isoWeekStart();

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: catalog }, { data: state }, { data: targetRow }, { data: planRows }] = await Promise.all([
        supabase.from("grocery_items").select("*").eq("vendor_category", "addon").order("name"),
        supabase.from("grocery_list_state").select("*").eq("user_id", user.id).eq("week_start", weekStart).maybeSingle(),
        supabase.from("nutrition_targets").select("*").eq("user_id", user.id).single(),
        supabase.from("meal_plans").select("portion, recipes(name, ingredients, nutrition)").eq("user_id", user.id).eq("plan_date", todayISO()),
      ]);

      const recipes = ((planRows ?? []) as any[]).map((p) => ({ ...p.recipes, portion: p.portion })).filter((r) => r.name);

      setAddonCatalog(catalog ?? []);
      setToBuy((state?.to_buy_items as Record<string, boolean>) ?? {});
      setAddedExtras(state?.added_extras ?? []);
      setTargets(targetRow ?? null);
      setTodayNutrition(sumNutrition(recipes.map((r) => ({ nutrition: r.nutrition, portion: r.portion }))));
      setDishIngredients(aggregateIngredients(recipes));
      setLoading(false);
    })();
  }, [supabase, weekStart]);

  const persist = async (patch: Partial<{ to_buy_items: Record<string, boolean>; added_extras: string[] }>) => {
    if (!userId) return;
    await supabase.from("grocery_list_state").upsert({
      user_id: userId,
      week_start: weekStart,
      to_buy_items: toBuy,
      added_extras: addedExtras,
      ...patch,
    });
  };

  const toggle = (key: string) => {
    const next = { ...toBuy, [key]: !toBuy[key] };
    setToBuy(next);
    persist({ to_buy_items: next });
  };

  const addExtra = (id: string) => {
    const nextExtras = [...addedExtras, id];
    const nextToBuy = { ...toBuy, [id]: true };
    setAddedExtras(nextExtras);
    setToBuy(nextToBuy);
    persist({ added_extras: nextExtras, to_buy_items: nextToBuy });
  };

  const removeExtra = (id: string) => {
    const nextExtras = addedExtras.filter((n) => n !== id);
    setAddedExtras(nextExtras);
    persist({ added_extras: nextExtras });
  };

  const extrasItems = addedExtras.map((id) => addonCatalog.find((a) => a.id === id)).filter(Boolean) as GroceryItem[];
  const extrasNutrition = sumNutrition(extrasItems);
  const combined = useMemo(() => {
    const t = todayNutrition;
    const e = extrasNutrition;
    return {
      calories: t.calories + e.calories,
      protein: t.protein + e.protein,
      carbs: t.carbs + e.carbs,
      fat: t.fat + e.fat,
      fiber: t.fiber + e.fiber,
      iron: t.iron + e.iron,
      calcium: t.calcium + e.calcium,
    };
  }, [todayNutrition, extrasNutrition]);

  const recommended = useMemo(() => {
    if (!targets) return [];
    const gapScores = GAP_NUTRIENTS.map((k) => ({
      key: k,
      gap: Math.max(0, 1 - (combined as any)[k] / ((targets as any)[k] || 1)),
    })).sort((a, b) => b.gap - a.gap);
    const topGapKeys = gapScores.slice(0, 3).map((g) => g.key);
    return addonCatalog
      .filter((a) => !addedExtras.includes(a.id))
      .map((a) => ({ ...a, score: a.nutrition_tags.filter((t) => topGapKeys.includes(t as any)).length }))
      .filter((a) => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [targets, combined, addonCatalog, addedExtras]);

  const toBuyDish = dishIngredients.filter((i) => toBuy[i.key]);
  const toBuyExtras = extrasItems.filter((i) => toBuy[i.id]);
  const toBuyCount = toBuyDish.length + toBuyExtras.length;

  const buildListText = () => {
    const dishLines = toBuyDish.map((i) => `• ${i.name} (${i.qty} ${i.unit})`);
    const extraLines = toBuyExtras.map((i) => `• ${i.name} (${i.qty})`);
    return [dishLines.length ? `For today's Rasoi:\n${dishLines.join("\n")}` : "", extraLines.length ? `Nutrition top-ups:\n${extraLines.join("\n")}` : ""]
      .filter(Boolean)
      .join("\n\n");
  };

  const whatsappHref = useMemo(() => {
    const text = `Rasoi grocery list:\n\n${buildListText()}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toBuyDish, toBuyExtras]);

  if (loading || !targets) return <LoadingScreen label="Stocking up..." />;

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-5">
      <h1 className="text-2xl text-stone-900 font-serif font-semibold">Grocery</h1>

      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <SectionLabel>Today's nutrition vs your target</SectionLabel>
        <div className="flex flex-col gap-2.5">
          <NutrientBar label="Calories" value={combined.calories} target={targets.calories} unit="" tone="amber" />
          <NutrientBar label="Protein" value={combined.protein} target={targets.protein} unit="g" tone="red" />
          <NutrientBar label="Carbs" value={combined.carbs} target={targets.carbs} unit="g" tone="emerald" />
          <NutrientBar label="Fat" value={combined.fat} target={targets.fat} unit="g" tone="purple" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            ["Fiber", "fiber", "g"],
            ["Iron", "iron", "mg"],
            ["Calcium", "calcium", "mg"],
          ].map(([label, key, unit]) => (
            <div key={key} className="rounded-xl bg-amber-50 py-2">
              <p className="text-xs font-semibold text-stone-800 font-mono">
                {Math.round((combined as any)[key])}
                {unit}
              </p>
              <p className="text-[10px] text-stone-500">
                {label} · {Math.round(((combined as any)[key] / (targets as any)[key]) * 100)}%
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-stone-400">Scales with each dish's portion size and updates live as you add "Fill the gap" items below.</p>
      </div>

      {dishIngredients.length > 0 ? (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            <SectionLabel>For today's Rasoi</SectionLabel>
          </div>
          <p className="-mt-1 mb-2 text-xs text-stone-400">Check what you need to buy — leave unchecked what you already have.</p>
          <div className="rounded-2xl border border-stone-200 bg-white divide-y divide-stone-100">
            {dishIngredients.map((item) => (
              <label key={item.key} className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => toggle(item.key)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${toBuy[item.key] ? "border-red-900 bg-red-900 text-white" : "border-stone-300"}`}
                >
                  {toBuy[item.key] && <Check size={13} />}
                </button>
                <div className="flex-1">
                  <p className="text-sm text-stone-800">{item.name}</p>
                  <p className="text-xs text-stone-400">
                    {item.qty} {item.unit} · for {item.recipes.join(", ")}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-stone-300 py-10 text-center">
          <Sparkles className="text-amber-600" size={20} />
          <p className="text-sm font-medium text-stone-700">Nothing planned for today yet.</p>
          <p className="text-xs text-stone-400">Add a dish from Discover and its ingredients will show up here.</p>
        </div>
      )}

      {recommended.length > 0 && (
        <div>
          <SectionLabel>Fill the gap</SectionLabel>
          <p className="-mt-1 mb-2 text-xs text-stone-400">Based on what today's Rasoi is missing toward your daily targets.</p>
          <div className="flex flex-col gap-2">
            {recommended.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-800">
                    {item.name} <span className="text-xs font-normal text-stone-400">· {item.qty}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.nutrition_tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-900" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={() => addExtra(item.id)} className="flex items-center gap-1 rounded-full bg-stone-900 px-3 py-1.5 text-xs text-amber-50">
                  <Plus size={13} /> Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {extrasItems.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <SectionLabel>Added to close nutrition gaps</SectionLabel>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white divide-y divide-stone-100">
            {extrasItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => toggle(item.id)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${toBuy[item.id] ? "border-red-900 bg-red-900 text-white" : "border-stone-300"}`}
                >
                  {toBuy[item.id] && <Check size={13} />}
                </button>
                <div className="flex-1">
                  <p className="text-sm text-stone-800">{item.name}</p>
                  <p className="text-xs text-stone-400">{item.qty}</p>
                </div>
                <button onClick={() => removeExtra(item.id)} className="text-stone-300">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-full bg-stone-900 py-2.5 text-sm text-amber-50"
      >
        <MessageCircle size={16} /> Send to cook
      </a>
      <p className="text-center text-[11px] text-stone-400 -mt-2">
        {toBuyCount} item{toBuyCount !== 1 ? "s" : ""} checked to buy
      </p>
    </div>
  );
}
