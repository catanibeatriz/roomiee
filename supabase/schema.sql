-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Roomiee.app — database schema                                             ║
-- ║  Run this in your Supabase project: SQL Editor → paste → Run.              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- ─── Houses ──────────────────────────────────────────────────────────────────
create table if not exists houses (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  base_currency text not null default 'EUR',
  is_pro        boolean not null default false,   -- Roomiee Pro entitlement (per house)
  invite_code   text unique default substr(md5(random()::text), 1, 8),
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

-- ─── Profiles (1:1 with auth.users) ──────────────────────────────────────────
create table if not exists profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  name               text not null,
  avatar             text,
  color              text default '#4DA3FF',
  preferred_currency text default 'EUR',
  bizum_phone        text,
  paypal_me          text,
  revolut_tag        text,
  created_at         timestamptz not null default now()
);

-- ─── Membership (which users belong to which house) ──────────────────────────
create table if not exists house_members (
  house_id   uuid references houses(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (house_id, user_id)
);

-- ─── Expenses ────────────────────────────────────────────────────────────────
create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  house_id    uuid references houses(id) on delete cascade,
  title       text not null,
  amount      numeric(12,2) not null,
  currency    text not null default 'EUR',
  paid_by     uuid references profiles(id),
  split_with  uuid[] not null,
  category    text not null default 'other',
  date        date not null default current_date,
  settled     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ─── Shopping ────────────────────────────────────────────────────────────────
create table if not exists shopping_lists (
  id          uuid primary key default gen_random_uuid(),
  house_id    uuid references houses(id) on delete cascade,
  name        text not null,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create table if not exists shopping_items (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid references shopping_lists(id) on delete cascade,
  name        text not null,
  quantity    text,
  added_by    uuid references profiles(id),
  checked     boolean not null default false,
  checked_by  uuid references profiles(id)
);

-- ─── Food orders ─────────────────────────────────────────────────────────────
create table if not exists food_orders (
  id           uuid primary key default gen_random_uuid(),
  house_id     uuid references houses(id) on delete cascade,
  platform     text not null,
  restaurant   text not null,
  items        jsonb not null,        -- [{name, price, orderedBy}]
  delivery_fee numeric(12,2) default 0,
  tip          numeric(12,2) default 0,
  currency     text not null default 'EUR',
  date         date not null default current_date,
  settled      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ─── Chores ──────────────────────────────────────────────────────────────────
create table if not exists chores (
  id           uuid primary key default gen_random_uuid(),
  house_id     uuid references houses(id) on delete cascade,
  title        text not null,
  assigned_to  uuid references profiles(id),
  due_date     date,
  completed    boolean not null default false,
  completed_at date,
  recurring    text not null default 'none',
  created_at   timestamptz not null default now()
);

-- ─── House notes / board ─────────────────────────────────────────────────────
create table if not exists house_notes (
  id          uuid primary key default gen_random_uuid(),
  house_id    uuid references houses(id) on delete cascade,
  title       text not null,
  body        text,
  pinned      boolean not null default false,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Row-Level Security: a user can only touch data for houses they belong to  ║
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

-- Helper: is the current user a member of a given house?
create or replace function is_house_member(h uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from house_members
    where house_id = h and user_id = auth.uid()
  );
$$;

-- Profiles: everyone can read (to show roommate names), you edit only your own.
create policy "profiles readable"      on profiles for select using (true);
create policy "edit own profile"       on profiles for update using (id = auth.uid());
create policy "insert own profile"     on profiles for insert with check (id = auth.uid());

-- Houses: members can read; creator manages.
create policy "members read house"     on houses for select using (is_house_member(id));
create policy "create house"           on houses for insert with check (created_by = auth.uid());
create policy "creator updates house"  on houses for update using (created_by = auth.uid());

-- Membership
create policy "read own memberships"   on house_members for select using (user_id = auth.uid() or is_house_member(house_id));
create policy "join house"             on house_members for insert with check (user_id = auth.uid());

-- Generic per-house tables: full access for members of that house.
create policy "member rw expenses"       on expenses       for all using (is_house_member(house_id)) with check (is_house_member(house_id));
create policy "member rw shopping_lists" on shopping_lists for all using (is_house_member(house_id)) with check (is_house_member(house_id));
create policy "member rw food_orders"    on food_orders    for all using (is_house_member(house_id)) with check (is_house_member(house_id));
create policy "member rw chores"         on chores         for all using (is_house_member(house_id)) with check (is_house_member(house_id));
create policy "member rw house_notes"    on house_notes    for all using (is_house_member(house_id)) with check (is_house_member(house_id));

-- Shopping items inherit access via their list's house.
create policy "member rw shopping_items" on shopping_items for all using (
  exists (select 1 from shopping_lists l where l.id = list_id and is_house_member(l.house_id))
) with check (
  exists (select 1 from shopping_lists l where l.id = list_id and is_house_member(l.house_id))
);

-- ─── Auto-create a profile row when a user signs up ──────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, avatar)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Roommate'),
          upper(substr(coalesce(new.raw_user_meta_data->>'name', 'R'), 1, 1)));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
