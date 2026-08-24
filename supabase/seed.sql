-- Seeds the shared catalogs (recipes, grocery_items) plus a festival banner,
-- straight from the sample data in rasoi-app.jsx. Safe to re-run: it clears
-- and re-inserts the catalog rows rather than appending duplicates.

truncate table recipes, grocery_items, festival_banners restart identity cascade;

-- ---------------------------------------------------------------------------
-- recipes: the three "today" dishes (source = 'daily') ...
-- ---------------------------------------------------------------------------
insert into recipes (slug, name, region, diet, time_minutes, cost_estimate, spice_level, tags, base_servings, nutrition, ingredients, steps, tracks, good_for, caution, source)
values
(
  'kanda-poha',
  'Kanda Poha', 'Maharashtra', 'Veg', 10, 25, 1,
  array['10-min', 'Tiffin-friendly', 'onion-garlic'],
  2,
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
  null,
  array['you', 'amma', 'kids'],
  null,
  'daily'
),
(
  'moong-dal-khichdi-kadhi',
  'Moong Dal Khichdi + Kadhi', 'Gujarat', 'Veg', 40, 45, 1,
  array['No onion-garlic', 'Amma-approved'],
  2,
  '{"calories":420,"protein":14,"carbs":60,"fat":12,"fiber":6,"iron":3.2,"calcium":180}',
  '[{"name":"Moong dal","qty":"0.5","unit":"cup"},{"name":"Rice","qty":"0.5","unit":"cup"},{"name":"Besan","qty":"0.5","unit":"cup"},{"name":"Curd","qty":"1","unit":"cup"},{"name":"Jeera","qty":"1","unit":"tsp"},{"name":"Methi seeds","qty":"0.25","unit":"tsp"},{"name":"Hing","qty":"1","unit":"pinch"},{"name":"Ghee","qty":"1","unit":"tsp"}]',
  '[]',
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
  ]',
  array['you', 'amma'],
  null,
  'daily'
),
(
  'paneer-bhurji-paratha',
  'Paneer Bhurji Paratha', 'North India', 'Veg', 20, 60, 2,
  array['Kids will eat this', '20-min'],
  2,
  '{"calories":380,"protein":15,"carbs":45,"fat":16,"fiber":4,"iron":1.5,"calcium":220}',
  '[{"name":"Paneer","qty":"200","unit":"g"},{"name":"Wheat flour","qty":"2","unit":"cup"},{"name":"Capsicum","qty":"0.5","unit":"pc"},{"name":"Tomato","qty":"1","unit":"pc"},{"name":"Ghee","qty":"2","unit":"tbsp"}]',
  '[
    {"title":"Make the bhurji","detail":"Crumble paneer and sauté with capsicum, tomato and mild spices.","timer_seconds":300},
    {"title":"Rest the dough","detail":"Knead the dough and let it rest, covered.","timer_seconds":600},
    {"title":"Stuff and roll","detail":"Roll the dough, stuff with bhurji, seal and roll into a paratha.","timer_seconds":null},
    {"title":"Cook on the tawa","detail":"Cook with ghee till golden spots appear on both sides.","timer_seconds":240},
    {"title":"Serve","detail":"Serve hot with curd or pickle.","timer_seconds":null}
  ]',
  null,
  array['you', 'kids'],
  null,
  'daily'
);

-- ---------------------------------------------------------------------------
-- ... and the six Discover recipes (source = 'discover')
-- ---------------------------------------------------------------------------
insert into recipes (slug, name, region, diet, time_minutes, cost_estimate, spice_level, tags, base_servings, nutrition, ingredients, steps, tracks, good_for, caution, source)
values
('chettinad-chicken-curry', 'Chettinad Chicken Curry', 'Tamil Nadu', 'Non-veg', 45, 120, 4, array['Spicy', 'Weekend special', 'onion-garlic'], 2,
 '{"calories":410,"protein":32,"carbs":10,"fat":24,"fiber":3,"iron":2.6,"calcium":40}',
 '[{"name":"Chicken","qty":"500","unit":"g"},{"name":"Onion","qty":"2","unit":"pc"},{"name":"Tomato","qty":"2","unit":"pc"},{"name":"Ginger-garlic paste","qty":"1","unit":"tbsp"},{"name":"Coconut","qty":"0.5","unit":"pc"}]',
 '[]', null,
 array['you'], 'Too spicy for Kids · has onion-garlic', 'discover'),
('dhokla', 'Dhokla', 'Gujarat', 'Veg', 30, 30, 1, array['Steamed', 'Tiffin-friendly'], 2,
 '{"calories":160,"protein":6,"carbs":28,"fat":3,"fiber":2,"iron":1.1,"calcium":35}',
 '[{"name":"Besan","qty":"1","unit":"cup"},{"name":"Curd","qty":"0.5","unit":"cup"},{"name":"Mustard seeds","qty":"1","unit":"tsp"},{"name":"Green chilli","qty":"2","unit":"pc"}]',
 '[]', null,
 array['you', 'amma', 'kids'], null, 'discover'),
('sabudana-khichdi', 'Sabudana Khichdi', 'Maharashtra', 'Vrat / Fasting', 20, 45, 1, array['Navratri special'], 2,
 '{"calories":300,"protein":4,"carbs":48,"fat":10,"fiber":2,"iron":0.9,"calcium":25}',
 '[{"name":"Sabudana","qty":"1","unit":"cup"},{"name":"Peanuts","qty":"0.5","unit":"cup"},{"name":"Green chilli","qty":"2","unit":"pc"},{"name":"Potato","qty":"1","unit":"pc"}]',
 '[]', null,
 array['you', 'amma'], 'Kids may find it bland — add a little sugar', 'discover'),
('litti-chokha', 'Litti Chokha', 'Bihar', 'Veg', 50, 60, 2, array['Weekend special', 'onion-garlic'], 2,
 '{"calories":420,"protein":11,"carbs":55,"fat":16,"fiber":7,"iron":3.0,"calcium":60}',
 '[{"name":"Wheat flour","qty":"2","unit":"cup"},{"name":"Besan","qty":"1","unit":"cup"},{"name":"Baingan","qty":"1","unit":"pc"},{"name":"Onion","qty":"1","unit":"pc"}]',
 '[]', null,
 array['you'], 'Chokha has onion — skip that part for Amma', 'discover'),
('baingan-bharta', 'Baingan Bharta', 'Punjab', 'Veg', 30, 40, 2, array['Smoky', 'Comfort food', 'onion-garlic'], 2,
 '{"calories":180,"protein":4,"carbs":16,"fat":11,"fiber":6,"iron":1.4,"calcium":30}',
 '[{"name":"Baingan","qty":"1","unit":"pc"},{"name":"Onion","qty":"1","unit":"pc"},{"name":"Tomato","qty":"2","unit":"pc"},{"name":"Green chilli","qty":"2","unit":"pc"}]',
 '[]', null,
 array['you', 'kids'], 'Made with onion-garlic — cook Amma''s portion separately', 'discover'),
('undhiyu', 'Undhiyu', 'Gujarat', 'Veg', 60, 90, 2, array['Festival special', 'Winter'], 2,
 '{"calories":340,"protein":8,"carbs":38,"fat":18,"fiber":9,"iron":2.4,"calcium":90}',
 '[{"name":"Mixed vegetables","qty":"500","unit":"g"},{"name":"Sabudana","qty":"0.5","unit":"cup"},{"name":"Besan","qty":"0.5","unit":"cup"},{"name":"Green chilli","qty":"2","unit":"pc"}]',
 '[]', null,
 array['you', 'amma'], 'Long prep — best for a weekend', 'discover');

-- ---------------------------------------------------------------------------
-- grocery_items: four vendor groups ...
-- ---------------------------------------------------------------------------
insert into grocery_items (name, qty, cost_estimate, vendor_category, nutrition_tags, nutrition)
values
('Atta, chakki-fresh', '5 kg', 210, 'kirana', '{}', null),
('Toor dal', '1 kg', 160, 'kirana', '{}', null),
('Mustard oil', '1 L', 140, 'kirana', '{}', null),
('Turmeric powder', '100 g', 35, 'kirana', '{}', null),
('Red chilli powder', '100 g', 40, 'kirana', '{}', null),
('Sugar', '1 kg', 45, 'kirana', '{}', null),
('Salt', '1 kg', 20, 'kirana', '{}', null),
('Poha', '500 g', 35, 'kirana', '{}', null),

('Onions', '2 kg', 60, 'sabziwala', '{}', null),
('Tomatoes', '1 kg', 35, 'sabziwala', '{}', null),
('Baingan', '500 g', 30, 'sabziwala', '{}', null),
('Green chilli', '100 g', 15, 'sabziwala', '{}', null),
('Coriander leaves', '1 bunch', 10, 'sabziwala', '{}', null),
('Curry leaves', '1 bunch', 5, 'sabziwala', '{}', null),
('Capsicum', '250 g', 20, 'sabziwala', '{}', null),

('Paneer', '200 g', 80, 'dairy', '{}', null),
('Curd', '500 g', 35, 'dairy', '{}', null),
('Milk', '1 L', 32, 'dairy', '{}', null),
('Ghee', '200 g', 180, 'dairy', '{}', null),

('Sabudana', '500 g', 55, 'festival', '{}', null),
('Jaggery', '500 g', 40, 'festival', '{}', null),
('Besan', '500 g', 50, 'festival', '{}', null);

-- ---------------------------------------------------------------------------
-- ... and the six nutrition-gap add-on items (vendor_category = 'addon')
-- ---------------------------------------------------------------------------
insert into grocery_items (name, qty, cost_estimate, vendor_category, nutrition_tags, nutrition)
values
('Roasted chana', '100 g', 25, 'addon', array['protein', 'fiber', 'iron'], '{"calories":360,"protein":20,"fiber":12,"iron":5,"calcium":50}'),
('Sprouts mix', '100 g', 20, 'addon', array['protein', 'fiber', 'iron'], '{"calories":120,"protein":9,"fiber":8,"iron":2,"calcium":40}'),
('Toned milk, extra', '250 ml', 15, 'addon', array['protein', 'calcium'], '{"calories":150,"protein":8,"fiber":0,"iron":0.2,"calcium":300}'),
('Almonds', '30 g', 45, 'addon', array['protein', 'calcium', 'fiber'], '{"calories":180,"protein":6,"fiber":3,"iron":1.2,"calcium":75}'),
('Spinach (palak)', '1 bunch', 15, 'addon', array['iron', 'fiber', 'calcium'], '{"calories":40,"protein":3,"fiber":4,"iron":3.5,"calcium":100}'),
('Peanuts', '50 g', 15, 'addon', array['protein', 'fiber'], '{"calories":280,"protein":13,"fiber":4,"iron":1.5,"calcium":30}');

-- ---------------------------------------------------------------------------
-- festival_banners
-- ---------------------------------------------------------------------------
insert into festival_banners (message, starts_on, ends_on)
values ('Navratri begins in 4 days. 12 vrat-friendly recipes are ready when you are.', current_date + 4, current_date + 13);
