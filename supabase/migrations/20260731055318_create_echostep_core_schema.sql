-- ============================================================
-- EchoStep AI :: core schema
-- profiles / exit_tickets / vocabulary  (+ RLS, signup trigger)
-- ============================================================

-- ---------- enums ----------
create type public.esp_category as enum (
  'Engineering', 'Business', 'Healthcare', 'Hospitality', 'General'
);

create type public.cefr_level as enum ('A2', 'B1', 'B2', 'C1');

create type public.mode_type as enum ('voice', 'text');

create type public.fluency_level as enum ('Beginner', 'Intermediate', 'Advanced');

create type public.accuracy_level as enum ('Needs Work', 'Good', 'Excellent');

-- ---------- profiles ----------
create table public.profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  name                     text                not null default '학습자',
  major_or_job             public.esp_category not null default 'General',
  cefr_level               public.cefr_level   not null default 'B1',
  preferred_mode           public.mode_type    not null default 'voice',
  coins                    integer             not null default 0 check (coins >= 0),
  streak_days              integer             not null default 0 check (streak_days >= 0),
  total_study_minutes      integer             not null default 0 check (total_study_minutes >= 0),
  completed_sessions_count integer             not null default 0 check (completed_sessions_count >= 0),
  badges                   text[]              not null default '{}',
  last_session_date        date,
  created_at               timestamptz         not null default now(),
  updated_at               timestamptz         not null default now()
);

comment on table public.profiles is '학습자 프로필 및 게이미피케이션 지표. auth.users와 1:1.';

-- ---------- exit_tickets ----------
create table public.exit_tickets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  scenario_id     text                  not null,
  scenario_title  text                  not null,
  overall_score   integer               not null check (overall_score between 0 and 100),
  fluency_level   public.fluency_level   not null default 'Intermediate',
  accuracy_level  public.accuracy_level  not null default 'Good',
  top_mistakes    jsonb                 not null default '[]'::jsonb,
  encouragement   text                  not null default '',
  caf_fluency     integer               not null default 0 check (caf_fluency between 0 and 100),
  caf_accuracy    integer               not null default 0 check (caf_accuracy between 0 and 100),
  caf_complexity  integer               not null default 0 check (caf_complexity between 0 and 100),
  self_reflection text                  not null default '',
  created_at      timestamptz           not null default now()
);

comment on table public.exit_tickets is 'AI가 생성한 세션별 성찰 일지(Exit Ticket).';

create index exit_tickets_user_created_idx
  on public.exit_tickets (user_id, created_at desc);

-- ---------- vocabulary ----------
create table public.vocabulary (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  exit_ticket_id   uuid references public.exit_tickets (id) on delete set null,
  expression       text                not null,
  meaning          text                not null default '',
  example_sentence text                not null default '',
  esp_category     public.esp_category not null default 'General',
  mastered         boolean             not null default false,
  created_at       timestamptz         not null default now()
);

comment on table public.vocabulary is '세션에서 추출된 학습자별 어휘/표현 저장소.';

create index vocabulary_user_created_idx
  on public.vocabulary (user_id, created_at desc);

create index vocabulary_ticket_idx
  on public.vocabulary (exit_ticket_id);

-- ---------- updated_at trigger ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------- auto-create profile on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, major_or_job, cefr_level)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'major_or_job', '')::public.esp_category,
      'General'
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'cefr_level', '')::public.cefr_level,
      'B1'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RLS ----------
alter table public.profiles     enable row level security;
alter table public.exit_tickets enable row level security;
alter table public.vocabulary   enable row level security;

-- profiles: owner-only
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- exit_tickets: owner-only
create policy "exit_tickets_select_own" on public.exit_tickets
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "exit_tickets_insert_own" on public.exit_tickets
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "exit_tickets_update_own" on public.exit_tickets
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "exit_tickets_delete_own" on public.exit_tickets
  for delete to authenticated using ((select auth.uid()) = user_id);

-- vocabulary: owner-only
create policy "vocabulary_select_own" on public.vocabulary
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "vocabulary_insert_own" on public.vocabulary
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "vocabulary_update_own" on public.vocabulary
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "vocabulary_delete_own" on public.vocabulary
  for delete to authenticated using ((select auth.uid()) = user_id);
