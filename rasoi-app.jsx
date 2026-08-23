import React, { useState, useEffect, useRef } from "react";
import {
  Home, Search, ShoppingCart, ChefHat, Heart, X, Clock, Users, IndianRupee,
  Flame, Mic, ChevronRight, ChevronLeft, CalendarDays, Sparkles, Check,
  Globe, MessageCircle, Send, Leaf, AlertCircle, Loader2, RotateCcw, Copy,
  ExternalLink, Plus, Minus, User, Pizza, Info
} from "lucide-react";

/* ---------------------------------- DATA ---------------------------------- */

const HOUSEHOLD = [
  { id: "you", name: "You", note: null },
  { id: "amma", name: "Amma", note: "No onion-garlic" },
  { id: "kids", name: "Kids", note: "Mild spice only" },
];

const TODAY_PLAN = [
  {
    id: "breakfast",
    meal: "Breakfast",
    time: "8:00 AM",
    dish: "Kanda Poha",
    tags: ["10-min", "Tiffin-friendly"],
    cost: 25,
    spice: 1,
    baseServings: 2,
    nutrition: { calories: 230, protein: 4, carbs: 40, fat: 7, fiber: 3, iron: 1.8, calcium: 20 },
    steps: [
      { title: "Rinse the poha", detail: "Rinse flattened rice in a strainer under running water for 10 seconds. Set aside — do not soak.", timer: null },
      { title: "Temper the oil", detail: "Heat oil, add mustard seeds, curry leaves and slit green chilli. Let it splutter.", timer: 120 },
      { title: "Onion (skip for Amma's bowl)", detail: "Add chopped onion, sauté till translucent. Set aside a portion before this step for Amma.", timer: 240 },
      { title: "Add poha and turmeric", detail: "Add turmeric, salt and the rinsed poha. Mix gently so it doesn't turn mushy.", timer: 120 },
      { title: "Steam covered", detail: "Cover and let it steam on low flame.", timer: 180 },
      { title: "Finish and serve", detail: "Squeeze lemon, garnish with coriander and sev. Serve hot.", timer: null },
    ],
  },
  {
    id: "lunch",
    meal: "Lunch",
    time: "1:00 PM",
    dish: "Moong Dal Khichdi + Kadhi",
    tags: ["No onion-garlic", "Amma-approved"],
    cost: 45,
    spice: 1,
    baseServings: 2,
    nutrition: { calories: 420, protein: 14, carbs: 60, fat: 12, fiber: 6, iron: 3.2, calcium: 180 },
    parallel: true,
    tracks: [
      { label: "Kadhi", start: "12:35 PM", steps: [
          { title: "Whisk the base", detail: "Whisk besan, curd and water into a smooth, lump-free mix.", timer: null },
          { title: "Temper and simmer", detail: "Temper with jeera, methi and hing, then pour in the base. Simmer on low, stirring often.", timer: 900 },
      ]},
      { label: "Khichdi", start: "12:40 PM", steps: [
          { title: "Wash dal and rice", detail: "Wash moong dal and rice together, drain well.", timer: null },
          { title: "Pressure cook", detail: "Cook with turmeric, salt and a spoon of ghee for 3 whistles.", timer: 720 },
          { title: "Rest before opening", detail: "Let pressure release naturally before opening the lid.", timer: 300 },
      ]},
    ],
  },
  {
    id: "dinner",
    meal: "Dinner",
    time: "8:30 PM",
    dish: "Paneer Bhurji Paratha",
    tags: ["Kids will eat this", "20-min"],
    cost: 60,
    spice: 2,
    baseServings: 2,
    nutrition: { calories: 380, protein: 15, carbs: 45, fat: 16, fiber: 4, iron: 1.5, calcium: 220 },
    steps: [
      { title: "Make the bhurji", detail: "Crumble paneer and sauté with capsicum, tomato and mild spices.", timer: 300 },
      { title: "Rest the dough", detail: "Knead the dough and let it rest, covered.", timer: 600 },
      { title: "Stuff and roll", detail: "Roll the dough, stuff with bhurji, seal and roll into a paratha.", timer: null },
      { title: "Cook on the tawa", detail: "Cook with ghee till golden spots appear on both sides.", timer: 240 },
      { title: "Serve", detail: "Serve hot with curd or pickle.", timer: null },
    ],
  },
];

const DISCOVER_RECIPES = [
  { name: "Chettinad Chicken Curry", region: "Tamil Nadu", diet: "Non-veg", time: 45, cost: 120, spice: 4, tags: ["Spicy", "Weekend special"], goodFor: ["You"], caution: "Too spicy for Kids · has onion-garlic" },
  { name: "Dhokla", region: "Gujarat", diet: "Veg", time: 30, cost: 30, spice: 1, tags: ["Steamed", "Tiffin-friendly"], goodFor: ["You", "Amma", "Kids"], caution: null },
  { name: "Sabudana Khichdi", region: "Maharashtra", diet: "Vrat / Fasting", time: 20, cost: 45, spice: 1, tags: ["Navratri special"], goodFor: ["You", "Amma"], caution: "Kids may find it bland — add a little sugar" },
  { name: "Litti Chokha", region: "Bihar", diet: "Veg", time: 50, cost: 60, spice: 2, tags: ["Weekend special"], goodFor: ["You"], caution: "Chokha has onion — skip that part for Amma" },
  { name: "Baingan Bharta", region: "Punjab", diet: "Veg", time: 30, cost: 40, spice: 2, tags: ["Smoky", "Comfort food"], goodFor: ["You", "Kids"], caution: "Made with onion-garlic — cook Amma's portion separately" },
  { name: "Undhiyu", region: "Gujarat", diet: "Veg", time: 60, cost: 90, spice: 2, tags: ["Festival special", "Winter"], goodFor: ["You", "Amma"], caution: "Long prep — best for a weekend" },
];

const GROCERY = [
  { vendor: "Kirana Store", icon: "kirana", items: [
      { name: "Atta, chakki-fresh", qty: "5 kg", cost: 210 },
      { name: "Toor dal", qty: "1 kg", cost: 160 },
      { name: "Mustard oil", qty: "1 L", cost: 140 },
      { name: "Turmeric powder", qty: "100 g", cost: 35 },
      { name: "Red chilli powder", qty: "100 g", cost: 40 },
      { name: "Sugar", qty: "1 kg", cost: 45 },
      { name: "Salt", qty: "1 kg", cost: 20 },
      { name: "Poha", qty: "500 g", cost: 35 },
  ]},
  { vendor: "Sabziwala", icon: "sabzi", items: [
      { name: "Onions", qty: "2 kg", cost: 60 },
      { name: "Tomatoes", qty: "1 kg", cost: 35 },
      { name: "Baingan", qty: "500 g", cost: 30 },
      { name: "Green chilli", qty: "100 g", cost: 15 },
      { name: "Coriander leaves", qty: "1 bunch", cost: 10 },
      { name: "Curry leaves", qty: "1 bunch", cost: 5 },
      { name: "Capsicum", qty: "250 g", cost: 20 },
  ]},
  { vendor: "Dairy & Quick-Commerce", icon: "dairy", items: [
      { name: "Paneer", qty: "200 g", cost: 80 },
      { name: "Curd", qty: "500 g", cost: 35 },
      { name: "Milk", qty: "1 L", cost: 32 },
      { name: "Ghee", qty: "200 g", cost: 180 },
  ]},
  { vendor: "Occasional — Navratri prep", icon: "festival", items: [
      { name: "Sabudana", qty: "500 g", cost: 55 },
      { name: "Jaggery", qty: "500 g", cost: 40 },
      { name: "Besan", qty: "500 g", cost: 50 },
  ]},
];

const ADDON_ITEMS = [
  { name: "Roasted chana", qty: "100 g", cost: 25, tags: ["protein", "fiber", "iron"], nutrition: { calories: 360, protein: 20, fiber: 12, iron: 5, calcium: 50 } },
  { name: "Sprouts mix", qty: "100 g", cost: 20, tags: ["protein", "fiber", "iron"], nutrition: { calories: 120, protein: 9, fiber: 8, iron: 2, calcium: 40 } },
  { name: "Toned milk, extra", qty: "250 ml", cost: 15, tags: ["protein", "calcium"], nutrition: { calories: 150, protein: 8, fiber: 0, iron: 0.2, calcium: 300 } },
  { name: "Almonds", qty: "30 g", cost: 45, tags: ["protein", "calcium", "fiber"], nutrition: { calories: 180, protein: 6, fiber: 3, iron: 1.2, calcium: 75 } },
  { name: "Spinach (palak)", qty: "1 bunch", cost: 15, tags: ["iron", "fiber", "calcium"], nutrition: { calories: 40, protein: 3, fiber: 4, iron: 3.5, calcium: 100 } },
  { name: "Peanuts", qty: "50 g", cost: 15, tags: ["protein", "fiber"], nutrition: { calories: 280, protein: 13, fiber: 4, iron: 1.5, calcium: 30 } },
];

const CHEAT_PRIORITIES = [
  { id: "protein", label: "Protein-forward" },
  { id: "light", label: "Lighter version" },
  { id: "balance", label: "Balance the crash" },
  { id: "enjoy", label: "Just enjoy it" },
];

const CHEAT_ITEMS = [
  { name: "Butter Chicken + Naan", calories: 650, tips: { protein: "Ask for extra chicken, go light on the naan.", light: "Request less butter and cream in the gravy.", balance: "Add a cucumber-onion salad to slow the carb spike.", enjoy: "Get the full butter naan — no notes." } },
  { name: "Pav Bhaji", calories: 520, tips: { protein: "Add a side of paneer or extra butter-tossed chana.", light: "One pav instead of two, extra veg in the bhaji.", balance: "Squeeze extra lemon and add raw onion on top.", enjoy: "Extra butter, as it should be." } },
  { name: "Gulab Jamun", calories: 300, tips: { protein: "Have it right after a protein-heavy meal, not alone.", light: "Stick to one piece, go easy on the syrup.", balance: "Pair with a small bowl of curd to slow the sugar hit.", enjoy: "Two pieces, warm, no guilt." } },
  { name: "Momos (fried)", calories: 420, tips: { protein: "Pick chicken or paneer filling over veg.", light: "Go steamed instead of fried.", balance: "Have it with the vinegar-chilli dip, not mayo.", enjoy: "Fried, extra chutney, done." } },
  { name: "Loaded Cheese Fries", calories: 580, tips: { protein: "Add a grilled chicken topping.", light: "Order a half portion and share the rest.", balance: "Eat slowly with water — this one's rich.", enjoy: "Full loaded, extra cheese." } },
  { name: "Chocolate Lava Cake", calories: 410, tips: { protein: "Ask for a scoop of Greek yogurt instead of ice cream.", light: "Split it two ways.", balance: "Have it after a meal, not on an empty stomach.", enjoy: "Get the ice cream too." } },
];

const GOAL_PRESETS = {
  maintain: { label: "Maintain", calories: 2000, protein: 60, carbs: 250, fat: 65 },
  muscle: { label: "Muscle gain", calories: 2400, protein: 110, carbs: 280, fat: 70 },
  lean: { label: "Weight loss", calories: 1600, protein: 90, carbs: 150, fat: 50 },
};
const MICRO_RDA = { fiber: 30, iron: 18, calcium: 1000 };
const GAP_NUTRIENTS = ["protein", "fiber", "iron", "calcium"];

const WEEKLY_BUDGET = 1500;

const VENDORS = [
  { id: "blinkit", name: "Blinkit", tone: "bg-yellow-500", url: "https://blinkit.com/" },
  { id: "zepto", name: "Zepto", tone: "bg-purple-700", url: "https://www.zeptonow.com/" },
  { id: "instamart", name: "Instamart", tone: "bg-orange-600", url: "https://www.swiggy.com/instamart" },
];

const STRINGS = {
  en: { greeting: "Namaste, Sid", tagline: "Aaj kya banega?", nav: { today: "Today", discover: "Discover", grocery: "Grocery", cook: "Cook", profile: "Profile" } },
  hi: { greeting: "नमस्ते, Sid", tagline: "आज क्या बनेगा?", nav: { today: "आज", discover: "खोजें", grocery: "राशन", cook: "पकाएँ", profile: "प्रोफ़ाइल" } },
};

const STORAGE_KEY = "rasoi-state-v2";
const defaultState = {
  checkedItems: {}, saved: [], discoverIdx: 0, activeMember: "you", vendor: "blinkit",
  cookDishId: null, lang: "en", targets: { ...GOAL_PRESETS.maintain, ...MICRO_RDA }, goalPreset: "maintain",
  addedExtras: [], cheatMode: false, cheatPriority: "balance",
};

/* ------------------------------- HELPERS ------------------------------ */

function sumNutrition(list) {
  return list.reduce((acc, item) => {
    const n = item.nutrition || {};
    Object.keys(n).forEach((k) => { acc[k] = (acc[k] || 0) + n[k]; });
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, iron: 0, calcium: 0 });
}

/* ------------------------------- SUBCOMPONENTS ------------------------------ */

const Tag = ({ children, tone = "turmeric" }) => {
  const dot = { turmeric: "bg-amber-500", maroon: "bg-red-900", curry: "bg-emerald-800", stone: "bg-stone-400" }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-700">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
};

const SpiceFlames = ({ level }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4].map((n) => (
      <Flame key={n} size={13} className={n <= level ? "text-red-600 fill-red-600" : "text-stone-300 fill-stone-200"} />
    ))}
  </span>
);

const VendorIcon = ({ type }) => {
  const cls = "h-4 w-4";
  if (type === "kirana") return <ShoppingCart className={cls} />;
  if (type === "sabzi") return <Leaf className={cls} />;
  if (type === "dairy") return <IndianRupee className={cls} />;
  return <Sparkles className={cls} />;
};

const SectionLabel = ({ children }) => (
  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
    {children}
  </p>
);

const NutrientBar = ({ label, value, target, unit, tone = "amber" }) => {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const barTone = { amber: "bg-amber-500", emerald: "bg-emerald-700", red: "bg-red-800", purple: "bg-purple-700" }[tone];
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-stone-600">
        <span>{label}</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{Math.round(value)}{unit} / {Math.round(target)}{unit}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${barTone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/* ---------------------------------- SCREENS --------------------------------- */

function TodayScreen({ lang, setLang, setCookDish, setTab, activeMember, setActiveMember }) {
  const s = STRINGS[lang];
  const [leftover, setLeftover] = useState("");
  const [suggestion, setSuggestion] = useState(null);

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-stone-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-2xl text-stone-900" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{s.greeting}</h1>
          <p className="text-sm text-stone-500 italic">{s.tagline}</p>
        </div>
        <button onClick={() => setLang(lang === "en" ? "hi" : "en")} className="flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600">
          <Globe size={13} /> {lang === "en" ? "हिंदी" : "English"}
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-red-900 px-4 py-3 text-amber-50">
        <CalendarDays size={20} className="shrink-0" />
        <p className="text-sm"><span className="font-semibold">Navratri begins in 4 days.</span> 12 vrat-friendly recipes are ready when you are.</p>
      </div>

      <div>
        <SectionLabel>Cooking for</SectionLabel>
        <div className="flex gap-2">
          {HOUSEHOLD.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMember(m.id)}
              className={`rounded-full px-3 py-1.5 text-sm border ${activeMember === m.id ? "bg-stone-900 text-amber-50 border-stone-900" : "bg-white text-stone-600 border-stone-200"}`}
            >
              {m.name}
              {m.note && <span className="ml-1.5 text-[10px] opacity-70">· {m.note}</span>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Today's thali</SectionLabel>
        <div className="flex flex-col gap-3">
          {TODAY_PLAN.map((item) => (
            <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{item.meal} · {item.time}</p>
                <span className="flex items-center gap-1 text-xs text-stone-500" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  <IndianRupee size={11} />{item.cost}
                </span>
              </div>
              <h3 className="mt-1 text-lg text-stone-900" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{item.dish}</h3>
              <p className="mt-0.5 text-xs text-stone-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{item.nutrition.calories} kcal per serving</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.tags.map((t) => <Tag key={t} tone="curry">{t}</Tag>)}
              </div>
              <button onClick={() => { setCookDish(item.id); setTab("cook"); }} className="mt-3 flex items-center gap-1 text-sm font-medium text-red-900">
                Start cooking <ChevronRight size={15} />
              </button>
            </div>
          ))}
        </div>
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
          <button
            onClick={() => setSuggestion(leftover.trim() ? `Turn it into tomorrow's paratha filling — mash it with a little besan and roll it in.` : null)}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm text-amber-50"
          >
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

function DiscoverScreen({ idx, setIdx, saved, setSaved, cheatMode, setCheatMode, cheatPriority, setCheatPriority }) {
  const done = idx >= DISCOVER_RECIPES.length;
  const dish = !done ? DISCOVER_RECIPES[idx] : null;
  const skip = () => setIdx(idx + 1);
  const save = () => { setSaved([...saved, dish.name]); setIdx(idx + 1); };

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-stone-900" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Discover</h1>
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
              <p className="text-xs text-stone-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{idx + 1} of {DISCOVER_RECIPES.length}</p>
              <div className="rounded-3xl border border-stone-200 bg-white overflow-hidden">
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-amber-400 to-red-800">
                  <ChefHat size={44} className="text-amber-50 opacity-90" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{dish.region} · {dish.diet}</p>
                    <SpiceFlames level={dish.spice} />
                  </div>
                  <h2 className="mt-1 text-xl text-stone-900" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{dish.name}</h2>
                  <div className="mt-2 flex items-center gap-4 text-sm text-stone-500">
                    <span className="flex items-center gap-1"><Clock size={14} />{dish.time} min</span>
                    <span className="flex items-center gap-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}><IndianRupee size={13} />{dish.cost}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">{dish.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-stone-600">
                    <Users size={14} className="mt-0.5 shrink-0 text-stone-500" />
                    <div>
                      <p><span className="font-medium text-stone-800">Good for:</span> {dish.goodFor.join(", ")}</p>
                      {dish.caution && <p className="mt-1 flex items-start gap-1 text-red-800"><AlertCircle size={12} className="mt-0.5 shrink-0" /> {dish.caution}</p>}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button onClick={skip} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-stone-300 py-2.5 text-stone-600"><X size={18} /> Skip</button>
                    <button onClick={save} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-900 py-2.5 text-amber-50"><Heart size={18} /> Save</button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-stone-300 py-14 text-center">
              <Sparkles className="text-amber-600" />
              <p className="text-sm font-medium text-stone-700">You've been through today's picks.</p>
              <p className="text-xs text-stone-400">Saved {saved.length} · check back tomorrow for more</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div>
            <SectionLabel>Today, prioritize</SectionLabel>
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
                  <h3 className="text-base text-stone-900" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{item.name}</h3>
                  <span className="text-xs text-stone-500" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{item.calories} kcal</span>
                </div>
                <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-stone-700">
                  <Info size={13} className="mt-0.5 shrink-0 text-amber-700" />
                  {item.tips[cheatPriority]}
                </div>
                <button onClick={() => setSaved([...saved, item.name])} className="mt-3 flex items-center gap-1 text-sm font-medium text-red-900">
                  <Heart size={15} /> Save for this weekend
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GroceryScreen({ checked, setChecked, vendor, setVendor, targets, addedExtras, setAddedExtras }) {
  const [copyState, setCopyState] = useState("idle");
  const [sentWhatsapp, setSentWhatsapp] = useState(false);

  const extrasItems = addedExtras.map((name) => ADDON_ITEMS.find((a) => a.name === name)).filter(Boolean);
  const baseItems = GROCERY.flatMap((g) => g.items);
  const allItems = [...baseItems, ...extrasItems];
  const total = allItems.reduce((a, i) => a + i.cost, 0);
  const gotTotal = allItems.filter((i) => checked[i.name]).reduce((a, i) => a + i.cost, 0);
  const missing = allItems.filter((i) => !checked[i.name]);
  const toggle = (name) => setChecked({ ...checked, [name]: !checked[name] });
  const activeVendor = VENDORS.find((v) => v.id === vendor);

  const todayTotals = sumNutrition(TODAY_PLAN);
  const extrasTotals = sumNutrition(extrasItems);
  const combined = {
    calories: todayTotals.calories + extrasTotals.calories,
    protein: todayTotals.protein + extrasTotals.protein,
    carbs: todayTotals.carbs + extrasTotals.carbs,
    fat: todayTotals.fat + extrasTotals.fat,
    fiber: todayTotals.fiber + extrasTotals.fiber,
    iron: todayTotals.iron + extrasTotals.iron,
    calcium: todayTotals.calcium + extrasTotals.calcium,
  };

  const gapScores = GAP_NUTRIENTS.map((k) => ({ key: k, gap: Math.max(0, 1 - combined[k] / (targets[k] || 1)) }))
    .sort((a, b) => b.gap - a.gap);
  const topGapKeys = gapScores.slice(0, 3).map((g) => g.key);
  const recommended = ADDON_ITEMS
    .filter((a) => !addedExtras.includes(a.name))
    .map((a) => ({ ...a, score: a.tags.filter((t) => topGapKeys.includes(t)).length }))
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const handleOrder = async () => {
    const list = missing.map((i) => `${i.name} (${i.qty})`).join(", ");
    try {
      if (navigator.clipboard && missing.length) {
        await navigator.clipboard.writeText(list);
        setCopyState("copied");
      }
    } catch {
      setCopyState("error");
    } finally {
      window.open(activeVendor.url, "_blank", "noopener,noreferrer");
      setTimeout(() => setCopyState("idle"), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-5">
      <h1 className="text-2xl text-stone-900" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Grocery</h1>

      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">This week's list</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-stone-800">₹{gotTotal} of ₹{total}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-emerald-700" style={{ width: `${Math.min(100, (gotTotal / total) * 100)}%` }} />
        </div>
        <p className="mt-1 text-xs text-stone-400">Budget ₹{WEEKLY_BUDGET}/week · ₹{WEEKLY_BUDGET - total} left after this list</p>
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
          {[["Fiber", "fiber", "g"], ["Iron", "iron", "mg"], ["Calcium", "calcium", "mg"]].map(([label, key, unit]) => (
            <div key={key} className="rounded-xl bg-amber-50 py-2">
              <p className="text-xs font-semibold text-stone-800" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{Math.round(combined[key])}{unit}</p>
              <p className="text-[10px] text-stone-500">{label} · {Math.round((combined[key] / targets[key]) * 100)}%</p>
            </div>
          ))}
        </div>
      </div>

      {recommended.length > 0 && (
        <div>
          <SectionLabel>Fill the gap</SectionLabel>
          <div className="flex flex-col gap-2">
            {recommended.map((item) => (
              <div key={item.name} className="flex items-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-800">{item.name} <span className="text-xs font-normal text-stone-400">· {item.qty}</span></p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.tags.map((t) => <Tag key={t} tone="maroon">{t}</Tag>)}
                  </div>
                </div>
                <button onClick={() => setAddedExtras([...addedExtras, item.name])} className="flex items-center gap-1 rounded-full bg-stone-900 px-3 py-1.5 text-xs text-amber-50">
                  <Plus size={13} /> ₹{item.cost}
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
              onClick={() => setVendor(v.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium ${vendor === v.id ? `${v.tone} text-white` : "border border-stone-200 bg-white text-stone-600"}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${vendor === v.id ? "bg-white" : v.tone}`} />
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {GROCERY.map((group) => (
        <div key={group.vendor}>
          <div className="mb-2 flex items-center gap-2"><VendorIcon type={group.icon} /><SectionLabel>{group.vendor}</SectionLabel></div>
          <div className="rounded-2xl border border-stone-200 bg-white divide-y divide-stone-100">
            {group.items.map((item) => (
              <label key={item.name} className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => toggle(item.name)} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked[item.name] ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300"}`}>
                  {checked[item.name] && <Check size={13} />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${checked[item.name] ? "text-stone-400 line-through" : "text-stone-800"}`}>{item.name}</p>
                  <p className="text-xs text-stone-400">{item.qty}</p>
                </div>
                <span className="text-xs text-stone-500" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>₹{item.cost}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {extrasItems.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4" /><SectionLabel>Added to close nutrition gaps</SectionLabel></div>
          <div className="rounded-2xl border border-stone-200 bg-white divide-y divide-stone-100">
            {extrasItems.map((item) => (
              <div key={item.name} className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => toggle(item.name)} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked[item.name] ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300"}`}>
                  {checked[item.name] && <Check size={13} />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${checked[item.name] ? "text-stone-400 line-through" : "text-stone-800"}`}>{item.name}</p>
                  <p className="text-xs text-stone-400">{item.qty}</p>
                </div>
                <span className="text-xs text-stone-500" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>₹{item.cost}</span>
                <button onClick={() => setAddedExtras(addedExtras.filter((n) => n !== item.name))} className="text-stone-300">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => { setSentWhatsapp(true); setTimeout(() => setSentWhatsapp(false), 2000); }}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-stone-300 py-2.5 text-sm text-stone-700"
        >
          {sentWhatsapp ? <><Check size={16} className="text-emerald-700" /> Sent</> : <><MessageCircle size={16} /> Send to cook</>}
        </button>
        <button onClick={handleOrder} className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm text-white ${activeVendor.tone}`}>
          {copyState === "copied" ? <><Copy size={15} /> Copied — paste in {activeVendor.name}</> : <><ExternalLink size={15} /> Open {activeVendor.name}</>}
        </button>
      </div>
      <p className="text-center text-[11px] text-stone-400 -mt-2">
        {missing.length} item{missing.length !== 1 ? "s" : ""} left to buy · copies to clipboard, since {activeVendor.name} doesn't support direct cart hand-off yet
      </p>
    </div>
  );
}

function CookScreen({ cookDishId, setCookDishId }) {
  const [checkedSteps, setCheckedSteps] = useState({});
  const [voiceOn, setVoiceOn] = useState(false);
  const [portion, setPortion] = useState(1);
  const cookDish = TODAY_PLAN.find((d) => d.id === cookDishId) || null;

  if (!cookDish) {
    return (
      <div className="flex flex-col gap-4 px-4 pb-6 pt-5">
        <h1 className="text-2xl text-stone-900" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Cook</h1>
        <p className="text-sm text-stone-500">Pick a dish from today's thali to start.</p>
        <div className="flex flex-col gap-3">
          {TODAY_PLAN.map((item) => (
            <button key={item.id} onClick={() => setCookDishId(item.id)} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 text-left">
              <div>
                <p className="text-xs font-semibold uppercase text-amber-700">{item.meal}</p>
                <p className="text-base text-stone-900" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{item.dish}</p>
              </div>
              <ChevronRight size={18} className="text-stone-400" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const toggleStep = (key) => setCheckedSteps({ ...checkedSteps, [key]: !checkedSteps[key] });
  const n = cookDish.nutrition;

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-5">
      <div className="flex items-center gap-2">
        <button onClick={() => { setCookDishId(null); setCheckedSteps({}); setPortion(1); }} className="rounded-full border border-stone-200 p-1.5"><ChevronLeft size={16} /></button>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase text-amber-700">{cookDish.meal} · serve {cookDish.time}</p>
          <h1 className="text-xl text-stone-900" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{cookDish.dish}</h1>
        </div>
        <button onClick={() => setVoiceOn(!voiceOn)} className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${voiceOn ? "bg-red-900 text-amber-50" : "border border-stone-200 text-stone-600"}`}>
          <Mic size={13} /> {voiceOn ? "Voice on" : "Voice off"}
        </button>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <SectionLabel>Your portion</SectionLabel>
          <div className="flex items-center gap-3">
            <button onClick={() => setPortion(Math.max(0.5, portion - 0.5))} className="rounded-full border border-stone-300 p-1"><Minus size={13} /></button>
            <span className="w-10 text-center text-sm text-stone-800" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{portion}×</span>
            <button onClick={() => setPortion(Math.min(3, portion + 0.5))} className="rounded-full border border-stone-300 p-1"><Plus size={13} /></button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <div><p className="text-sm font-semibold text-stone-800" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{Math.round(n.calories * portion)}</p><p className="text-[10px] text-stone-400">kcal</p></div>
          <div><p className="text-sm font-semibold text-stone-800" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{Math.round(n.protein * portion)}g</p><p className="text-[10px] text-stone-400">protein</p></div>
          <div><p className="text-sm font-semibold text-stone-800" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{Math.round(n.carbs * portion)}g</p><p className="text-[10px] text-stone-400">carbs</p></div>
          <div><p className="text-sm font-semibold text-stone-800" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{Math.round(n.fat * portion)}g</p><p className="text-[10px] text-stone-400">fat</p></div>
        </div>
        <p className="mt-2 text-center text-[11px] text-stone-400">Based on 1 standard serving at {portion}× — adjust to match what's actually on your plate.</p>
      </div>

      {cookDish.parallel ? (
        <div className="grid grid-cols-2 gap-3">
          {cookDish.tracks.map((track) => (
            <div key={track.label} className="rounded-2xl border border-stone-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-900">{track.label}</p>
              <p className="text-[11px] text-stone-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>start {track.start}</p>
              <div className="mt-2 flex flex-col gap-2">
                {track.steps.map((step, i) => {
                  const key = `${track.label}-${i}`;
                  return (
                    <button key={key} onClick={() => toggleStep(key)} className="flex items-start gap-2 text-left">
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${checkedSteps[key] ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300"}`}>
                        {checkedSteps[key] && <Check size={10} />}
                      </span>
                      <span>
                        <span className={`text-xs font-medium ${checkedSteps[key] ? "text-stone-400 line-through" : "text-stone-800"}`}>{step.title}</span>
                        <p className="text-[11px] text-stone-500">{step.detail}</p>
                        {step.timer && <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-700" style={{ fontFamily: "'IBM Plex Mono', monospace" }}><Clock size={10} /> {Math.round(step.timer / 60)} min</span>}
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
          {cookDish.steps.map((step, i) => {
            const key = `s-${i}`;
            return (
              <button key={key} onClick={() => toggleStep(key)} className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${checkedSteps[key] ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 text-stone-500"}`}>
                  {checkedSteps[key] ? <Check size={13} /> : i + 1}
                </span>
                <span>
                  <span className={`text-sm font-medium ${checkedSteps[key] ? "text-stone-400 line-through" : "text-stone-900"}`}>{step.title}</span>
                  <p className="mt-0.5 text-xs text-stone-500">{step.detail}</p>
                  {step.timer && <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700" style={{ fontFamily: "'IBM Plex Mono', monospace" }}><Clock size={12} /> {Math.round(step.timer / 60)} min timer</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfileScreen({ targets, setTargets, goalPreset, setGoalPreset, onReset }) {
  const applyPreset = (id) => {
    setGoalPreset(id);
    setTargets({ ...targets, ...GOAL_PRESETS[id] });
  };
  const field = (key, label, unit) => (
    <div>
      <label className="text-xs text-stone-500">{label} ({unit})</label>
      <input
        type="number"
        value={targets[key]}
        onChange={(e) => setTargets({ ...targets, [key]: Number(e.target.value) || 0 })}
        className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-amber-600"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-5 px-4 pb-6 pt-5">
      <h1 className="text-2xl text-stone-900" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Profile</h1>

      <div>
        <SectionLabel>Goal</SectionLabel>
        <div className="flex gap-2">
          {Object.entries(GOAL_PRESETS).map(([id, p]) => (
            <button
              key={id}
              onClick={() => applyPreset(id)}
              className={`flex-1 rounded-full py-2 text-xs font-medium ${goalPreset === id ? "bg-stone-900 text-amber-50" : "border border-stone-200 bg-white text-stone-600"}`}
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

      <button onClick={onReset} className="flex items-center justify-center gap-2 rounded-full border border-stone-300 py-2.5 text-sm text-stone-600">
        <RotateCcw size={15} /> Reset all demo data
      </button>
    </div>
  );
}

/* ----------------------------------- APP ----------------------------------- */

export default function RasoiApp() {
  const [tab, setTab] = useState("today");
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [lang, setLang] = useState(defaultState.lang);
  const [discoverIdx, setDiscoverIdx] = useState(defaultState.discoverIdx);
  const [saved, setSaved] = useState(defaultState.saved);
  const [checkedItems, setCheckedItems] = useState(defaultState.checkedItems);
  const [activeMember, setActiveMember] = useState(defaultState.activeMember);
  const [vendor, setVendor] = useState(defaultState.vendor);
  const [cookDishId, setCookDishId] = useState(defaultState.cookDishId);
  const [targets, setTargets] = useState(defaultState.targets);
  const [goalPreset, setGoalPreset] = useState(defaultState.goalPreset);
  const [addedExtras, setAddedExtras] = useState(defaultState.addedExtras);
  const [cheatMode, setCheatMode] = useState(defaultState.cheatMode);
  const [cheatPriority, setCheatPriority] = useState(defaultState.cheatPriority);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY, false);
        if (result?.value) {
          const p = JSON.parse(result.value);
          setLang(p.lang ?? defaultState.lang);
          setDiscoverIdx(p.discoverIdx ?? defaultState.discoverIdx);
          setSaved(p.saved ?? defaultState.saved);
          setCheckedItems(p.checkedItems ?? defaultState.checkedItems);
          setActiveMember(p.activeMember ?? defaultState.activeMember);
          setVendor(p.vendor ?? defaultState.vendor);
          setCookDishId(p.cookDishId ?? defaultState.cookDishId);
          setTargets(p.targets ?? defaultState.targets);
          setGoalPreset(p.goalPreset ?? defaultState.goalPreset);
          setAddedExtras(p.addedExtras ?? defaultState.addedExtras);
          setCheatMode(p.cheatMode ?? defaultState.cheatMode);
          setCheatPriority(p.cheatPriority ?? defaultState.cheatPriority);
        }
      } catch {
        // No saved state yet — defaults stand.
      } finally {
        hasLoadedOnce.current = true;
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hasLoadedOnce.current) return;
    const state = { lang, discoverIdx, saved, checkedItems, activeMember, vendor, cookDishId, targets, goalPreset, addedExtras, cheatMode, cheatPriority };
    (async () => {
      try {
        const result = await window.storage.set(STORAGE_KEY, JSON.stringify(state), false);
        setSaveError(!result);
      } catch {
        setSaveError(true);
      }
    })();
  }, [lang, discoverIdx, saved, checkedItems, activeMember, vendor, cookDishId, targets, goalPreset, addedExtras, cheatMode, cheatPriority]);

  const resetData = async () => {
    try { await window.storage.delete(STORAGE_KEY, false); } catch {}
    setLang(defaultState.lang);
    setDiscoverIdx(defaultState.discoverIdx);
    setSaved(defaultState.saved);
    setCheckedItems(defaultState.checkedItems);
    setActiveMember(defaultState.activeMember);
    setVendor(defaultState.vendor);
    setCookDishId(defaultState.cookDishId);
    setTargets(defaultState.targets);
    setGoalPreset(defaultState.goalPreset);
    setAddedExtras(defaultState.addedExtras);
    setCheatMode(defaultState.cheatMode);
    setCheatPriority(defaultState.cheatPriority);
  };

  const s = STRINGS[lang];
  const navItems = [
    { id: "today", label: s.nav.today, icon: Home },
    { id: "discover", label: s.nav.discover, icon: Search },
    { id: "grocery", label: s.nav.grocery, icon: ShoppingCart },
    { id: "cook", label: s.nav.cook, icon: ChefHat },
    { id: "profile", label: s.nav.profile, icon: User },
  ];

  return (
    <div className="min-h-screen w-full bg-stone-100 flex items-center justify-center p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>
      <div className="w-full max-w-[400px] rounded-[2.5rem] border-8 border-stone-900 bg-amber-50 shadow-2xl overflow-hidden" style={{ fontFamily: "'Manrope', sans-serif" }}>
        <div className="h-[720px] overflow-y-auto relative">
          {!loaded ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-stone-400">
              <Loader2 className="animate-spin" />
              <p className="text-xs">Loading your kitchen...</p>
            </div>
          ) : (
            <>
              {tab === "today" && (
                <TodayScreen lang={lang} setLang={setLang} setCookDish={setCookDishId} setTab={setTab} activeMember={activeMember} setActiveMember={setActiveMember} />
              )}
              {tab === "discover" && (
                <DiscoverScreen idx={discoverIdx} setIdx={setDiscoverIdx} saved={saved} setSaved={setSaved} cheatMode={cheatMode} setCheatMode={setCheatMode} cheatPriority={cheatPriority} setCheatPriority={setCheatPriority} />
              )}
              {tab === "grocery" && (
                <GroceryScreen checked={checkedItems} setChecked={setCheckedItems} vendor={vendor} setVendor={setVendor} targets={targets} addedExtras={addedExtras} setAddedExtras={setAddedExtras} />
              )}
              {tab === "cook" && <CookScreen cookDishId={cookDishId} setCookDishId={setCookDishId} />}
              {tab === "profile" && (
                <ProfileScreen targets={targets} setTargets={setTargets} goalPreset={goalPreset} setGoalPreset={setGoalPreset} onReset={resetData} />
              )}
              {saveError && (
                <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-red-800 px-3 py-1.5 text-center text-[11px] text-amber-50">
                  Couldn't save your changes — they may not persist.
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex border-t border-stone-200 bg-white">
          {navItems.map((n) => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)} className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] ${active ? "text-red-900" : "text-stone-400"}`}>
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                {n.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
