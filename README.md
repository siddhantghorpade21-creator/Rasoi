# Rasoi

An India-market meal planner: today's thali, swipeable recipe discovery, a
grocery list grouped by kirana/sabziwala/dairy vendors, step-by-step cook
mode with real countdown timers, and a nutrition profile that drives grocery
recommendations. Multi-user, installable as a PWA, deployed on Vercel with
Supabase for auth/data.

Stack: Next.js 14 (App Router) + TypeScript + Tailwind, Supabase
(Postgres + Auth + RLS), Vercel hosting, a hand-written service worker for
offline/installable support.

## Run it locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the env template and fill in your Supabase project's URL and anon
   key (Supabase dashboard → Project Settings → API):
   ```bash
   cp .env.local.example .env.local
   ```
3. Push the schema and seed data to your Supabase project (see below).
4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 — you'll land on `/login` and can sign in with
   a magic link or Google.

## Setting up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `supabase/migrations/0001_init.sql` (creates all
   tables, RLS policies, and the new-user bootstrap trigger), then run
   `supabase/seed.sql` (seeds the shared `recipes` and `grocery_items`
   catalogs, plus a sample festival banner). Or, if you have the Supabase
   CLI linked to your project:
   ```bash
   npx supabase db push
   npx supabase db execute -f supabase/seed.sql
   ```
3. Under Authentication → Providers, magic-link email is on by default. To
   enable "Continue with Google" too, add a Google OAuth provider (Supabase
   docs → Auth → Google) and add your deployed URL under Authentication →
   URL Configuration → Redirect URLs (e.g.
   `https://your-app.vercel.app/auth/callback`, plus
   `http://localhost:3000/auth/callback` for local dev).
4. Copy the Project URL and `anon` public key into `.env.local` (and later
   into Vercel's environment variables — see below).

Every user who signs up gets a `profiles` row, a starter "You" household
member, default nutrition targets, and today's plan pre-filled with the
three sample dishes (Poha, Khichdi + Kadhi, Paneer Bhurji Paratha) via a
Postgres trigger (`handle_new_user` in the migration) — so the app isn't
empty on first login.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, "Add New Project" → import the GitHub repo.
3. Add the same three environment variables from `.env.local` under
   Project Settings → Environment Variables — set `NEXT_PUBLIC_SITE_URL` to
   your Vercel URL (e.g. `https://rasoi.vercel.app`) once you know it, or
   your custom domain if you add one later (that's a real-money decision,
   so check with whoever owns the budget first).
4. Deploy. Every push to `main` auto-deploys.
5. Add the deployed `/auth/callback` URL to Supabase's redirect allow-list
   (step 3 above) — magic links and Google sign-in will otherwise bounce.

Both Supabase's and Vercel's free tiers comfortably cover a handful of
friends using this casually.

## Adding a new recipe to the catalog

Recipes live in the `recipes` table (`source` is `'daily'` for the three
"today" dishes seeded per new user, or `'discover'` for cards in the swipe
feed). Insert a row via the Supabase SQL Editor or table editor:

```sql
insert into recipes (name, region, diet, time_minutes, cost_estimate, spice_level, tags, base_servings, nutrition, steps, source)
values (
  'Your Dish Name', 'Region', 'Veg', 30, 50, 2,
  array['tag-one', 'tag-two'],
  2,
  '{"calories":300,"protein":10,"carbs":40,"fat":8,"fiber":4,"iron":1.5,"calcium":60}',
  '[{"title":"Step one","detail":"What to do.","timer_seconds":300}]',
  'discover'
);
```

For a dish cooked as two parallel tracks (like the khichdi + kadhi
backward-planned cook mode), set `tracks` instead of/alongside `steps`:
`[{"label":"Track name","start":"12:35 PM","steps":[...]}]`.

Grocery catalog items work the same way, in the `grocery_items` table —
`vendor_category` is one of `kirana`, `sabziwala`, `dairy`, `festival`, or
`addon` (addon items need `nutrition` and `nutrition_tags` set, since
that's what powers the "Fill the gap" recommendations).

## How this was set up (for future you)

- **Auth**: magic-link + Google OAuth via Supabase Auth, using
  `@supabase/ssr` for cookie-based sessions across Server Components,
  Route Handlers, and `src/middleware.ts` (which also gates every route
  except `/login` and `/auth/*` behind a signed-in session).
- **Data model**: see `supabase/migrations/0001_init.sql`. `recipes` and
  `grocery_items` are shared, read-only catalogs; everything else is
  per-user with Row Level Security (`auth.uid() = user_id`).
- **PWA**: `public/manifest.json` + a small hand-written
  `public/sw.js` (registered from `src/components/ServiceWorkerRegister.tsx`)
  — no `next-pwa`/workbox, since that pulls in an old, security-flagged
  dependency chain for what's a very small caching need here. It caches
  visited pages so they keep working offline; re-generate the placeholder
  icons any time with `npm run gen:icons`, or just drop your own artwork
  into `public/icons/`.
- **Known dev-only advisory**: `npm audit` flags a `postcss` advisory
  nested inside Next 14's own bundled dependency (`next/node_modules/postcss`).
  It's a build-time-only tool, not shipped to the browser, and the fix
  requires a Next 16 major upgrade — left as-is for this pass since it
  doesn't affect the deployed app.
- **Timers**: cook-mode timers store an absolute end-timestamp
  (`Date.now() + seconds * 1000`) rather than a ticking countdown, so they
  stay correct if you switch tabs and come back (see
  `StepTimer` in `src/app/(app)/cook/page.tsx`).

## Non-goals (v1)

- No real Blinkit/Zepto/Instamart order placement — copy-to-clipboard +
  deep link only, since none of the three expose a public cart API.
- No push notifications, no native app.
- No AI-generated recipes or leftover suggestions — the "Kal ka kuch bacha
  hai?" box gives a canned, randomly-picked suggestion client-side.
- No social features beyond the WhatsApp "Send to cook" share link.
