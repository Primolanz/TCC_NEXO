alter table public.users
  add column if not exists birth_date date;

alter table public.users
  alter column main_goal drop not null;
