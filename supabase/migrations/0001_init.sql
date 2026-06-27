-- Aarya Hub schema. Two-person private app: RLS is enabled but policies are
-- permissive (anyone with the anon key can read/write). The real "lock" is the
-- password gate + not sharing the URL. Tighten later if you ever need to.

-- ---------- Couple features ----------
create table if not exists public.love_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  body text not null,
  author text not null,
  hearts int not null default 0
);

create table if not exists public.love_reasons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  text text not null,
  author text not null
);

create table if not exists public.date_ideas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  text text not null,
  category text not null default 'Date night',
  done boolean not null default false
);

create table if not exists public.important_dates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  emoji text not null default '🎂',
  month int not null,
  day int not null
);

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  description text not null default '',
  event_date date not null,
  photo_url text
);

create table if not exists public.romcoms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  genre text not null default 'Other',
  status text not null default 'to-watch',
  rating int not null default 0,
  notes text not null default ''
);
-- for projects created before the genre column existed:
alter table public.romcoms add column if not exists genre text not null default 'Other';

-- ---------- Realtime games ----------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  code text not null,
  game_type text not null,
  state jsonb not null default '{}'::jsonb,
  players jsonb not null default '{}'::jsonb,
  turn text,
  winner text
);
create unique index if not exists rooms_code_game_idx on public.rooms (code, game_type);

-- ---------- AI companion ----------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  role text not null,            -- 'user' | 'assistant'
  content text not null,
  speaker text                   -- which identity sent a 'user' message
);

-- Real example messages in YOUR voice, used as few-shot for the AI persona.
create table if not exists public.style_samples (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  text text not null
);

-- ---------- RLS (permissive for a private 2-person app) ----------
do $$
declare t text;
begin
  foreach t in array array[
    'love_notes','love_reasons','date_ideas','important_dates',
    'timeline_events','romcoms','rooms','chat_messages','style_samples'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists anon_all on public.%I;', t);
    execute format(
      'create policy anon_all on public.%I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ---------- Realtime publication ----------
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.love_notes;
alter publication supabase_realtime add table public.love_reasons;
alter publication supabase_realtime add table public.date_ideas;
alter publication supabase_realtime add table public.important_dates;
alter publication supabase_realtime add table public.timeline_events;
alter publication supabase_realtime add table public.romcoms;
alter publication supabase_realtime add table public.chat_messages;

-- ---------- Storage bucket for memory photos ----------
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

drop policy if exists memories_read on storage.objects;
create policy memories_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'memories');

drop policy if exists memories_write on storage.objects;
create policy memories_write on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'memories');
