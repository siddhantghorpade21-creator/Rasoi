-- Rasoi schema: catalogs are shared/read-only, everything else is per-user
-- and locked down with row level security.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  language text not null default 'en' check (language in ('en', 'hi')),
  active_member_id uuid,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: select own" on profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);
create policy "profiles: insert own" on profiles
  for insert with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- household_members
-- ---------------------------------------------------------------------------
create table household_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table household_members enable row level security;
alter table profiles
  add constraint profiles_active_member_fk
  foreign key (active_member_id) references household_members (id) on delete set null;

create policy "household_members: crud own" on household_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- nutrition_targets
-- ---------------------------------------------------------------------------
create table nutrition_targets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  goal_preset text not null default 'maintain',
  calories numeric not null default 2000,
  protein numeric not null default 60,
  carbs numeric not null default 250,
  fat numeric not null default 65,
  fiber numeric not null default 30,
  iron numeric not null default 18,
  calcium numeric not null default 1000,
  updated_at timestamptz not null default now()
);

alter table nutrition_targets enable row level security;

create policy "nutrition_targets: crud own" on nutrition_targets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- recipes (shared catalog)
-- ---------------------------------------------------------------------------
create table recipes (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  region text,
  diet text,
  time_minutes int,
  cost_estimate numeric,
  spice_level int check (spice_level between 1 and 4),
  tags text[] not null default '{}',
  base_servings int not null default 2,
  nutrition jsonb not null default '{}',      -- {calories, protein, carbs, fat, fiber, iron, calcium} per serving
  ingredients jsonb not null default '[]',    -- [{name, qty, unit}]
  steps jsonb not null default '[]',          -- [{title, detail, timer_seconds}]
  tracks jsonb,                               -- optional: [{label, start, steps:[...]}] for parallel cook mode
  good_for text[] not null default '{}',      -- discovery: household roles this suits, e.g. {you,amma,kids}
  caution text,                               -- discovery: free-text caution note
  source text not null default 'discover' check (source in ('daily', 'discover')),
  created_at timestamptz not null default now()
);

alter table recipes enable row level security;
create policy "recipes: read all" on recipes for select using (true);

-- ---------------------------------------------------------------------------
-- meal_plans
-- ---------------------------------------------------------------------------
create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_date date not null,
  meal_slot text not null check (meal_slot in ('breakfast', 'lunch', 'dinner')),
  recipe_id uuid not null references recipes (id) on delete cascade,
  planned_time text,
  created_at timestamptz not null default now(),
  unique (user_id, plan_date, meal_slot)
);

alter table meal_plans enable row level security;
create policy "meal_plans: crud own" on meal_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- discover_swipes
-- ---------------------------------------------------------------------------
create table discover_swipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references recipes (id) on delete cascade,
  action text not null check (action in ('skip', 'save')),
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

alter table discover_swipes enable row level security;
create policy "discover_swipes: crud own" on discover_swipes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- grocery_items (shared catalog)
-- ---------------------------------------------------------------------------
create table grocery_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  qty text,
  cost_estimate numeric not null default 0,
  vendor_category text not null check (vendor_category in ('kirana', 'sabziwala', 'dairy', 'festival', 'addon')),
  nutrition_tags text[] not null default '{}',   -- e.g. {protein, fiber, iron, calcium} used for gap-fill matching
  nutrition jsonb,                                -- only set for addon items
  created_at timestamptz not null default now()
);

alter table grocery_items enable row level security;
create policy "grocery_items: read all" on grocery_items for select using (true);

-- ---------------------------------------------------------------------------
-- grocery_list_state (per user + ISO week)
-- ---------------------------------------------------------------------------
create table grocery_list_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  checked_items jsonb not null default '{}',   -- { [grocery_item_id]: true }
  added_extras uuid[] not null default '{}',   -- grocery_item ids (vendor_category = 'addon')
  vendor text not null default 'blinkit' check (vendor in ('blinkit', 'zepto', 'instamart')),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table grocery_list_state enable row level security;
create policy "grocery_list_state: crud own" on grocery_list_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- cheat_log
-- ---------------------------------------------------------------------------
create table cheat_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_name text not null,
  log_date date not null default current_date,
  priority text not null check (priority in ('protein', 'light', 'balance', 'enjoy')),
  created_at timestamptz not null default now()
);

alter table cheat_log enable row level security;
create policy "cheat_log: crud own" on cheat_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- festival_banners (manually editable, read-only to app users)
-- ---------------------------------------------------------------------------
create table festival_banners (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  starts_on date not null,
  ends_on date not null
);

alter table festival_banners enable row level security;
create policy "festival_banners: read all" on festival_banners for select using (true);

-- ---------------------------------------------------------------------------
-- New-user bootstrap: profile + a starter household member + default
-- nutrition targets + today's plan seeded from the three "daily" recipes, so
-- a freshly signed-up user doesn't land on an empty app.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  member_id uuid;
  r record;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));

  insert into public.household_members (user_id, name)
  values (new.id, 'You')
  returning id into member_id;

  update public.profiles set active_member_id = member_id where id = new.id;

  insert into public.nutrition_targets (user_id)
  values (new.id);

  for r in
    select id, source, row_number() over (order by created_at) as rn
    from public.recipes
    where source = 'daily'
    order by created_at
    limit 3
  loop
    insert into public.meal_plans (user_id, plan_date, meal_slot, recipe_id, planned_time)
    values (
      new.id,
      current_date,
      case r.rn when 1 then 'breakfast' when 2 then 'lunch' else 'dinner' end,
      r.id,
      case r.rn when 1 then '8:00 AM' when 2 then '1:00 PM' else '8:30 PM' end
    )
    on conflict (user_id, plan_date, meal_slot) do nothing;
  end loop;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
