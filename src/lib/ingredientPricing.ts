import type { Ingredient } from "@/lib/database.types";

// There's no public Blinkit/Zepto/Instamart pricing API (see README non-goals),
// so ingredient costs are simulated: a curated kirana-baseline price per
// common ingredient, run through a per-vendor markup. Unknown ingredients
// fall back to a stable, name-derived estimate rather than a random one, so
// the same ingredient always shows the same price on re-render.
const BASE_PRICE: Record<string, number> = {
  "flattened rice": 15,
  poha: 15,
  onion: 10,
  onions: 10,
  "mustard seeds": 8,
  "curry leaves": 5,
  "green chilli": 8,
  turmeric: 10,
  lemon: 5,
  "moong dal": 25,
  rice: 20,
  besan: 15,
  curd: 20,
  jeera: 10,
  "methi seeds": 6,
  hing: 5,
  ghee: 40,
  paneer: 40,
  "wheat flour": 20,
  capsicum: 15,
  tomato: 12,
  tomatoes: 12,
  chicken: 120,
  "ginger-garlic paste": 15,
  sabudana: 20,
  peanuts: 15,
  potato: 12,
  "mixed vegetables": 40,
  coconut: 25,
};

export const VENDOR_MULTIPLIER: Record<"blinkit" | "zepto" | "instamart", number> = {
  blinkit: 1.05,
  zepto: 1.1,
  instamart: 0.98,
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.+?\)/g, "")
    .trim();
}

function hashFallback(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return 10 + (hash % 26); // ₹10–₹35, stable per name
}

function basePrice(name: string): number {
  const n = normalize(name);
  if (BASE_PRICE[n] !== undefined) return BASE_PRICE[n];
  const key = Object.keys(BASE_PRICE).find((k) => n.includes(k) || k.includes(n));
  if (key) return BASE_PRICE[key];
  return hashFallback(n);
}

export function estimateIngredientCost(name: string, vendor: "blinkit" | "zepto" | "instamart"): number {
  return Math.round(basePrice(name) * VENDOR_MULTIPLIER[vendor]);
}

export type AggregatedIngredient = { key: string; name: string; qty: string; unit: string; recipes: string[] };

// Merges the same ingredient (by name+unit) across today's recipes, summing
// numeric quantities where possible so "Ghee, 1 tsp" (khichdi) + "Ghee, 2
// tbsp" (paratha) doesn't show as two separate rows. `key` is stable across
// renders/days for the same ingredient+unit, so it doubles as the id used to
// persist checked state.
export function aggregateIngredients(recipes: { name: string; ingredients: Ingredient[] }[]): AggregatedIngredient[] {
  const byKey = new Map<string, AggregatedIngredient>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients || []) {
      const key = `ing:${normalize(ing.name)}|${ing.unit}`;
      const existing = byKey.get(key);
      if (existing) {
        const a = Number(existing.qty);
        const b = Number(ing.qty);
        existing.qty = !Number.isNaN(a) && !Number.isNaN(b) ? String(a + b) : `${existing.qty} + ${ing.qty}`;
        if (!existing.recipes.includes(recipe.name)) existing.recipes.push(recipe.name);
      } else {
        byKey.set(key, { key, name: ing.name, qty: ing.qty, unit: ing.unit, recipes: [recipe.name] });
      }
    }
  }

  return Array.from(byKey.values());
}
