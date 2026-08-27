-- Adds a "roti ya chawal?" counter to each meal plan — how many rotis and/or
-- cups of rice were had alongside the dish. Counts toward the nutrition
-- calculator (Grocery screen) but deliberately isn't turned into a grocery
-- item, since atta/rice are staples people already keep stocked.
--
-- Safe to run once against an existing database — additive only, no drops.

alter table meal_plans
  add column if not exists roti_count integer not null default 0,
  add column if not exists rice_cups numeric not null default 0;
