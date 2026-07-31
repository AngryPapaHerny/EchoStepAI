-- ============================================================
-- CAF 일별 추이 뷰 + Exit Ticket 원자적 저장 RPC
-- (RPC 본문은 20260731060032 마이그레이션에서 배지 부여 로직으로 확장된다)
-- ============================================================

-- ---------- 일별 CAF 추이 (RLS는 exit_tickets 정책을 그대로 상속) ----------
create view public.caf_daily
with (security_invoker = on) as
select
  user_id,
  (created_at at time zone 'Asia/Seoul')::date as day,
  round(avg(caf_fluency))::int    as fluency,
  round(avg(caf_accuracy))::int   as accuracy,
  round(avg(caf_complexity))::int as complexity,
  count(*)::int                   as sessions
from public.exit_tickets
group by user_id, (created_at at time zone 'Asia/Seoul')::date;

comment on view public.caf_daily is '학습자별 일 단위 CAF(유창성/정확성/복잡성) 평균 추이.';

-- ---------- Exit Ticket + 어휘 + 프로필 지표를 한 트랜잭션으로 저장 ----------
create or replace function public.save_exit_ticket(
  p_scenario_id     text,
  p_scenario_title  text,
  p_overall_score   integer,
  p_fluency_level   text,
  p_accuracy_level  text,
  p_top_mistakes    jsonb,
  p_new_expressions jsonb,
  p_encouragement   text,
  p_caf             jsonb,
  p_self_reflection text
)
returns public.exit_tickets
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_ticket public.exit_tickets;
  v_today  date := (now() at time zone 'Asia/Seoul')::date;
  v_last   date;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  insert into public.exit_tickets (
    user_id, scenario_id, scenario_title, overall_score,
    fluency_level, accuracy_level, top_mistakes, encouragement,
    caf_fluency, caf_accuracy, caf_complexity, self_reflection
  )
  values (
    v_uid,
    coalesce(p_scenario_id, 'custom'),
    coalesce(p_scenario_title, '역할극 과업'),
    least(greatest(coalesce(p_overall_score, 0), 0), 100),
    coalesce(nullif(p_fluency_level, ''), 'Intermediate')::public.fluency_level,
    coalesce(nullif(p_accuracy_level, ''), 'Good')::public.accuracy_level,
    coalesce(p_top_mistakes, '[]'::jsonb),
    coalesce(p_encouragement, ''),
    least(greatest(coalesce((p_caf ->> 'fluencyScore')::int, 0), 0), 100),
    least(greatest(coalesce((p_caf ->> 'accuracyScore')::int, 0), 0), 100),
    least(greatest(coalesce((p_caf ->> 'complexityScore')::int, 0), 0), 100),
    coalesce(p_self_reflection, '')
  )
  returning * into v_ticket;

  insert into public.vocabulary (
    user_id, exit_ticket_id, expression, meaning, example_sentence, esp_category
  )
  select
    v_uid,
    v_ticket.id,
    trim(e ->> 'expression'),
    coalesce(e ->> 'meaning', ''),
    coalesce(e ->> 'exampleSentence', ''),
    coalesce(nullif(e ->> 'espCategory', '')::public.esp_category, 'General')
  from jsonb_array_elements(coalesce(p_new_expressions, '[]'::jsonb)) as e
  where nullif(trim(e ->> 'expression'), '') is not null
    and not exists (
      select 1 from public.vocabulary v
      where v.user_id = v_uid
        and lower(v.expression) = lower(trim(e ->> 'expression'))
    );

  select last_session_date into v_last
  from public.profiles where id = v_uid;

  update public.profiles
  set completed_sessions_count = completed_sessions_count + 1,
      total_study_minutes      = total_study_minutes + 5,
      coins                    = coins + 20,
      streak_days = case
                      when v_last = v_today     then greatest(streak_days, 1)
                      when v_last = v_today - 1 then streak_days + 1
                      else 1
                    end,
      last_session_date = v_today
  where id = v_uid;

  return v_ticket;
end;
$$;

comment on function public.save_exit_ticket is
  'Exit Ticket 저장 + 신규 표현 어휘 적재 + 프로필 지표/연속일 갱신을 한 트랜잭션으로 처리.';

revoke all on function public.save_exit_ticket(
  text, text, integer, text, text, jsonb, jsonb, text, jsonb, text
) from public, anon;

grant execute on function public.save_exit_ticket(
  text, text, integer, text, text, jsonb, jsonb, text, jsonb, text
) to authenticated;
