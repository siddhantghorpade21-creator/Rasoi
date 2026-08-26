// Hand-written to match supabase/migrations/0001_init.sql. If you change the
// schema, regenerate this with the Supabase CLI instead:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

export type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  iron: number;
  calcium: number;
};

export type RecipeStep = {
  title: string;
  detail: string;
  timer_seconds: number | null;
};

export type RecipeTrack = {
  label: string;
  start: string;
  steps: RecipeStep[];
};

export type Ingredient = { name: string; qty: string; unit: string };

export type DietPreference = "veg" | "egg" | "non-veg";

type ProfileRow = {
  id: string;
  display_name: string | null;
  language: "en" | "hi";
  active_member_id: string | null;
  diet_preference: DietPreference | null;
  region_preferences: string[];
  region_preference_other: string | null;
  onboarding_completed: boolean;
  created_at: string;
};

type HouseholdMemberRow = { id: string; user_id: string; name: string; note: string | null; created_at: string };

type NutritionTargetsRow = {
  user_id: string;
  goal_preset: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  iron: number;
  calcium: number;
  updated_at: string;
};

type RecipeRow = {
  id: string;
  slug: string | null;
  name: string;
  region: string | null;
  diet: string | null;
  time_minutes: number | null;
  cost_estimate: number | null;
  spice_level: number | null;
  tags: string[];
  base_servings: number;
  nutrition: Nutrition;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  tracks: RecipeTrack[] | null;
  good_for: string[];
  caution: string | null;
  source: "daily" | "discover";
  created_at: string;
};

type MealPlanRow = {
  id: string;
  user_id: string;
  plan_date: string;
  meal_slot: "breakfast" | "lunch" | "dinner";
  recipe_id: string;
  planned_time: string | null;
  portion: number;
  created_at: string;
};

type DiscoverSwipeRow = { id: string; user_id: string; recipe_id: string; action: "skip" | "save"; created_at: string };

type GroceryItemRow = {
  id: string;
  name: string;
  qty: string | null;
  cost_estimate: number;
  vendor_category: "kirana" | "sabziwala" | "dairy" | "festival" | "addon";
  nutrition_tags: string[];
  nutrition: Nutrition | null;
  created_at: string;
};

type GroceryListStateRow = {
  user_id: string;
  week_start: string;
  to_buy_items: Record<string, boolean>;
  added_extras: string[];
  vendor: "blinkit" | "zepto" | "instamart";
  updated_at: string;
};

type CheatLogRow = { id: string; user_id: string; item_name: string; log_date: string; priority: string; created_at: string };

type FestivalBannerRow = { id: string; message: string; starts_on: string; ends_on: string };

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      household_members: {
        Row: HouseholdMemberRow;
        Insert: Partial<HouseholdMemberRow> & { user_id: string; name: string };
        Update: Partial<HouseholdMemberRow>;
        Relationships: [];
      };
      nutrition_targets: {
        Row: NutritionTargetsRow;
        Insert: Partial<NutritionTargetsRow> & { user_id: string };
        Update: Partial<NutritionTargetsRow>;
        Relationships: [];
      };
      recipes: {
        Row: RecipeRow;
        Insert: Partial<RecipeRow> & { name: string };
        Update: Partial<RecipeRow>;
        Relationships: [];
      };
      meal_plans: {
        Row: MealPlanRow;
        Insert: Partial<MealPlanRow> & {
          user_id: string;
          plan_date: string;
          meal_slot: "breakfast" | "lunch" | "dinner";
          recipe_id: string;
        };
        Update: Partial<MealPlanRow>;
        Relationships: [
          {
            foreignKeyName: "meal_plans_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          }
        ];
      };
      discover_swipes: {
        Row: DiscoverSwipeRow;
        Insert: { user_id: string; recipe_id: string; action: "skip" | "save" };
        Update: Partial<DiscoverSwipeRow>;
        Relationships: [
          {
            foreignKeyName: "discover_swipes_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          }
        ];
      };
      grocery_items: {
        Row: GroceryItemRow;
        Insert: Partial<GroceryItemRow> & { name: string; vendor_category: string };
        Update: Partial<GroceryItemRow>;
        Relationships: [];
      };
      grocery_list_state: {
        Row: GroceryListStateRow;
        Insert: Partial<GroceryListStateRow> & { user_id: string; week_start: string };
        Update: Partial<GroceryListStateRow>;
        Relationships: [];
      };
      cheat_log: {
        Row: CheatLogRow;
        Insert: { user_id: string; item_name: string; priority: string; log_date?: string };
        Update: Partial<CheatLogRow>;
        Relationships: [];
      };
      festival_banners: {
        Row: FestivalBannerRow;
        Insert: Partial<FestivalBannerRow> & { message: string };
        Update: Partial<FestivalBannerRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
