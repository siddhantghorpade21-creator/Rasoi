"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DIET_OPTIONS, GOAL_PRESETS, REGION_OPTIONS } from "@/lib/constants";
import { SectionLabel, LoadingScreen } from "@/components/ui";
import type { Database, DietPreference } from "@/lib/database.types";

type Targets = Database["public"]["Tables"]["nutrition_targets"]["Row"];
type Member = Database["public"]["Tables"]["household_members"]["Row"];

export default function ProfileScreen() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [targets, setTargets] = useState<Targets | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");
  const [diet, setDiet] = useState<DietPreference | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [regionOther, setRegionOther] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: targetRow }, { data: memberRows }, { data: profile }] = await Promise.all([
        supabase.from("nutrition_targets").select("*").eq("user_id", user.id).single(),
        supabase.from("household_members").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("profiles").select("diet_preference, region_preferences, region_preference_other").eq("id", user.id).single(),
      ]);
      setTargets(targetRow);
      setMembers(memberRows ?? []);
      setDiet((profile?.diet_preference as DietPreference | null) ?? null);
      setRegions(profile?.region_preferences ?? []);
      setRegionOther(profile?.region_preference_other ?? "");
      setLoading(false);
    })();
  }, [supabase]);

  const saveDiet = async (id: DietPreference) => {
    setDiet(id);
    if (userId) await supabase.from("profiles").update({ diet_preference: id }).eq("id", userId);
  };

  const toggleRegion = async (r: string) => {
    const next = regions.includes(r) ? regions.filter((x) => x !== r) : [...regions, r];
    setRegions(next);
    if (userId) await supabase.from("profiles").update({ region_preferences: next }).eq("id", userId);
  };

  const saveRegionOther = async () => {
    if (userId) await supabase.from("profiles").update({ region_preference_other: regionOther.trim() || null }).eq("id", userId);
  };

  const applyPreset = async (id: string) => {
    if (!userId || !targets) return;
    const { label, ...preset } = GOAL_PRESETS[id];
    const next = { ...targets, goal_preset: id, ...preset };
    setTargets(next);
    await supabase.from("nutrition_targets").update({ goal_preset: id, ...preset }).eq("user_id", userId);
  };

  type MacroKey = "calories" | "protein" | "carbs" | "fat" | "fiber" | "iron" | "calcium";

  const updateField = (key: MacroKey, value: number) => {
    if (!targets) return;
    setTargets({ ...targets, [key]: value });
  };

  const saveField = async (key: MacroKey, value: number) => {
    if (!userId) return;
    await supabase
      .from("nutrition_targets")
      .update({ [key]: value } as Record<MacroKey, number>)
      .eq("user_id", userId);
  };

  const addMember = async () => {
    if (!userId || !newName.trim()) return;
    const { data } = await supabase
      .from("household_members")
      .insert({ user_id: userId, name: newName.trim(), note: newNote.trim() || null })
      .select()
      .single();
    if (data) setMembers([...members, data]);
    setNewName("");
    setNewNote("");
  };

  const updateMember = async (id: string, patch: Partial<Member>) => {
    setMembers(members.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    await supabase.from("household_members").update(patch).eq("id", id);
  };

  const removeMember = async (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
    await supabase.from("household_members").delete().eq("id", id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const field = (key: MacroKey, label: string, unit: string) => (
    <div>
      <label className="text-xs text-stone-500">
        {label} ({unit})
      </label>
      <input
        type="number"
        value={targets ? targets[key] : 0}
        onChange={(e) => updateField(key, Number(e.target.value) || 0)}
        onBlur={(e) => saveField(key, Number(e.target.value) || 0)}
        className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-amber-600 font-mono"
      />
    </div>
  );

  if (loading || !targets) return <LoadingScreen label="Loading profile..." />;

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-5">
      <h1 className="text-2xl text-stone-900 font-serif font-semibold">Profile</h1>

      <div>
        <SectionLabel>Dietary preference</SectionLabel>
        <div className="flex flex-col gap-2">
          {DIET_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => saveDiet(opt.id)}
              className={`flex flex-col items-start rounded-2xl border px-4 py-2.5 text-left ${
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
        <SectionLabel>Regional preference</SectionLabel>
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
          value={regionOther}
          onChange={(e) => setRegionOther(e.target.value)}
          onBlur={saveRegionOther}
          placeholder="Something else? Type it in"
          className="mt-2 w-full rounded-full border border-stone-300 bg-white px-4 py-2 text-sm outline-none focus:border-amber-600 placeholder:text-stone-400"
        />
        <p className="mt-2 text-xs text-stone-400">Boosts matching dishes to the top of Discover — it doesn't hide the rest.</p>
      </div>

      <div>
        <SectionLabel>Goal</SectionLabel>
        <div className="flex gap-2">
          {Object.entries(GOAL_PRESETS).map(([id, p]) => (
            <button
              key={id}
              onClick={() => applyPreset(id)}
              className={`flex-1 rounded-full py-2 text-xs font-medium ${targets.goal_preset === id ? "bg-stone-900 text-amber-50" : "border border-stone-200 bg-white text-stone-600"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Daily macro targets</SectionLabel>
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-stone-200 bg-white p-4">
          {field("calories", "Calories", "kcal")}
          {field("protein", "Protein", "g")}
          {field("carbs", "Carbs", "g")}
          {field("fat", "Fat", "g")}
        </div>
      </div>

      <div>
        <SectionLabel>Daily micronutrient targets</SectionLabel>
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-stone-200 bg-white p-4">
          {field("fiber", "Fiber", "g")}
          {field("iron", "Iron", "mg")}
          {field("calcium", "Calcium", "mg")}
        </div>
        <p className="mt-2 text-xs text-stone-400">Your grocery list uses these to recommend add-ons that close today's gaps automatically.</p>
      </div>

      <div>
        <SectionLabel>Household</SectionLabel>
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white p-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <input
                  defaultValue={m.name}
                  onBlur={(e) => e.target.value.trim() && e.target.value !== m.name && updateMember(m.id, { name: e.target.value.trim() })}
                  className="rounded-lg border border-stone-200 px-2 py-1 text-sm outline-none focus:border-amber-600"
                />
                <input
                  defaultValue={m.note ?? ""}
                  placeholder="Dietary note (e.g. no onion-garlic)"
                  onBlur={(e) => updateMember(m.id, { note: e.target.value.trim() || null })}
                  className="rounded-lg border border-stone-200 px-2 py-1 text-xs outline-none focus:border-amber-600 placeholder:text-stone-400"
                />
              </div>
              <button onClick={() => removeMember(m.id)} className="rounded-full p-2 text-stone-400 hover:text-red-800">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-stone-300 p-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:border-amber-600"
            />
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Dietary note (optional)"
              className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:border-amber-600"
            />
            <button onClick={addMember} className="flex items-center justify-center gap-1 rounded-full bg-stone-900 py-2 text-xs font-medium text-amber-50">
              <Plus size={13} /> Add household member
            </button>
          </div>
        </div>
      </div>

      <button onClick={signOut} className="flex items-center justify-center gap-2 rounded-full border border-stone-300 py-2.5 text-sm text-stone-600">
        <LogOut size={15} /> Sign out
      </button>
    </div>
  );
}
