-- ============================================================================
-- FeedbackBox — Supabase schema, RLS policies & auth trigger
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- ============================================================================

-- 1) Tables -------------------------------------------------------------------

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  full_name   text,
  created_at  timestamptz not null default now()
);

create table if not exists public.messages (
  id          uuid primary key default uuid_generate_v4(),
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists messages_receiver_idx on public.messages (receiver_id);

-- 2) Row Level Security ------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.messages enable row level security;

-- Profiles: anyone can look up a username (needed for the public /u/[username]
-- page). Owners can insert/update only their own row.
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Messages: ANYONE (anon) can INSERT where receiver_id is a valid profile.
-- Only the authenticated OWNER can SELECT (read) their own messages.
create policy "Anyone can send an anonymous message"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = messages.receiver_id
    )
  );

create policy "Receiver can read their own messages"
  on public.messages for select
  using (auth.uid() = receiver_id);

-- 3) Auto-create a profile row on sign-up ------------------------------------
-- Supabase Auth does not auto-create the linked profile row, so we use a
-- trigger. Pass `username` and `full_name` via user_metadata at sign-up.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
