-- ============================================================
-- 한 번의 저장 안에 같은 표현이 두 번 들어오면 NOT EXISTS 만으로는
-- 걸러지지 않는다 (문장 시작 시점의 스냅샷을 보기 때문).
-- distinct on 으로 배치 내부 중복까지 제거한다.
-- ============================================================

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
  v_earned text[];
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

  -- 새 표현 적재: 배치 내부 중복 + 이미 보유한 표현을 모두 제거
  insert into public.vocabulary (
    user_id, exit_ticket_id, expression, meaning, example_sentence, esp_category
  )
  select distinct on (lower(candidate.expression))
    v_uid,
    v_ticket.id,
    candidate.expression,
    candidate.meaning,
    candidate.example_sentence,
    candidate.esp_category
  from (
    select
      trim(e ->> 'expression')                      as expression,
      coalesce(e ->> 'meaning', '')                 as meaning,
      coalesce(e ->> 'exampleSentence', '')         as example_sentence,
      coalesce(
        nullif(e ->> 'espCategory', '')::public.esp_category,
        'General'
      )                                             as esp_category
    from jsonb_array_elements(coalesce(p_new_expressions, '[]'::jsonb)) as e
  ) as candidate
  where nullif(candidate.expression, '') is not null
    and not exists (
      select 1 from public.vocabulary v
      where v.user_id = v_uid
        and lower(v.expression) = lower(candidate.expression)
    );

  -- 프로필 지표 갱신 (연속 학습일 포함)
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

  -- 달성 조건을 만족한 배지 계산
  select array_remove(array[
    case when p.completed_sessions_count >= 1  then '첫 롤플레이'     end,
    case when p.completed_sessions_count >= 10 then '과업 10회 완수'  end,
    case when p.completed_sessions_count >= 50 then '과업 50회 완수'  end,
    case when p.streak_days >= 5               then '연속 학습 5일'   end,
    case when p.streak_days >= 30              then '연속 학습 30일'  end,
    case when (select count(*) from public.exit_tickets t
               where t.user_id = v_uid and t.self_reflection <> '') >= 5
         then '성찰 기록가' end,
    case when (select count(*) from public.vocabulary v
               where v.user_id = v_uid) >= 20
         then '어휘 수집가' end,
    case when (select count(*) from public.vocabulary v
               where v.user_id = v_uid and v.mastered) >= 20
         then '암기 마스터' end,
    case when (select max(t.caf_fluency) from public.exit_tickets t
               where t.user_id = v_uid) >= 90
         then '유창성 90 돌파' end,
    case when (select max(t.overall_score) from public.exit_tickets t
               where t.user_id = v_uid) >= 95
         then '완벽에 가까운 과업' end
  ], null)
  into v_earned
  from public.profiles p
  where p.id = v_uid;

  update public.profiles
  set badges = v_earned
  where id = v_uid
    and badges is distinct from v_earned;

  return v_ticket;
end;
$$;
