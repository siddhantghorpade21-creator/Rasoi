"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Clock, Minus, Pause, Play, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/date";
import { SectionLabel, LoadingScreen } from "@/components/ui";
import type { Database, RecipeStep } from "@/lib/database.types";

type PlanRow = Database["public"]["Tables"]["meal_plans"]["Row"] & {
  recipes: Database["public"]["Tables"]["recipes"]["Row"];
};

function StepTimer({ seconds }: { seconds: number }) {
  const [endAt, setEndAt] = useState<number | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (endAt === null) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [endAt]);

  const remaining = endAt === null ? seconds : Math.max(0, Math.round((endAt - Date.now()) / 1000));
  const running = endAt !== null && remaining > 0;
  const done = endAt !== null && remaining === 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <span
      className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-mono ${
        done ? "bg-emerald-100 text-emerald-800" : running ? "bg-amber-100 text-amber-800" : "text-amber-700"
      }`}
    >
      <Clock size={12} />
      {mm}:{ss}
      {!running && !done && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEndAt(Date.now() + seconds * 1000);
          }}
          className="ml-1 flex items-center gap-0.5 rounded-full bg-amber-600 px-1.5 py-0.5 text-white"
        >
          <Play size={9} /> start
        </button>
      )}
      {running && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEndAt(null);
          }}
          className="ml-1 flex items-center gap-0.5 rounded-full bg-stone-500 px-1.5 py-0.5 text-white"
        >
          <Pause size={9} /> stop
        </button>
      )}
      {done && "· done"}
    </span>
  );
}

function CookScreenInner() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");

  const [loading, setLoading] = useState(true);
  const [todaysPlans, setTodaysPlans] = useState<PlanRow[]>([]);
  const [dish, setDish] = useState<PlanRow | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [portion, setPortion] = useState(1);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (planId) {
        const { data } = await supabase.from("meal_plans").select("*, recipes(*)").eq("id", planId).eq("user_id", user.id).single();
        const row = (data as unknown as PlanRow) ?? null;
        setDish(row);
        if (row) setPortion(row.portion);
      } else {
        const { data } = await supabase.from("meal_plans").select("*, recipes(*)").eq("user_id", user.id).eq("plan_date", todayISO());
        setTodaysPlans((data as unknown as PlanRow[]) ?? []);
      }
      setLoading(false);
    })();
  }, [supabase, planId]);

  const toggleStep = (key: string) => setCheckedSteps((c) => ({ ...c, [key]: !c[key] }));

  const changePortion = async (delta: number) => {
    if (!dish) return;
    const next = Math.max(0.5, Math.round((portion + delta) * 2) / 2);
    setPortion(next);
    await supabase.from("meal_plans").update({ portion: next }).eq("id", dish.id);
  };

  if (loading) return <LoadingScreen label="Preheating..." />;

  if (!dish) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-6 pt-5">
        <h1 className="text-2xl text-stone-900 font-serif font-semibold">Cook</h1>
        <p className="text-sm text-stone-500">Pick a dish from today's thali to start.</p>
        {todaysPlans.length === 0 ? (
          <p className="text-sm text-stone-400">Nothing planned for today yet — add something from Discover first.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {todaysPlans.map((item) => (
              <button
                key={item.id}
                onClick={() => router.push(`/cook?plan=${item.id}`)}
                className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 text-left"
              >
                <div>
                  <p className="text-xs font-semibold uppercase text-amber-700">{item.meal_slot}</p>
                  <p className="text-base text-stone-900 font-serif font-semibold">{item.recipes.name}</p>
                </div>
                <ChevronRight size={18} className="text-stone-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const recipe = dish.recipes;
  const n = recipe.nutrition;

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-5">
      <div className="flex items-center gap-2">
        <button onClick={() => router.push("/cook")} className="rounded-full border border-stone-200 p-1.5">
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase text-amber-700">
            {dish.meal_slot}
            {dish.planned_time ? ` · serve ${dish.planned_time}` : ""}
          </p>
          <h1 className="text-xl text-stone-900 font-serif font-semibold">{recipe.name}</h1>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <SectionLabel>Your portion</SectionLabel>
          <div className="flex items-center gap-3">
            <button onClick={() => changePortion(-0.5)} className="rounded-full border border-stone-300 p-1">
              <Minus size={13} />
            </button>
            <span className="w-10 text-center text-sm text-stone-800 font-mono">{portion}×</span>
            <button onClick={() => changePortion(0.5)} className="rounded-full border border-stone-300 p-1">
              <Plus size={13} />
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-sm font-semibold text-stone-800 font-mono">{Math.round(n.calories * portion)}</p>
            <p className="text-[10px] text-stone-400">kcal</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800 font-mono">{Math.round(n.protein * portion)}g</p>
            <p className="text-[10px] text-stone-400">protein</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800 font-mono">{Math.round(n.carbs * portion)}g</p>
            <p className="text-[10px] text-stone-400">carbs</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800 font-mono">{Math.round(n.fat * portion)}g</p>
            <p className="text-[10px] text-stone-400">fat</p>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-stone-400">Based on 1 standard serving at {portion}× — adjust to match what's actually on your plate.</p>
      </div>

      {recipe.tracks && recipe.tracks.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {recipe.tracks.map((track) => (
            <div key={track.label} className="rounded-2xl border border-stone-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-900">{track.label}</p>
              <p className="text-[11px] text-stone-400 font-mono">start {track.start}</p>
              <div className="mt-2 flex flex-col gap-2">
                {track.steps.map((step: RecipeStep, i: number) => {
                  const key = `${track.label}-${i}`;
                  return (
                    <button key={key} onClick={() => toggleStep(key)} className="flex items-start gap-2 text-left">
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          checkedSteps[key] ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300"
                        }`}
                      >
                        {checkedSteps[key] && <Check size={10} />}
                      </span>
                      <span>
                        <span className={`text-xs font-medium ${checkedSteps[key] ? "text-stone-400 line-through" : "text-stone-800"}`}>{step.title}</span>
                        <p className="text-[11px] text-stone-500">{step.detail}</p>
                        {step.timer_seconds && (
                          <div>
                            <StepTimer seconds={step.timer_seconds} />
                          </div>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recipe.steps.map((step, i) => {
            const key = `s-${i}`;
            return (
              <button key={key} onClick={() => toggleStep(key)} className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                    checkedSteps[key] ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 text-stone-500"
                  }`}
                >
                  {checkedSteps[key] ? <Check size={13} /> : i + 1}
                </span>
                <span>
                  <span className={`text-sm font-medium ${checkedSteps[key] ? "text-stone-400 line-through" : "text-stone-900"}`}>{step.title}</span>
                  <p className="mt-0.5 text-xs text-stone-500">{step.detail}</p>
                  {step.timer_seconds && (
                    <div>
                      <StepTimer seconds={step.timer_seconds} />
                    </div>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CookScreen() {
  return (
    <Suspense fallback={<LoadingScreen label="Preheating..." />}>
      <CookScreenInner />
    </Suspense>
  );
}
