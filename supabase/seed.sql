-- Seeds/updates the shared recipe catalog and a festival banner.
--
-- IMPORTANT: this used to TRUNCATE ... CASCADE the recipes table, which
-- silently deleted every user's meal_plans and discover_swipes (both have a
-- foreign key to recipes with ON DELETE CASCADE). It now upserts by `slug`
-- instead, so re-running this file is safe — existing recipe rows keep their
-- id, and anything referencing them (today's plan, swipe history) survives.

-- ---------------------------------------------------------------------------
-- recipes — 24 dishes across the five regional buckets used in onboarding
-- (North Indian, South Indian, North Eastern, Gujarati, Rajasthani) plus
-- veg/egg/non-veg/fasting variety, so Discover has enough to filter and
-- search over.
-- ---------------------------------------------------------------------------
insert into recipes (slug, name, region, diet, time_minutes, cost_estimate, spice_level, tags, base_servings, nutrition, ingredients, steps, tracks, good_for, caution, source)
values
(
  'kanda-poha', 'Kanda Poha', 'Maharashtra', 'Veg', 10, 25, 1,
  array['10-min', 'Tiffin-friendly', 'onion-garlic'], 2,
  '{"calories":230,"protein":4,"carbs":40,"fat":7,"fiber":3,"iron":1.8,"calcium":20}',
  '[{"name":"Flattened rice (poha)","qty":"2","unit":"cup"},{"name":"Onion","qty":"1","unit":"pc"},{"name":"Mustard seeds","qty":"1","unit":"tsp"},{"name":"Curry leaves","qty":"1","unit":"sprig"},{"name":"Green chilli","qty":"1","unit":"pc"},{"name":"Turmeric","qty":"0.5","unit":"tsp"},{"name":"Lemon","qty":"0.5","unit":"pc"}]',
  '[
    {"title":"Rinse the poha","detail":"Rinse flattened rice in a strainer under running water for 10 seconds. Set aside — do not soak.","timer_seconds":null},
    {"title":"Temper the oil","detail":"Heat oil, add mustard seeds, curry leaves and slit green chilli. Let it splutter.","timer_seconds":120},
    {"title":"Onion (skip for Amma''s bowl)","detail":"Add chopped onion, sauté till translucent. Set aside a portion before this step for Amma.","timer_seconds":240},
    {"title":"Add poha and turmeric","detail":"Add turmeric, salt and the rinsed poha. Mix gently so it doesn''t turn mushy.","timer_seconds":120},
    {"title":"Steam covered","detail":"Cover and let it steam on low flame.","timer_seconds":180},
    {"title":"Finish and serve","detail":"Squeeze lemon, garnish with coriander and sev. Serve hot.","timer_seconds":null}
  ]',
  null, array['you', 'amma', 'kids'], null, 'daily'
),
(
  'moong-dal-khichdi-kadhi', 'Moong Dal Khichdi + Kadhi', 'Gujarat', 'Veg', 40, 45, 1,
  array['Gujarati', 'No onion-garlic', 'Amma-approved'], 2,
  '{"calories":420,"protein":14,"carbs":60,"fat":12,"fiber":6,"iron":3.2,"calcium":180}',
  '[{"name":"Moong dal","qty":"0.5","unit":"cup"},{"name":"Rice","qty":"0.5","unit":"cup"},{"name":"Besan","qty":"0.5","unit":"cup"},{"name":"Curd","qty":"1","unit":"cup"},{"name":"Jeera","qty":"1","unit":"tsp"},{"name":"Methi seeds","qty":"0.25","unit":"tsp"},{"name":"Hing","qty":"1","unit":"pinch"},{"name":"Ghee","qty":"1","unit":"tsp"}]',
  '[
    {"label":"Kadhi","start":"12:35 PM","steps":[
      {"title":"Whisk the base","detail":"Whisk besan, curd and water into a smooth, lump-free mix.","timer_seconds":null},
      {"title":"Temper and simmer","detail":"Temper with jeera, methi and hing, then pour in the base. Simmer on low, stirring often.","timer_seconds":900}
    ]},
    {"label":"Khichdi","start":"12:40 PM","steps":[
      {"title":"Wash dal and rice","detail":"Wash moong dal and rice together, drain well.","timer_seconds":null},
      {"title":"Pressure cook","detail":"Cook with turmeric, salt and a spoon of ghee for 3 whistles.","timer_seconds":720},
      {"title":"Rest before opening","detail":"Let pressure release naturally before opening the lid.","timer_seconds":300}
    ]}
  ]'::jsonb,
  null,
  array['you', 'amma'], null, 'daily'
),
(
  'paneer-bhurji-paratha', 'Paneer Bhurji Paratha', 'North India', 'Veg', 20, 60, 2,
  array['North Indian', 'Kids will eat this', '20-min'], 2,
  '{"calories":380,"protein":15,"carbs":45,"fat":16,"fiber":4,"iron":1.5,"calcium":220}',
  '[{"name":"Paneer","qty":"200","unit":"g"},{"name":"Wheat flour","qty":"2","unit":"cup"},{"name":"Capsicum","qty":"0.5","unit":"pc"},{"name":"Tomato","qty":"1","unit":"pc"},{"name":"Ghee","qty":"2","unit":"tbsp"}]',
  '[
    {"title":"Make the bhurji","detail":"Crumble paneer and sauté with capsicum, tomato and mild spices.","timer_seconds":300},
    {"title":"Rest the dough","detail":"Knead the dough and let it rest, covered.","timer_seconds":600},
    {"title":"Stuff and roll","detail":"Roll the dough, stuff with bhurji, seal and roll into a paratha.","timer_seconds":null},
    {"title":"Cook on the tawa","detail":"Cook with ghee till golden spots appear on both sides.","timer_seconds":240},
    {"title":"Serve","detail":"Serve hot with curd or pickle.","timer_seconds":null}
  ]',
  null, array['you', 'kids'], null, 'daily'
),
('chettinad-chicken-curry', 'Chettinad Chicken Curry', 'Tamil Nadu', 'Non-veg', 45, 120, 4, array['South Indian', 'Spicy', 'Weekend special', 'onion-garlic'], 2,
 '{"calories":410,"protein":32,"carbs":10,"fat":24,"fiber":3,"iron":2.6,"calcium":40}',
 '[{"name":"Chicken","qty":"500","unit":"g"},{"name":"Onion","qty":"2","unit":"pc"},{"name":"Tomato","qty":"2","unit":"pc"},{"name":"Ginger-garlic paste","qty":"1","unit":"tbsp"},{"name":"Coconut","qty":"0.5","unit":"pc"}]',
 '[{"title":"Sauté aromatics","detail":"Sauté onion, ginger-garlic paste and Chettinad spices till fragrant.","timer_seconds":300},{"title":"Add chicken","detail":"Add chicken and tomato, cook till the oil separates.","timer_seconds":600},{"title":"Simmer","detail":"Add ground coconut paste and water, simmer till the chicken is tender.","timer_seconds":900}]',
 null, array['you'], 'Too spicy for Kids · has onion-garlic', 'discover'),
('dhokla', 'Dhokla', 'Gujarat', 'Veg', 30, 30, 1, array['Gujarati', 'Steamed', 'Tiffin-friendly'], 2,
 '{"calories":160,"protein":6,"carbs":28,"fat":3,"fiber":2,"iron":1.1,"calcium":35}',
 '[{"name":"Besan","qty":"1","unit":"cup"},{"name":"Curd","qty":"0.5","unit":"cup"},{"name":"Mustard seeds","qty":"1","unit":"tsp"},{"name":"Green chilli","qty":"2","unit":"pc"}]',
 '[{"title":"Make the batter","detail":"Whisk besan, curd, water, turmeric and a little sugar into a smooth batter.","timer_seconds":null},{"title":"Steam it","detail":"Add eno/baking soda, pour into a greased plate and steam.","timer_seconds":900},{"title":"Temper and serve","detail":"Temper mustard seeds and green chilli in oil, pour over, cut into squares.","timer_seconds":120}]',
 null, array['you', 'amma', 'kids'], null, 'discover'),
('sabudana-khichdi', 'Sabudana Khichdi', 'Maharashtra', 'Vrat / Fasting', 20, 45, 1, array['Navratri special'], 2,
 '{"calories":300,"protein":4,"carbs":48,"fat":10,"fiber":2,"iron":0.9,"calcium":25}',
 '[{"name":"Sabudana","qty":"1","unit":"cup"},{"name":"Peanuts","qty":"0.5","unit":"cup"},{"name":"Green chilli","qty":"2","unit":"pc"},{"name":"Potato","qty":"1","unit":"pc"}]',
 '[{"title":"Soak sabudana","detail":"Soak overnight or at least 4 hours, until pearls flatten between fingers.","timer_seconds":null},{"title":"Sauté potato","detail":"Fry cubed potato with cumin and green chilli till golden.","timer_seconds":420},{"title":"Add sabudana and peanuts","detail":"Add drained sabudana and crushed peanuts, toss on low heat till translucent.","timer_seconds":300}]',
 null, array['you', 'amma'], 'Kids may find it bland — add a little sugar', 'discover'),
('litti-chokha', 'Litti Chokha', 'Bihar', 'Veg', 50, 60, 2, array['North Indian', 'Weekend special', 'onion-garlic'], 2,
 '{"calories":420,"protein":11,"carbs":55,"fat":16,"fiber":7,"iron":3.0,"calcium":60}',
 '[{"name":"Wheat flour","qty":"2","unit":"cup"},{"name":"Besan","qty":"1","unit":"cup"},{"name":"Baingan","qty":"1","unit":"pc"},{"name":"Onion","qty":"1","unit":"pc"}]',
 '[{"title":"Make the sattu filling","detail":"Mix roasted besan with mustard oil, pickle masala and lemon.","timer_seconds":null},{"title":"Stuff and bake the litti","detail":"Stuff dough balls with filling, bake or roast till charred spots appear.","timer_seconds":1200},{"title":"Make the chokha","detail":"Roast baingan and potato, mash with onion, garlic and mustard oil.","timer_seconds":900}]',
 null, array['you'], 'Chokha has onion — skip that part for Amma', 'discover'),
('baingan-bharta', 'Baingan Bharta', 'Punjab', 'Veg', 30, 40, 2, array['North Indian', 'Smoky', 'Comfort food', 'onion-garlic'], 2,
 '{"calories":180,"protein":4,"carbs":16,"fat":11,"fiber":6,"iron":1.4,"calcium":30}',
 '[{"name":"Baingan","qty":"1","unit":"pc"},{"name":"Onion","qty":"1","unit":"pc"},{"name":"Tomato","qty":"2","unit":"pc"},{"name":"Green chilli","qty":"2","unit":"pc"}]',
 '[{"title":"Char the baingan","detail":"Roast whole over an open flame till the skin blisters and flesh softens.","timer_seconds":600},{"title":"Peel and mash","detail":"Peel the charred skin and mash the flesh.","timer_seconds":null},{"title":"Cook the masala","detail":"Sauté onion, tomato and green chilli, fold in the mashed baingan.","timer_seconds":600}]',
 null, array['you', 'kids'], 'Made with onion-garlic — cook Amma''s portion separately', 'discover'),
('undhiyu', 'Undhiyu', 'Gujarat', 'Veg', 60, 90, 2, array['Gujarati', 'Festival special', 'Winter'], 2,
 '{"calories":340,"protein":8,"carbs":38,"fat":18,"fiber":9,"iron":2.4,"calcium":90}',
 '[{"name":"Mixed vegetables","qty":"500","unit":"g"},{"name":"Sabudana","qty":"0.5","unit":"cup"},{"name":"Besan","qty":"0.5","unit":"cup"},{"name":"Green chilli","qty":"2","unit":"pc"}]',
 '[{"title":"Make the muthiya","detail":"Steam small besan-vegetable dumplings.","timer_seconds":900},{"title":"Layer the vegetables","detail":"Layer winter vegetables with green masala in a heavy pot.","timer_seconds":null},{"title":"Slow-cook","detail":"Cook covered on low heat till everything is tender, folding in the muthiya near the end.","timer_seconds":1800}]',
 null, array['you', 'amma'], 'Long prep — best for a weekend', 'discover'),
('masala-dosa', 'Masala Dosa', 'Tamil Nadu', 'Veg', 30, 40, 2, array['South Indian', 'Breakfast', 'Crispy'], 2,
 '{"calories":260,"protein":6,"carbs":42,"fat":8,"fiber":3,"iron":1.6,"calcium":30}',
 '[{"name":"Dosa batter","qty":"2","unit":"cup"},{"name":"Potato","qty":"2","unit":"pc"},{"name":"Onion","qty":"1","unit":"pc"},{"name":"Mustard seeds","qty":"1","unit":"tsp"},{"name":"Curry leaves","qty":"1","unit":"sprig"}]',
 '[{"title":"Make the potato masala","detail":"Temper mustard seeds and curry leaves, sauté onion, add boiled mashed potato and turmeric.","timer_seconds":600},{"title":"Spread the dosa","detail":"Spread batter thin on a hot tawa in a circular motion.","timer_seconds":180},{"title":"Fill and fold","detail":"Add the potato masala, fold and serve with chutney and sambar.","timer_seconds":null}]',
 null, array['you', 'amma', 'kids'], null, 'discover'),
('sambar-rice', 'Sambar Rice', 'Tamil Nadu', 'Veg', 35, 45, 2, array['South Indian', 'Comfort food'], 2,
 '{"calories":320,"protein":10,"carbs":55,"fat":6,"fiber":7,"iron":2.8,"calcium":60}',
 '[{"name":"Toor dal","qty":"0.5","unit":"cup"},{"name":"Rice","qty":"1","unit":"cup"},{"name":"Tamarind","qty":"1","unit":"tbsp"},{"name":"Sambar powder","qty":"2","unit":"tbsp"}]',
 '[{"title":"Cook dal and rice","detail":"Pressure cook toor dal and rice together till soft.","timer_seconds":900},{"title":"Make the sambar base","detail":"Simmer tamarind water with vegetables and sambar powder.","timer_seconds":900},{"title":"Combine","detail":"Mix the cooked dal-rice into the sambar base, temper and serve.","timer_seconds":300}]',
 null, array['you', 'amma', 'kids'], null, 'discover'),
('rajma-chawal', 'Rajma Chawal', 'Punjab', 'Veg', 40, 50, 2, array['North Indian', 'Comfort food', 'onion-garlic'], 2,
 '{"calories":380,"protein":14,"carbs":60,"fat":8,"fiber":9,"iron":3.5,"calcium":70}',
 '[{"name":"Rajma","qty":"1","unit":"cup"},{"name":"Rice","qty":"1","unit":"cup"},{"name":"Onion","qty":"1","unit":"pc"},{"name":"Tomato","qty":"2","unit":"pc"},{"name":"Ginger-garlic paste","qty":"1","unit":"tbsp"}]',
 '[{"title":"Soak and pressure cook rajma","detail":"Soak overnight, then pressure cook till soft.","timer_seconds":1200},{"title":"Make the gravy","detail":"Sauté onion, tomato and ginger-garlic paste, add the rajma and simmer.","timer_seconds":900},{"title":"Cook rice and serve","detail":"Cook rice separately, serve with the rajma gravy.","timer_seconds":900}]',
 null, array['you', 'kids'], 'Has onion-garlic — cook Amma''s portion separately', 'discover'),
('dal-baati-churma', 'Dal Baati Churma', 'Rajasthan', 'Veg', 60, 70, 2, array['Rajasthani', 'Festival special'], 2,
 '{"calories":520,"protein":14,"carbs":70,"fat":20,"fiber":6,"iron":3.0,"calcium":80}',
 '[{"name":"Wheat flour","qty":"3","unit":"cup"},{"name":"Toor dal","qty":"0.5","unit":"cup"},{"name":"Ghee","qty":"4","unit":"tbsp"},{"name":"Jaggery","qty":"3","unit":"tbsp"}]',
 '[{"title":"Shape and bake the baati","detail":"Knead a stiff dough, shape into balls, bake or roast till golden and firm.","timer_seconds":2400},{"title":"Cook the dal","detail":"Cook mixed dals with ghee tempering.","timer_seconds":1200},{"title":"Make the churma","detail":"Crumble a few baked baati with ghee and jaggery into churma.","timer_seconds":null}]',
 null, array['you', 'amma'], 'Long prep — best for a weekend', 'discover'),
('gatte-ki-sabzi', 'Gatte ki Sabzi', 'Rajasthan', 'Veg', 40, 45, 2, array['Rajasthani', 'No onion-garlic'], 2,
 '{"calories":300,"protein":12,"carbs":30,"fat":15,"fiber":5,"iron":2.2,"calcium":90}',
 '[{"name":"Besan","qty":"1.5","unit":"cup"},{"name":"Curd","qty":"1","unit":"cup"},{"name":"Mustard oil","qty":"2","unit":"tbsp"},{"name":"Turmeric","qty":"0.5","unit":"tsp"}]',
 '[{"title":"Shape and boil the gatte","detail":"Roll besan dough into logs, boil till firm, slice into pieces.","timer_seconds":900},{"title":"Make the curd gravy","detail":"Whisk curd with spices, simmer into a gravy.","timer_seconds":600},{"title":"Combine","detail":"Add the gatte pieces to the gravy and simmer briefly.","timer_seconds":300}]',
 null, array['you', 'amma'], null, 'discover'),
('ker-sangri', 'Ker Sangri', 'Rajasthan', 'Veg', 45, 55, 2, array['Rajasthani', 'Desert special'], 2,
 '{"calories":220,"protein":8,"carbs":25,"fat":10,"fiber":6,"iron":2.5,"calcium":50}',
 '[{"name":"Ker sangri (dried beans)","qty":"1","unit":"cup"},{"name":"Onion","qty":"1","unit":"pc"},{"name":"Mustard oil","qty":"2","unit":"tbsp"},{"name":"Red chilli powder","qty":"1","unit":"tsp"}]',
 '[{"title":"Soak overnight","detail":"Soak the dried ker sangri overnight, then boil till tender.","timer_seconds":1200},{"title":"Temper and cook","detail":"Sauté in mustard oil with onion and Rajasthani spices.","timer_seconds":600},{"title":"Serve","detail":"Serve with bajra roti.","timer_seconds":null}]',
 null, array['you', 'amma'], 'An acquired, tangy Rajasthani specialty', 'discover'),
('maasor-tenga', 'Maasor Tenga (Assamese Fish Curry)', 'Assam', 'Non-veg', 35, 90, 2, array['North Eastern', 'Tangy', 'Light'], 2,
 '{"calories":260,"protein":28,"carbs":8,"fat":12,"fiber":2,"iron":1.8,"calcium":40}',
 '[{"name":"Fish","qty":"500","unit":"g"},{"name":"Tomato","qty":"2","unit":"pc"},{"name":"Lemon","qty":"1","unit":"pc"},{"name":"Mustard oil","qty":"2","unit":"tbsp"}]',
 '[{"title":"Fry the fish lightly","detail":"Shallow fry fish pieces in mustard oil till just golden.","timer_seconds":300},{"title":"Make the tangy base","detail":"Simmer tomato with a souring agent (tenga) in mustard oil.","timer_seconds":600},{"title":"Simmer the fish in","detail":"Add the fish back, simmer briefly, finish with lemon.","timer_seconds":300}]',
 null, array['you'], null, 'discover'),
('bamboo-shoot-pork', 'Bamboo Shoot Pork Curry', 'Nagaland', 'Non-veg', 60, 110, 3, array['North Eastern', 'Spicy'], 2,
 '{"calories":420,"protein":30,"carbs":10,"fat":28,"fiber":3,"iron":2.0,"calcium":30}',
 '[{"name":"Pork","qty":"500","unit":"g"},{"name":"Bamboo shoot","qty":"200","unit":"g"},{"name":"Ginger-garlic paste","qty":"1","unit":"tbsp"},{"name":"Green chilli","qty":"3","unit":"pc"}]',
 '[{"title":"Boil the pork","detail":"Boil pork with ginger-garlic paste till halfway tender.","timer_seconds":1800},{"title":"Add bamboo shoot","detail":"Add fermented bamboo shoot and green chilli, continue cooking.","timer_seconds":1200},{"title":"Reduce and serve","detail":"Cook till the gravy thickens.","timer_seconds":600}]',
 null, array['you'], 'Fermented bamboo shoot has a strong, distinctive flavor', 'discover'),
('naga-axone-chicken', 'Naga Style Chicken (Axone)', 'Nagaland', 'Non-veg', 45, 100, 4, array['North Eastern', 'Spicy'], 2,
 '{"calories":380,"protein":32,"carbs":8,"fat":22,"fiber":2,"iron":2.2,"calcium":35}',
 '[{"name":"Chicken","qty":"500","unit":"g"},{"name":"Axone (fermented soybean)","qty":"2","unit":"tbsp"},{"name":"Ginger-garlic paste","qty":"1","unit":"tbsp"},{"name":"Green chilli","qty":"4","unit":"pc"}]',
 '[{"title":"Marinate","detail":"Marinate chicken with ginger-garlic paste and salt.","timer_seconds":600},{"title":"Cook with axone","detail":"Cook the chicken with mashed axone and green chilli till done.","timer_seconds":1500},{"title":"Serve","detail":"Serve hot with steamed rice.","timer_seconds":null}]',
 null, array['you'], 'Very spicy, strong fermented flavor — not for Kids', 'discover'),
('veg-momos', 'Momos (Veg)', 'Sikkim', 'Veg', 40, 60, 2, array['North Eastern', 'Steamed'], 2,
 '{"calories":220,"protein":6,"carbs":38,"fat":5,"fiber":4,"iron":1.5,"calcium":40}',
 '[{"name":"Wheat flour","qty":"2","unit":"cup"},{"name":"Cabbage","qty":"1","unit":"cup"},{"name":"Carrot","qty":"1","unit":"pc"},{"name":"Ginger-garlic paste","qty":"1","unit":"tsp"}]',
 '[{"title":"Make the dough","detail":"Knead a simple flour-water dough, rest covered.","timer_seconds":900},{"title":"Make the filling","detail":"Finely chop cabbage and carrot, mix with ginger-garlic paste and seasoning.","timer_seconds":null},{"title":"Fold and steam","detail":"Roll small discs, fill, pleat and steam till translucent.","timer_seconds":600}]',
 null, array['you', 'amma', 'kids'], null, 'discover'),
('egg-bhurji', 'Egg Bhurji', 'North India', 'Egg', 15, 35, 2, array['North Indian', 'Egg', '15-min'], 2,
 '{"calories":230,"protein":14,"carbs":6,"fat":16,"fiber":1,"iron":1.8,"calcium":40}',
 '[{"name":"Egg","qty":"4","unit":"pc"},{"name":"Onion","qty":"1","unit":"pc"},{"name":"Tomato","qty":"1","unit":"pc"},{"name":"Green chilli","qty":"1","unit":"pc"}]',
 '[{"title":"Sauté the base","detail":"Sauté onion, tomato and green chilli till soft.","timer_seconds":300},{"title":"Scramble the eggs in","detail":"Beat eggs with turmeric and salt, pour in and scramble on medium heat.","timer_seconds":240},{"title":"Serve","detail":"Serve hot with toast or roti.","timer_seconds":null}]',
 null, array['you', 'kids'], null, 'discover'),
('anda-curry', 'Anda Curry (Egg Curry)', 'North India', 'Egg', 30, 50, 3, array['North Indian', 'Egg', 'onion-garlic'], 2,
 '{"calories":260,"protein":15,"carbs":10,"fat":18,"fiber":2,"iron":2.0,"calcium":45}',
 '[{"name":"Egg","qty":"4","unit":"pc"},{"name":"Onion","qty":"1","unit":"pc"},{"name":"Tomato","qty":"2","unit":"pc"},{"name":"Ginger-garlic paste","qty":"1","unit":"tbsp"}]',
 '[{"title":"Boil the eggs","detail":"Hard boil the eggs, peel and lightly slit.","timer_seconds":600},{"title":"Make the gravy","detail":"Sauté onion, tomato and ginger-garlic paste into a masala gravy.","timer_seconds":600},{"title":"Simmer the eggs in","detail":"Add the boiled eggs, simmer briefly to soak up the gravy.","timer_seconds":300}]',
 null, array['you'], 'Has onion-garlic — cook Amma''s portion separately', 'discover'),
('egg-dosa', 'Egg Dosa', 'Tamil Nadu', 'Egg', 20, 40, 1, array['South Indian', 'Egg', 'Breakfast'], 2,
 '{"calories":280,"protein":12,"carbs":38,"fat":10,"fiber":2,"iron":1.7,"calcium":35}',
 '[{"name":"Dosa batter","qty":"2","unit":"cup"},{"name":"Egg","qty":"2","unit":"pc"},{"name":"Onion","qty":"0.5","unit":"pc"}]',
 '[{"title":"Spread the dosa","detail":"Spread batter thin on a hot tawa.","timer_seconds":120},{"title":"Add the egg","detail":"Crack an egg over the dosa and spread evenly, sprinkle chopped onion.","timer_seconds":120},{"title":"Flip and finish","detail":"Flip once the egg sets, cook briefly and serve.","timer_seconds":90}]',
 null, array['you', 'kids'], null, 'discover'),
('khaman', 'Khaman', 'Gujarat', 'Veg', 25, 30, 1, array['Gujarati', 'Steamed', 'Tiffin-friendly'], 2,
 '{"calories":180,"protein":7,"carbs":28,"fat":4,"fiber":2,"iron":1.2,"calcium":25}',
 '[{"name":"Besan","qty":"1","unit":"cup"},{"name":"Curd","qty":"0.25","unit":"cup"},{"name":"Sugar","qty":"1","unit":"tbsp"},{"name":"Green chilli","qty":"2","unit":"pc"}]',
 '[{"title":"Make the batter","detail":"Whisk besan, curd, sugar and water into a smooth batter.","timer_seconds":null},{"title":"Steam it","detail":"Add eno, pour into a greased plate, steam till fluffy.","timer_seconds":900},{"title":"Temper and finish","detail":"Temper mustard seeds and green chilli in oil, pour over with a little water and sugar.","timer_seconds":120}]',
 null, array['you', 'amma', 'kids'], null, 'discover'),
('handvo', 'Handvo', 'Gujarat', 'Veg', 45, 45, 1, array['Gujarati', 'Savory cake', 'Tiffin-friendly'], 2,
 '{"calories":300,"protein":9,"carbs":45,"fat":9,"fiber":4,"iron":1.8,"calcium":50}',
 '[{"name":"Rice","qty":"1","unit":"cup"},{"name":"Toor dal","qty":"0.5","unit":"cup"},{"name":"Bottle gourd","qty":"1","unit":"cup"},{"name":"Curd","qty":"0.5","unit":"cup"}]',
 '[{"title":"Soak and grind","detail":"Soak rice and dal, grind coarsely with curd, ferment a few hours.","timer_seconds":null},{"title":"Mix in vegetables","detail":"Fold in grated bottle gourd and spices.","timer_seconds":null},{"title":"Bake or steam","detail":"Pour into a greased pan, temper the top, bake till a skewer comes out clean.","timer_seconds":2400}]',
 null, array['you', 'amma', 'kids'], null, 'discover')
on conflict (slug) do update set
  name = excluded.name,
  region = excluded.region,
  diet = excluded.diet,
  time_minutes = excluded.time_minutes,
  cost_estimate = excluded.cost_estimate,
  spice_level = excluded.spice_level,
  tags = excluded.tags,
  base_servings = excluded.base_servings,
  nutrition = excluded.nutrition,
  ingredients = excluded.ingredients,
  steps = excluded.steps,
  tracks = excluded.tracks,
  good_for = excluded.good_for,
  caution = excluded.caution,
  source = excluded.source;

-- ---------------------------------------------------------------------------
-- grocery_items — only the nutrition-gap "addon" items now (the general
-- kirana/sabziwala/dairy catalog was dropped from the app in favor of
-- building the grocery list straight from today's Rasoi ingredients).
-- Upserted by name (see migration 0002) so re-running this doesn't orphan
-- the ids a user's grocery_list_state.added_extras already points to.
-- ---------------------------------------------------------------------------
delete from grocery_items where vendor_category != 'addon';

insert into grocery_items (name, qty, cost_estimate, vendor_category, nutrition_tags, nutrition)
values
('Roasted chana', '100 g', 25, 'addon', array['protein', 'fiber', 'iron'], '{"calories":360,"protein":20,"fiber":12,"iron":5,"calcium":50}'),
('Sprouts mix', '100 g', 20, 'addon', array['protein', 'fiber', 'iron'], '{"calories":120,"protein":9,"fiber":8,"iron":2,"calcium":40}'),
('Toned milk, extra', '250 ml', 15, 'addon', array['protein', 'calcium'], '{"calories":150,"protein":8,"fiber":0,"iron":0.2,"calcium":300}'),
('Almonds', '30 g', 45, 'addon', array['protein', 'calcium', 'fiber'], '{"calories":180,"protein":6,"fiber":3,"iron":1.2,"calcium":75}'),
('Spinach (palak)', '1 bunch', 15, 'addon', array['iron', 'fiber', 'calcium'], '{"calories":40,"protein":3,"fiber":4,"iron":3.5,"calcium":100}'),
('Peanuts', '50 g', 15, 'addon', array['protein', 'fiber'], '{"calories":280,"protein":13,"fiber":4,"iron":1.5,"calcium":30}')
on conflict (name) do update set
  qty = excluded.qty,
  cost_estimate = excluded.cost_estimate,
  vendor_category = excluded.vendor_category,
  nutrition_tags = excluded.nutrition_tags,
  nutrition = excluded.nutrition;

-- ---------------------------------------------------------------------------
-- festival_banners — no dependents, safe to refresh in place
-- ---------------------------------------------------------------------------
delete from festival_banners;
insert into festival_banners (message, starts_on, ends_on)
values ('Navratri begins in 4 days. 12 vrat-friendly recipes are ready when you are.', current_date + 4, current_date + 13);
