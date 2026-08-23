"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle, Plus, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GAP_NUTRIENTS, VENDORS, WEEKLY_BUDGET, sumNutrition } from "@/lib/constants";
import { isoWeekStart, todayISO } from "@/lib/date";
import { NutrientBar, SectionLabel, VendorIcon, LoadingScreen } from "@/components/ui";
import type { Database } from "@/lib/database.types";

type GroceryItem = Database["public"]["Tables"]["grocery_items"]["Row"];
type Targets = Database["public"]["Tables"]["nutrition_targets"]["Row"];

const GROUP_LABELS: Record<string, string> = {
  kirana: "Kirana Store",
  sabziwala: "Sabziwala",
  dairy: "Dairy & Quick-Commerce",
  festival: "Occasional — Navratri prep",
};
const GROUP_ORDER = ["kirana", "sabziwala", "dairy", "festival"];

export default function GroceryScreen() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [addedExtras, setAddedExtras] = useState<string[]>([]);
  const [vendor, setVendor] = useState<"blinkit" | "zepto" | "instamart">("blinkit");
  const [targets, setTargets] = useState<Targets | null>(null);
  const [todayNutrition, setTodayNutrition] = useState(sumNutrition([]));
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const weekStart = isoWeekStart();

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: catalog }, { data: state }, { data: targetRow }, { data: planRows }] = await Promise.all([
        supabase.from("grocery_items").select("*").order("name"),
        supabase.from("grocery_list_state").select("*").eq("user_id", user.id).eq("week_start", weekStart).maybeSingle(),
        supabase.from("nutrition_targets").select("*").eq("user_id", user.id).single(),
        supabase.from("meal_plans").select("recipes(nutrition)").eq("user_id", user.id).eq("plan_date", todayISO()),
      ]);

      setItems(catalog ?? []);
      setChecked((state?.checked_items as Record<string, boolean>) ?? {});
      setAddedExtras(state?.added_extras ?? []);
      setVendor((state?.vendor as any) ?? "blinkit");
      setTargets(targetRow ?? null);
      setTodayNutrition(sumNutrition(((planRows ?? []) as any[]).map((p) => ({ nutrition: p.recipes?.nutrition }))));
      setLoading(false);
    })();
  }, [supabase, weekStart]);

  const persist = async (
    patch: Partial<{ checked_items: Record<string, boolean>; added_extras: string[]; vendor: "blinkit" | "zepto" | "instamart" }>
  ) => {
    if (!userId) return;
    await supabase.from("grocery_list_state").upsert({
      user_id: userId,
      week_start: weekStart,
      checked_items: checked,
      added_extras: addedExtras,
      vendor,
      ...patch,
    });
  };

  const toggle = (id: string) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    persist({ checked_items: next });
  };

  const addExtra = (id: string) => {
    const next = [...addedExtras, id];
    setAddedExtras(next);
    persist({ added_extras: next });
  };

  const removeExtra = (id: string) => {
    const next = addedExtras.filter((n) => n !== id);
    setAddedExtras(next);
    persist({ added_extras: next });
  };

  const changeVendor = (v: "blinkit" | "zepto" | "instamart") => {
    setVendor(v);
    persist({ vendor: v });
  };

  const baseItems = items.filter((i) => i.vendor_category !== "addon");
  const addonCatalog = items.filter((i) => i.vendor_category === "addon");
  const extrasItems = addedExtras.map((id) => addonCatalog.find((a) => a.id === id)).filter(Boolean) as GroceryItem[];
  const allItems = [...baseItems, ...extrasItems];
  const total = allItems.reduce((a, i) => a + Number(i.cost_estimate), 0);
  const gotTotal = allItems.filter((i) => checked[i.id]).reduce((a, i) => a + Number(i.cost_estimate), 0);
  const missing = allItems.filter((i) => !checked[i.id]);
  const activeVendor = VENDORS.find((v) => v.id === vendor)!;

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

  const handleOrder = async () => {
    const list = missing.map((i) => `${i.name} (${i.qty})`).join(", ");
    try {
      if (navigator.clipboard && missing.length) {
        await navigator.clipboard.writeText(list);
        setCopyState("copied");
      }
    } finally {
      window.open(activeVendor.url, "_blank", "noopener,noreferrer");
      setTimeout(() => setCopyState("idle"), 2500);
    }
  };

  const whatsappHref = useMemo(() => {
    const list = missing.map((i) => `• ${i.name} (${i.qty}) — ₹${i.cost_estimate}`).join("\n");
    const text = `Rasoi grocery list:\n${list}\n\nTotal: ₹${total - gotTotal} left to buy`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [missing, total, gotTotal]);

  if (loading || !targets) return <LoadingScreen label="Stocking up..." />;

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-5">
      <h1 className="text-2xl text-stone-900 font-serif font-semibold">Grocery</h1>

      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">This week's list</span>
          <span className="font-mono text-stone-800">
            ₹{gotTotal} of ₹{total}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-emerald-700" style={{ width: `${total ? Math.min(100, (gotTotal / total) * 100) : 0}%` }} />
        </div>
        <p className="mt-1 text-xs text-stone-400">
          Budget ₹{WEEKLY_BUDGET}/week · ₹{WEEKLY_BUDGET - total} left after this list
        </p>
      </div>

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
      </div>

      {recommended.length > 0 && (
        <div>
          <SectionLabel>Fill the gap</SectionLabel>
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
                  <Plus size={13} /> ₹{item.cost_estimate}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionLabel>Order missing items via</SectionLabel>
        <div className="flex gap-2">
          {VENDORS.map((v) => (
            <button
              key={v.id}
              onClick={() => changeVendor(v.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium ${vendor === v.id ? `${v.tone} text-white` : "border border-stone-200 bg-white text-stone-600"}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${vendor === v.id ? "bg-white" : v.tone}`} />
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {GROUP_ORDER.map((group) => {
        const groupItems = baseItems.filter((i) => i.vendor_category === group);
        if (groupItems.length === 0) return null;
        return (
          <div key={group}>
            <div className="mb-2 flex items-center gap-2">
              <VendorIcon type={group} />
              <SectionLabel>{GROUP_LABELS[group]}</SectionLabel>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white divide-y divide-stone-100">
              {groupItems.map((item) => (
                <label key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggle(item.id)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked[item.id] ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300"}`}
                  >
                    {checked[item.id] && <Check size={13} />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm ${checked[item.id] ? "text-stone-400 line-through" : "text-stone-800"}`}>{item.name}</p>
                    <p className="text-xs text-stone-400">{item.qty}</p>
                  </div>
                  <span className="text-xs text-stone-500 font-mono">₹{item.cost_estimate}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}

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
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked[item.id] ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300"}`}
                >
                  {checked[item.id] && <Check size={13} />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${checked[item.id] ? "text-stone-400 line-through" : "text-stone-800"}`}>{item.name}</p>
                  <p className="text-xs text-stone-400">{item.qty}</p>
                </div>
                <span className="text-xs text-stone-500 font-mono">₹{item.cost_estimate}</span>
                <button onClick={() => removeExtra(item.id)} className="text-stone-300">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-stone-300 py-2.5 text-sm text-stone-700"
        >
          <MessageCircle size={16} /> Send to cook
        </a>
        <button onClick={handleOrder} className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm text-white ${activeVendor.tone}`}>
          {copyState === "copied" ? (
            <>
              <Copy size={15} /> Copied — paste in {activeVendor.name}
            </>
          ) : (
            <>
              <ExternalLink size={15} /> Open {activeVendor.name}
            </>
          )}
        </button>
      </div>
      <p className="text-center text-[11px] text-stone-400 -mt-2">
        {missing.length} item{missing.length !== 1 ? "s" : ""} left to buy · copies to clipboard, since {activeVendor.name} doesn't support direct cart hand-off yet
      </p>
    </div>
  );
}
