import type { Database } from "@/lib/database.types";

type Member = Database["public"]["Tables"]["household_members"]["Row"];
type Recipe = Database["public"]["Tables"]["recipes"]["Row"];

export type FitResult = { goodFor: string[]; cautions: string[] };

// Matches each household member's free-text dietary note against a recipe's
// tags/spice level — there's no fixed vocabulary, so this is a small set of
// keyword heuristics rather than an exact match.
export function computeHouseholdFit(recipe: Recipe, members: Member[]): FitResult {
  const goodFor: string[] = [];
  const cautions: string[] = [];
  const hasOnionGarlic = recipe.tags?.some((t) => t.toLowerCase().includes("onion-garlic")) ?? false;

  for (const member of members) {
    const note = (member.note || "").toLowerCase();
    const issues: string[] = [];

    if (note.includes("onion") || note.includes("garlic")) {
      if (hasOnionGarlic) issues.push("has onion-garlic");
    }
    if ((note.includes("mild") || note.includes("spice")) && (recipe.spice_level ?? 0) >= 3) {
      issues.push("quite spicy");
    }
    if (note.includes("veg") && !note.includes("non-veg") && recipe.diet === "Non-veg") {
      issues.push("non-veg");
    }

    if (issues.length > 0) {
      cautions.push(`${member.name}: ${issues.join(", ")}`);
    } else {
      goodFor.push(member.name);
    }
  }

  return { goodFor, cautions };
}
