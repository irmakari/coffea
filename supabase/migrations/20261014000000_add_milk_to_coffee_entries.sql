-- The milk a coffee was made with. Optional, like everything but the name.
-- Holds one of the app's milk keys.
alter table public.coffee_entries
  add column milk text check (char_length(milk) <= 40);
