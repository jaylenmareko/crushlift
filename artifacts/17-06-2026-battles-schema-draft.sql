-- Train Maxxing — Battle + Friends schema (DRAFT — NOT YET APPLIED)
-- Target: live `trainmaxxing` DB (project ref cheanydnmvqdvsexxdav)
-- Status: draft. Do NOT run against production until Jaylen approves.
-- Apply via: Supabase dashboard → SQL editor (project cheanydnmvqdvsexxdav).
--
-- Design notes:
--  * Reuses the existing pr_verifications chain as battle "proof": each side links a
--    verified PR row instead of re-implementing video/photo verification.
--  * W/L record is DERIVED from completed battles (see view), not stored on profiles —
--    single source of truth, no drift.
--  * kind = 'class'  -> same weight class, winner by raw value (most weight / reps)
--    kind = 'superfight' -> cross-class, winner by DOTS (bodyweight snapshots below)
--  * Friends-by-username already works (profiles.username exists); this adds add/remove.

-- ──────────────────────────────────────────────────────────────────────────
-- friendships
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.friendships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,  -- requester
  friend_id   uuid not null references auth.users(id) on delete cascade,  -- target
  status      text not null default 'pending' check (status in ('pending','accepted')),
  created_at  timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

create index if not exists friendships_user_idx   on public.friendships(user_id);
create index if not exists friendships_friend_idx on public.friendships(friend_id);

alter table public.friendships enable row level security;

create policy "friendships: participants can read"
  on public.friendships for select
  using (auth.uid() in (user_id, friend_id));

create policy "friendships: requester can create"
  on public.friendships for insert
  with check (user_id = auth.uid());

create policy "friendships: participant can update (accept)"
  on public.friendships for update
  using (auth.uid() in (user_id, friend_id))
  with check (auth.uid() in (user_id, friend_id));

create policy "friendships: participant can delete (unfriend/cancel)"
  on public.friendships for delete
  using (auth.uid() in (user_id, friend_id));

-- ──────────────────────────────────────────────────────────────────────────
-- battles
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.battles (
  id                 uuid primary key default gen_random_uuid(),
  challenger_id      uuid not null references auth.users(id) on delete cascade,
  opponent_id        uuid not null references auth.users(id) on delete cascade,
  lift               text not null,                                   -- one of the Big 6
  format             text not null check (format in ('weight','reps')),
  kind               text not null default 'class' check (kind in ('class','superfight')),
  status             text not null default 'pending'
                       check (status in ('pending','active','completed','declined','expired')),
  -- each side's posted result + the verified PR backing it
  challenger_value   numeric,                                         -- lbs or reps per format
  opponent_value     numeric,
  challenger_pr_id   uuid references public.pr_verifications(id),
  opponent_pr_id     uuid references public.pr_verifications(id),
  -- bodyweight snapshots (lbs) at battle time — needed to score superfights via DOTS
  challenger_bw      numeric,
  opponent_bw        numeric,
  winner_id          uuid references auth.users(id),                  -- null until completed; null+completed = draw
  created_at         timestamptz not null default now(),
  responded_at       timestamptz,
  completed_at       timestamptz,
  check (challenger_id <> opponent_id)
);

create index if not exists battles_challenger_idx on public.battles(challenger_id);
create index if not exists battles_opponent_idx   on public.battles(opponent_id);
create index if not exists battles_status_idx     on public.battles(status);

alter table public.battles enable row level security;

create policy "battles: participants can read"
  on public.battles for select
  using (auth.uid() in (challenger_id, opponent_id));

create policy "battles: challenger can create"
  on public.battles for insert
  with check (challenger_id = auth.uid());

-- Participants can update (accept/decline, post their result). App-level logic guards
-- which fields each side may change; tighten with column-level rules later if needed.
create policy "battles: participants can update"
  on public.battles for update
  using (auth.uid() in (challenger_id, opponent_id))
  with check (auth.uid() in (challenger_id, opponent_id));

-- ──────────────────────────────────────────────────────────────────────────
-- Derived W/L record + class ranking (query, not stored)
-- ──────────────────────────────────────────────────────────────────────────
-- Per-user record from completed battles. Leaderboards order by wins within a
-- weight class (computed app-side from profiles.weight), or by DOTS for the Open board.
create or replace view public.user_records as
select
  u.id as user_id,
  count(*) filter (where b.winner_id = u.id)                                   as wins,
  count(*) filter (where b.status = 'completed' and b.winner_id is not null
                          and b.winner_id <> u.id)                              as losses
from auth.users u
left join public.battles b
  on u.id in (b.challenger_id, b.opponent_id) and b.status = 'completed'
group by u.id;

-- ──────────────────────────────────────────────────────────────────────────
-- Rollback (if needed)
-- ──────────────────────────────────────────────────────────────────────────
-- drop view if exists public.user_records;
-- drop table if exists public.battles;
-- drop table if exists public.friendships;
