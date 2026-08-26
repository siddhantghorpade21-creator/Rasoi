-- Adds: onboarding dietary/regional preferences on profiles, a per-dish
-- portion multiplier on meal_plans, and renames grocery_list_state's
-- checked_items to to_buy_items now that checking an item means "need to
-- buy" (previously meant "already got it").
--
-- Safe to run once against an existing database — additive only, no drops.

alter table profiles
  add column if not exists diet_preference text check (diet_preference in ('veg', 'egg', 'non-veg')),
  add column if not exists region_preferences text[] not null default '{}',
  add column if not exists region_preference_other text,
  add column if not exists onboarding_completed boolean not null default false;

alter table meal_plans
  add column if not exists portion numeric not null default 1;

alter table grocery_list_state
  rename column checked_items to to_buy_items;

-- Lets grocery_items be upserted by name (like recipes are by slug) instead
-- of truncated + reinserted, so a reseed doesn't orphan the ids a user's
-- grocery_list_state.added_extras already points to.
alter table grocery_items
  add constraint grocery_items_name_key unique (name);
