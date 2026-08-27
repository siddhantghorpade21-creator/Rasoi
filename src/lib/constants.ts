import type { DietPreference, Nutrition } from "@/lib/database.types";

export const GOAL_PRESETS: Record<string, { label: string; calories: number; protein: number; carbs: number; fat: number }> = {
  maintain: { label: "Maintain", calories: 2000, protein: 60, carbs: 250, fat: 65 },
  muscle: { label: "Muscle gain", calories: 2400, protein: 110, carbs: 280, fat: 70 },
  lean: { label: "Weight loss", calories: 1600, protein: 90, carbs: 150, fat: 50 },
};

export const MICRO_RDA = { fiber: 30, iron: 18, calcium: 1000 };
export const GAP_NUTRIENTS = ["protein", "fiber", "iron", "calcium"] as const;

export const DIET_OPTIONS: { id: DietPreference; label: string; hint: string }[] = [
  { id: "veg", label: "Veg", hint: "No eggs, no meat, no fish" },
  { id: "egg", label: "Egg", hint: "Veg + eggs, no meat or fish" },
  { id: "non-veg", label: "Non-veg", hint: "Everything, including meat and fish" },
];

export const REGION_OPTIONS = ["North Indian", "South Indian", "North Eastern", "Gujarati", "Rajasthani"] as const;

export const VENDORS = [
  { id: "blinkit", name: "Blinkit", tone: "bg-yellow-500", url: "https://blinkit.com/" },
  { id: "zepto", name: "Zepto", tone: "bg-purple-700", url: "https://www.zeptonow.com/" },
  { id: "instamart", name: "Instamart", tone: "bg-orange-600", url: "https://www.swiggy.com/instamart" },
] as const;

export const CHEAT_PRIORITIES = [
  { id: "protein", label: "Protein-forward" },
  { id: "light", label: "Lighter version" },
  { id: "balance", label: "Balance the crash" },
  { id: "enjoy", label: "Just enjoy it" },
] as const;

export const CHEAT_ITEMS = [
  { name: "Butter Chicken + Naan", calories: 650, tips: { protein: "Ask for extra chicken, go light on the naan.", light: "Request less butter and cream in the gravy.", balance: "Add a cucumber-onion salad to slow the carb spike.", enjoy: "Get the full butter naan — no notes." } },
  { name: "Pav Bhaji", calories: 520, tips: { protein: "Add a side of paneer or extra butter-tossed chana.", light: "One pav instead of two, extra veg in the bhaji.", balance: "Squeeze extra lemon and add raw onion on top.", enjoy: "Extra butter, as it should be." } },
  { name: "Gulab Jamun", calories: 300, tips: { protein: "Have it right after a protein-heavy meal, not alone.", light: "Stick to one piece, go easy on the syrup.", balance: "Pair with a small bowl of curd to slow the sugar hit.", enjoy: "Two pieces, warm, no guilt." } },
  { name: "Momos (fried)", calories: 420, tips: { protein: "Pick chicken or paneer filling over veg.", light: "Go steamed instead of fried.", balance: "Have it with the vinegar-chilli dip, not mayo.", enjoy: "Fried, extra chutney, done." } },
  { name: "Loaded Cheese Fries", calories: 580, tips: { protein: "Add a grilled chicken topping.", light: "Order a half portion and share the rest.", balance: "Eat slowly with water — this one's rich.", enjoy: "Full loaded, extra cheese." } },
  { name: "Chocolate Lava Cake", calories: 410, tips: { protein: "Ask for a scoop of Greek yogurt instead of ice cream.", light: "Split it two ways.", balance: "Have it after a meal, not on an empty stomach.", enjoy: "Get the ice cream too." } },
] as const;

export const STRINGS = {
  en: { greeting: "Namaste", tagline: "Aaj kya banega?", nav: { today: "Today", discover: "Discover", grocery: "Grocery", cook: "Cook", profile: "Profile" } },
  hi: { greeting: "नमस्ते", tagline: "आज क्या बनेगा?", nav: { today: "आज", discover: "खोजें", grocery: "राशन", cook: "पकाएँ", profile: "प्रोफ़ाइल" } },
} as const;

export function sumNutrition(list: { nutrition?: Partial<Nutrition> | null; portion?: number }[]): Nutrition {
  return list.reduce(
    (acc, item) => {
      const n = item.nutrition || {};
      const p = item.portion ?? 1;
      (Object.keys(n) as (keyof Nutrition)[]).forEach((k) => {
        acc[k] = (acc[k] || 0) + (n[k] || 0) * p;
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, iron: 0, calcium: 0 } as Nutrition
  );
}

// 'non-veg' eats everything; 'egg' adds eggs on top of veg; 'veg' excludes
// both. Vrat/fasting dishes are always veg-compatible regardless of pref.
export function dietAllowed(recipeDiet: string | null, pref: DietPreference | null): boolean {
  if (!pref || pref === "non-veg") return true;
  if (recipeDiet === "Vrat / Fasting") return true;
  if (pref === "egg") return recipeDiet !== "Non-veg";
  return recipeDiet === "Veg";
}

// Per-unit estimates for the "roti ya chawal?" counter on Today — these feed
// the nutrition calculator only, never the grocery/ingredient list (atta and
// rice are staples people already keep stocked, not a per-dish shopping need).
export const ROTI_NUTRITION: Nutrition = { calories: 100, protein: 3, carbs: 18, fat: 2.5, fiber: 2, iron: 1, calcium: 10 };
export const RICE_CUP_NUTRITION: Nutrition = { calories: 200, protein: 4, carbs: 45, fat: 0.4, fiber: 0.6, iron: 0.8, calcium: 10 };

export function staplesNutrition(rotiCount: number, riceCups: number): Nutrition {
  const keys = Object.keys(ROTI_NUTRITION) as (keyof Nutrition)[];
  return keys.reduce((acc, k) => {
    acc[k] = ROTI_NUTRITION[k] * rotiCount + RICE_CUP_NUTRITION[k] * riceCups;
    return acc;
  }, {} as Nutrition);
}
