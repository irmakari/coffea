-- How a coffee was served. All optional, like everything but the name.
-- The size and shots also sharpen the app's caffeine estimate.
alter table public.coffee_entries
  add column size text check (size in ('small', 'medium', 'large')),
  add column shots smallint check (shots between 1 and 4),
  add column temperature text check (temperature in ('hot', 'iced')),
  add column venue text check (venue in ('cafe', 'home', 'takeaway'));
