-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Roomiee.app — database schema                                             ║
-- ║  Supabase → SQL Editor → New query → paste ALL of this → Run.              ║
-- ║  Every table has Row Level Security: you only ever see your house's data,  ║
-- ║  and nothing is readable without logging in.                               ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

create extension if not exists pgcrypto;

-- ─── Houses ──────────────────────────────────────────────────────────────────
create table if not exists houses (
  id            uuid primary key default gen_random_uuid(),
  name          text not null default 'My flat',
  base_currency text not null default 'EUR',
  is_pro        boolean not null default false,
  cover         text,                                   -- photo (data URL)
  guest_period  jsonb,                                  -- {hostId, guestName, startDate, endDate}
  invite_code   text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_by    uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at    timestamptz not null default now()
);

-- ─── Profiles (1:1 with auth.users) ──────────────────────────────────────────
create table if not exists profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  name               text not null default 'Roommate',
  email              text,
  color              text not null default '#4DA3FF',
  photo              text,                              -- photo (data URL)
  preferred_currency text not null default 'EUR',
  bizum_phone        text,
  paypal_me          text,
  revolut_tag        text,
  created_at         timestamptz not null default now()
);

-- ─── Membership ──────────────────────────────────────────────────────────────
create table if not exists house_members (
  house_id   uuid not null references houses(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (house_id, user_id)
);

-- ─── Per-house data ──────────────────────────────────────────────────────────
create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  house_id    uuid not null references houses(id) on delete cascade,
  title       text not null,
  amount      numeric(12,2) not null default 0,
  currency    text not null default 'EUR',
  paid_by     uuid references profiles(id) on delete set null,
  split_with  uuid[] not null default '{}',
  category    text not null default 'other',
  date        date not null default current_date,
  settled     boolean not null default false,
  photo       text,
  created_at  timestamptz not null default now()
);

create table if not exists shopping_lists (
  id          uuid primary key default gen_random_uuid(),
  house_id    uuid not null references houses(id) on delete cascade,
  name        text not null,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists shopping_items (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references shopping_lists(id) on delete cascade,
  name        text not null,
  quantity    text,
  added_by    uuid references profiles(id) on delete set null,
  checked     boolean not null default false,
  checked_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists food_orders (
  id           uuid primary key default gen_random_uuid(),
  house_id     uuid not null references houses(id) on delete cascade,
  platform     text not null default 'Other',
  restaurant   text not null,
  items        jsonb not null default '[]',
  delivery_fee numeric(12,2) not null default 0,
  tip          numeric(12,2) not null default 0,
  currency     text not null default 'EUR',
  date         date not null default current_date,
  settled      boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists chores (
  id           uuid primary key default gen_random_uuid(),
  house_id     uuid not null references houses(id) on delete cascade,
  title        text not null,
  assigned_to  uuid references profiles(id) on delete set null,
  due_date     date,
  completed    boolean not null default false,
  completed_at date,
  recurring    text not null default 'none',
  created_at   timestamptz not null default now()
);

create table if not exists house_notes (
  id          uuid primary key default gen_random_uuid(),
  house_id    uuid not null references houses(id) on delete cascade,
  title       text not null,
  body        text not null default '',
  pinned      boolean not null default false,
  photo       text,
  created_by  uuid references profiles(id) on delete set null,
  created_at  date not null default current_date,
  updated_at  date not null default current_date
);

create table if not exists bills (
  id               uuid primary key default gen_random_uuid(),
  house_id         uuid not null references houses(id) on delete cascade,
  name             text not null,
  amount           numeric(12,2) not null default 0,
  currency         text not null default 'EUR',
  due_day          int not null default 1 check (due_day between 1 and 31),
  category         text not null default 'utilities',
  split_with       uuid[] not null default '{}',
  reminder_enabled boolean not null default false,
  created_at       timestamptz not null default now()
);

create table if not exists album_photos (
  id         uuid primary key default gen_random_uuid(),
  house_id   uuid not null references houses(id) on delete cascade,
  uri        text not null,                             -- photo (data URL)
  caption    text not null default '',
  added_by   uuid references profiles(id) on delete set null,
  added_at   date not null default current_date
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Row Level Security                                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

alter table houses          enable row level security;
alter table profiles        enable row level security;
alter table house_members   enable row level security;
alter table expenses        enable row level security;
alter table shopping_lists  enable row level security;
alter table shopping_items  enable row level security;
alter table food_orders     enable row level security;
alter table chores          enable row level security;
alter table house_notes     enable row level security;
alter table bills           enable row level security;
alter table album_photos    enable row level security;

-- Helpers run as the table owner so policies don't recurse into each other.
create or replace function is_house_member(h uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from house_members where house_id = h and user_id = auth.uid());
$$;

create or replace function shares_house(other uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from house_members a join house_members b on a.house_id = b.house_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

-- Profiles: you see yourself and your housemates; you edit only yourself.
drop policy if exists "profiles read" on profiles;
drop policy if exists "profiles insert" on profiles;
drop policy if exists "profiles update" on profiles;
create policy "profiles read"   on profiles for select to authenticated using (id = auth.uid() or shares_house(id));
create policy "profiles insert" on profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update" on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Houses: members read and update; anyone logged in can create their own.
drop policy if exists "houses read" on houses;
drop policy if exists "houses insert" on houses;
drop policy if exists "houses update" on houses;
create policy "houses read"   on houses for select to authenticated using (created_by = auth.uid() or is_house_member(id));
create policy "houses insert" on houses for insert to authenticated with check (created_by = auth.uid());
create policy "houses update" on houses for update to authenticated using (is_house_member(id)) with check (is_house_member(id));

-- Membership: see your houses' members; add yourself only to a house you created
-- (joining someone else's house goes through join_house() below).
drop policy if exists "members read" on house_members;
drop policy if exists "members insert" on house_members;
drop policy if exists "members delete" on house_members;
create policy "members read"   on house_members for select to authenticated using (user_id = auth.uid() or is_house_member(house_id));
create policy "members insert" on house_members for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from houses h where h.id = house_id and h.created_by = auth.uid())
);
create policy "members delete" on house_members for delete to authenticated using (user_id = auth.uid());

-- Every per-house table: full access for members of that house, nobody else.
do $$
declare t text;
begin
  foreach t in array array['expenses','shopping_lists','food_orders','chores','house_notes','bills','album_photos'] loop
    execute format('drop policy if exists "house members" on %I', t);
    execute format(
      'create policy "house members" on %I for all to authenticated using (is_house_member(house_id)) with check (is_house_member(house_id))', t);
  end loop;
end $$;

drop policy if exists "house members" on shopping_items;
create policy "house members" on shopping_items for all to authenticated using (
  exists (select 1 from shopping_lists l where l.id = list_id and is_house_member(l.house_id))
) with check (
  exists (select 1 from shopping_lists l where l.id = list_id and is_house_member(l.house_id))
);

-- ─── Join a house with an invite code ────────────────────────────────────────
create or replace function join_house(code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare h uuid;
begin
  if auth.uid() is null then raise exception 'not logged in'; end if;
  select id into h from houses where invite_code = upper(trim(code));
  if h is null then raise exception 'invalid invite code'; end if;
  insert into house_members (house_id, user_id) values (h, auth.uid()) on conflict do nothing;
  return h;
end; $$;
revoke all on function join_house(text) from public, anon;
grant execute on function join_house(text) to authenticated;

-- ─── Auto-create a profile when someone signs up ─────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'name', ''), initcap(split_part(new.email, '@', 1))),
          new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
