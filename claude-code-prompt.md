# Build Rasoi — India-market meal planner PWA

## Context

I have a working front-end prototype (single React component, `rasoi-app.jsx`, attached in this repo) that demonstrates the product: an Indian-market meal planner with daily "what to cook today" planning, a swipeable recipe discovery feed, a grocery list grouped by kirana/sabziwala/dairy vendors with a Blinkit/Zepto/Instamart hand-off, step-by-step cook mode with parallel timers for dishes cooked simultaneously, a nutrition profile that drives grocery recommendations, and a "cheat day" mode. Treat this file as the source of truth for UI, copy, tone, and interaction design — port its logic and content faithfully rather than redesigning it, unless a change is required to make it a real multi-user app.

Your job: turn this into a real, deployable, multi-user web app that I can send my friends a link to and they can each use it with their own account and data.

## Tech stack

- **Framework**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend/DB/Auth**: Supabase (Postgres + Auth + Row Level Security). Use magic-link or Google OAuth sign-in — no passwords to manage.
- **Hosting**: Vercel (connect to my GitHub repo, auto-deploy on push to `main`)
- **State/data fetching**: Supabase client + React Server Components where sensible; client components for interactive screens (swipe, cook mode, timers)
- **PWA**: add a manifest + service worker (e.g. `next-pwa`) so friends can "Add to Home Screen" on iOS/Android and it behaves like an app icon, works offline for already-loaded data
- Keep the dependency footprint small. Don't add a state management library (Redux/Zustand) — React state + Supabase queries are enough at this scale.

## Data model (Supabase/Postgres)

Design tables for:
- `profiles` — user id, display name, language preference, active household member context
- `household_members` — belongs to a user, name, dietary note (free text, e.g. "no onion-garlic")
- `nutrition_targets` — belongs to a user, goal preset name + calories/protein/carbs/fat/fiber/iron/calcium targets (editable, matching the Profile screen in the prototype)
- `recipes` — shared catalog: name, region, diet type, time, cost estimate, spice level, tags, nutrition per serving (calories/protein/carbs/fat/fiber/iron/calcium), base servings, ingredients (structured: name/qty/unit), steps (structured: title/detail/timer_seconds, with optional parallel "track" grouping for backward-planned dishes like the khichdi+kadhi example)
- `meal_plans` — belongs to a user, date, meal slot (breakfast/lunch/dinner), recipe id, planned time
- `discover_swipes` — belongs to a user, recipe id, action (skip/save), timestamp — so "already seen today" state is per-user and persists
- `grocery_items` — the base catalog of staple items (name, qty, cost estimate, vendor category: kirana/sabziwala/dairy/festival, nutrition tags for recommendation matching)
- `grocery_list_state` — belongs to a user + week, which items are checked, which optional add-on items have been added
- `cheat_log` — belongs to a user, item name, date, priority chosen (protein-forward/lighter/balance/enjoy) — just for their own reference, not social/shared

Seed the `recipes` and `grocery_items` tables with the sample data already in `rasoi-app.jsx` (Poha, Khichdi+Kadhi, Paneer Bhurji Paratha, the six Discover recipes, the four grocery vendor groups, the six add-on items, the six cheat-day items) so the app isn't empty on first login.

Use Row Level Security so every user only ever reads/writes their own `meal_plans`, `discover_swipes`, `grocery_list_state`, `nutrition_targets`, `household_members`, and `cheat_log` rows. `recipes` and `grocery_items` are shared read-only catalogs.

## Screens to build (port from the prototype)

1. **Today** — greeting, language toggle (English/Hindi — keep it simple with a small strings dictionary, don't pull in a full i18n library for two languages), festival/fasting banner (can be a manually-editable table `festival_banners` with start/end dates, or hardcode for now), household member chips, today's plan cards with nutrition-per-serving shown, leftover-suggestion box (this can stay a simple client-side canned suggestion for now — no AI call needed for v1).
2. **Discover** — swipeable recipe cards pulling from the `recipes` table, save/skip writes to `discover_swipes`, household-fit "good for / caution" logic computed from `household_members` dietary notes matched against recipe tags, Cheat Day toggle with the four priority filters.
3. **Grocery** — grouped list from `grocery_items`, checked state persisted to `grocery_list_state`, weekly budget progress bar, nutrition-vs-target panel computed from that day's `meal_plans` + any added extras, "Fill the gap" recommendations using the same tag-overlap scoring as the prototype, vendor picker (Blinkit/Zepto/Instamart) with the copy-to-clipboard + deep-link "Open [vendor]" action — do not attempt real cart integration; none of the three vendors expose a public API for this.
4. **Cook** — step list (or parallel tracks) pulled from the recipe's structured steps, portion stepper scaling the nutrition panel live, working timers (actual countdowns, not just labels — use `setInterval` client-side, and let a timer keep running if the user switches tabs by storing the target end-timestamp rather than a countdown value).
5. **Profile** — goal presets, editable macro/micro targets, household member management (add/edit/remove members and their dietary notes — this was static in the prototype, make it real CRUD here), sign-out.

## Explicit non-goals for this pass

- No real Blinkit/Zepto/Instamart order placement or cart pre-fill — copy-to-clipboard + deep link only, as in the prototype.
- No push notifications, no native app — this is a PWA.
- No AI-generated recipes or AI leftover suggestions yet — canned/rule-based logic is fine for v1.
- No social features (sharing plans with other users, following, etc.) beyond the "send to cook via WhatsApp" share action (`wa.me` link with the list pre-filled as text).

## What "done" looks like

- I can send a friend a Vercel URL, they sign in with their own email or Google account, and get their own empty-ish profile seeded with the default recipes/grocery catalog.
- Their data (meal plan, grocery checks, nutrition targets, household members) is private to them and persists across sessions and devices.
- The app is installable to a phone home screen and doesn't break on a slow connection (loading states everywhere, no blank white screens).
- Deployed and reachable at a public URL by the end of this session — walk me through connecting my Supabase project and Vercel account if you need credentials, and use environment variables for all keys, never hardcode them.

## Process

1. Scaffold the Next.js + Supabase project and get a "hello world" deploy working on Vercel first, before porting features — I want to confirm the pipeline works early.
2. Set up the database schema and RLS policies, then seed data.
3. Build auth (magic link is simplest to start).
4. Port screens one at a time in the order listed above, committing after each one.
5. Add the PWA manifest/service worker last, once the core flows work.
6. Give me a short README with: how to run locally, how to add a new recipe to the catalog, and how you set up Supabase/Vercel so I can manage it myself later.

Ask me before making any decision that involves real money (paid API tiers, custom domains, etc.) — free tiers of Supabase and Vercel should comfortably cover a handful of friends using this casually.
