"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, Globe, IndianRupee, Minus, Plus, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { STRINGS } from "@/lib/constants";
import { todayISO } from "@/lib/date";
import { Tag, LoadingScreen } from "@/components/ui";
import type { Database } from "@/lib/database.types";

type Member = Database["public"]["Tables"]["household_members"]["Row"];
type PlanRow = Database["public"]["Tables"]["meal_plans"]["Row"] & {
  recipes: Database["public"]["Tables"]["recipes"]["Row"];
};

const MEAL_ORDER = { breakfast: 0, lunch: 1, dinner: 2 };
const LEFTOVER_SUGGESTIONS = [
  "Turn it into tomorrow's paratha filling — mash it with a little besan and roll it in.",
  "Fold it into a quick fried rice with an egg and some leftover veggies.",
  "Mix it into a sandwich stuffing with a slice of cheese and toast it.",
  "Turn it into a stuffed paratha or wrap for tomorrow's tiffin.",
];

export default function TodayScreen() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [members, setMembers] = useState<Member[]>([]);
  const [activeMember, setActiveMember] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanRow[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [leftover, setLeftover] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: memberRows }, { data: planRows }, { data: banners }] = await Promise.all([
        supabase.from("profiles").select("language, active_member_id").eq("id", user.id).single(),
        supabase.from("household_members").select("*").eq("user_id", user.id).order("created_at"),
        supabase
          .from("meal_plans")
          .select("*, recipes(*)")
          .eq("user_id", user.id)
          .eq("plan_date", todayISO()),
        supabase.from("festival_banners").select("*").lte("starts_on", todayISO()).gte("ends_on", todayISO()).limit(1),
      ]);

      setLang((profile?.language as "en" | "hi") ?? "en");
      setMembers(memberRows ?? []);
      setActiveMember(profile?.active_member_id ?? memberRows?.[0]?.id ?? null);
      setPlan(((planRows as unknown as PlanRow[]) ?? []).sort((a, b) => MEAL_ORDER[a.meal_slot] - MEAL_ORDER[b.meal_slot]));
      setBanner(banners?.[0]?.message ?? null);
      setLoading(false);
    })();
  }, [supabase]);

  const toggleLang = async () => {
    const next = lang === "en" ? "hi" : "en";
    setLang(next);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ language: next }).eq("id", user.id);
  };

  const selectMember = async (id: string) => {
    setActiveMember(id);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ active_member_id: id }).eq("id", user.id);
  };

  const startCooking = (planId: string) => router.push(`/cook?plan=${planId}`);

  const changePortion = async (planId: string, delta: number) => {
    const item = plan.find((p) => p.id === planId);
    if (!item) return;
    const next = Math.max(0.5, Math.round((item.portion + delta) * 2) / 2);
    setPlan(plan.map((p) => (p.id === planId ? { ...p, portion: next } : p)));
    await supabase.from("meal_plans").update({ portion: next }).eq("id", planId);
  };

  const suggest = () => {
    if (!leftover.trim()) {
      setSuggestion(null);
      return;
    }
    setSuggestion(LEFTOVER_SUGGESTIONS[Math.floor(Math.random() * LEFTOVER_SUGGESTIONS.length)]);
  };

  if (loading) return <LoadingScreen label="Loading your kitchen..." />;

  const s = STRINGS[lang];

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-stone-400 font-mono">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-2xl text-stone-900 font-serif font-semibold">{s.greeting}</h1>
          <p className="text-sm text-stone-500 italic">{s.tagline}</p>
        </div>
        <button onClick={toggleLang} className="flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600">
          <Globe size={13} /> {lang === "en" ? "हिंदी" : "English"}
        </button>
      </div>

      {banner && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-900 px-4 py-3 text-amber-50">
          <CalendarDays size={20} className="shrink-0" />
          <p className="text-sm">{banner}</p>
        </div>
      )}

      {members.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400 font-mono">Cooking for</p>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => selectMember(m.id)}
                className={`rounded-full px-3 py-1.5 text-sm border ${activeMember === m.id ? "bg-stone-900 text-amber-50 border-stone-900" : "bg-white text-stone-600 border-stone-200"}`}
              >
                {m.name}
                {m.note && <span className="ml-1.5 text-[10px] opacity-70">· {m.note}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400 font-mono">Today's thali</p>
        {plan.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-stone-300 py-10 text-center">
            <Sparkles className="text-amber-600" size={20} />
            <p className="text-sm font-medium text-stone-700">Nothing planned for today yet.</p>
            <p className="text-xs text-stone-400">Head to Discover to save a recipe, then plan it here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {plan.map((item) => (
              <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    {item.meal_slot[0].toUpperCase() + item.meal_slot.slice(1)}
                    {item.planned_time ? ` · ${item.planned_time}` : ""}
                  </p>
                  <span className="flex items-center gap-1 text-xs text-stone-500 font-mono">
                    <IndianRupee size={11} />
                    {item.recipes.cost_estimate}
                  </span>
                </div>
                <h3 className="mt-1 text-lg text-stone-900 font-serif font-semibold">{item.recipes.name}</h3>
                <p className="mt-0.5 text-xs text-stone-400 font-mono">{Math.round(item.recipes.nutrition.calories * item.portion)} kcal · {item.portion}× portion</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.recipes.tags.map((t) => (
                    <Tag key={t} tone="curry">
                      {t}
                    </Tag>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <button onClick={() => startCooking(item.id)} className="flex items-center gap-1 text-sm font-medium text-red-900">
                    Start cooking <ChevronRight size={15} />
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changePortion(item.id, -0.5)} className="rounded-full border border-stone-300 p-1">
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-xs text-stone-600 font-mono">{item.portion}×</span>
                    <button onClick={() => changePortion(item.id, 0.5)} className="rounded-full border border-stone-300 p-1">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-stone-300 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-stone-800">Kal ka kuch bacha hai?</p>
        <p className="mt-0.5 text-xs text-stone-500">Tell us what's left — we'll fold it into today's plan instead of the bin.</p>
        <div className="mt-3 flex gap-2">
          <input
            value={leftover}
            onChange={(e) => setLeftover(e.target.value)}
            placeholder="e.g. baingan bharta, 2 rotis"
            className="flex-1 rounded-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-600"
          />
          <button onClick={suggest} className="rounded-full bg-stone-900 px-4 py-2 text-sm text-amber-50">
            Suggest
          </button>
        </div>
        {suggestion && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-white p-3 text-sm text-stone-700">
            <Sparkles size={15} className="mt-0.5 shrink-0 text-amber-600" />
            {suggestion}
          </div>
        )}
      </div>
    </div>
  );
}
