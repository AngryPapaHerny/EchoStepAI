/**
 * Supabase 데이터 접근 계층.
 *
 * 이전에는 localStorage에 저장하던 프로필 / Exit Ticket / 어휘 / CAF 추이를
 * 모두 Postgres에 저장한다. 모든 테이블에 RLS가 걸려 있어 각 학습자는
 * 자신의 행만 읽고 쓸 수 있다 (별도의 user_id 필터가 필요 없다).
 */

import { supabase } from './supabase';
import type { Json } from './database.types';
import type {
  CAFHistoryPoint,
  EditableProfile,
  ExitTicket,
  ExitTicketDraft,
  MistakeCorrection,
  UserProfile,
  VocabularyItem,
} from '../types';

// ────────────────────────────────────────────────────────────
// 표시용 날짜 헬퍼
// ────────────────────────────────────────────────────────────

const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** ISO 타임스탬프를 "오늘 / 어제 / N일 전 / 2026. 7. 3." 형태로 바꾼다. */
export function toRelativeDate(iso: string): string {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const days = Math.round(
    (startOfDay(new Date()) - startOfDay(new Date(iso))) / 86_400_000
  );

  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 14) return '지난주';
  return new Date(iso).toLocaleDateString('ko-KR');
}

function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

// ────────────────────────────────────────────────────────────
// 행 ↔ 앱 타입 매핑
// ────────────────────────────────────────────────────────────

interface VocabularyRow {
  id: string;
  expression: string;
  meaning: string;
  example_sentence: string;
  esp_category: string;
  mastered: boolean;
  created_at: string;
}

interface ExitTicketRow {
  id: string;
  scenario_id: string;
  scenario_title: string;
  overall_score: number;
  fluency_level: ExitTicket['fluencyLevel'];
  accuracy_level: ExitTicket['accuracyLevel'];
  top_mistakes: Json;
  encouragement: string;
  caf_fluency: number;
  caf_accuracy: number;
  caf_complexity: number;
  self_reflection: string;
  created_at: string;
  vocabulary?: VocabularyRow[];
}

function mapVocabulary(row: VocabularyRow): VocabularyItem {
  return {
    id: row.id,
    expression: row.expression,
    meaning: row.meaning,
    exampleSentence: row.example_sentence,
    espCategory: row.esp_category,
    dateAdded: toDateOnly(row.created_at),
    mastered: row.mastered,
  };
}

function mapExitTicket(row: ExitTicketRow): ExitTicket {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    scenarioTitle: row.scenario_title,
    overallScore: row.overall_score,
    fluencyLevel: row.fluency_level,
    accuracyLevel: row.accuracy_level,
    topMistakes: Array.isArray(row.top_mistakes)
      ? (row.top_mistakes as unknown as MistakeCorrection[])
      : [],
    newExpressions: (row.vocabulary ?? []).map(mapVocabulary),
    encouragement: row.encouragement,
    cafData: {
      fluencyScore: row.caf_fluency,
      accuracyScore: row.caf_accuracy,
      complexityScore: row.caf_complexity,
    },
    selfReflection: row.self_reflection,
    createdAt: row.created_at,
    date: toRelativeDate(row.created_at),
  };
}

// ────────────────────────────────────────────────────────────
// 프로필
// ────────────────────────────────────────────────────────────

export async function fetchProfile(): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    majorOrJob: data.major_or_job,
    cefrLevel: data.cefr_level,
    preferredMode: data.preferred_mode,
    coins: data.coins,
    streakDays: data.streak_days,
    totalStudyMinutes: data.total_study_minutes,
    completedSessionsCount: data.completed_sessions_count,
    badges: data.badges,
  };
}

export async function updateProfile(
  userId: string,
  patch: Partial<EditableProfile>
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.majorOrJob !== undefined && { major_or_job: patch.majorOrJob }),
      ...(patch.cefrLevel !== undefined && { cefr_level: patch.cefrLevel }),
      ...(patch.preferredMode !== undefined && {
        preferred_mode: patch.preferredMode,
      }),
    })
    .eq('id', userId);

  if (error) throw error;
}

// ────────────────────────────────────────────────────────────
// Exit Ticket
// ────────────────────────────────────────────────────────────

const EXIT_TICKET_SELECT = `
  id, scenario_id, scenario_title, overall_score,
  fluency_level, accuracy_level, top_mistakes, encouragement,
  caf_fluency, caf_accuracy, caf_complexity, self_reflection, created_at,
  vocabulary ( id, expression, meaning, example_sentence, esp_category, mastered, created_at )
`;

export async function fetchExitTickets(): Promise<ExitTicket[]> {
  const { data, error } = await supabase
    .from('exit_tickets')
    .select(EXIT_TICKET_SELECT)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data as unknown as ExitTicketRow[]).map(mapExitTicket);
}

/**
 * Exit Ticket 저장. 티켓 삽입 + 신규 표현의 어휘 적재 + 프로필 지표/배지 갱신을
 * `save_exit_ticket` RPC 하나로 원자적으로 처리한다.
 */
export async function saveExitTicket(draft: ExitTicketDraft): Promise<void> {
  const { error } = await supabase.rpc('save_exit_ticket', {
    p_scenario_id: draft.scenarioId,
    p_scenario_title: draft.scenarioTitle,
    p_overall_score: draft.overallScore,
    p_fluency_level: draft.fluencyLevel,
    p_accuracy_level: draft.accuracyLevel,
    p_top_mistakes: draft.topMistakes as unknown as Json,
    p_new_expressions: draft.newExpressions.map((item) => ({
      expression: item.expression,
      meaning: item.meaning,
      exampleSentence: item.exampleSentence,
      espCategory: item.espCategory,
    })) as unknown as Json,
    p_encouragement: draft.encouragement,
    p_caf: draft.cafData as unknown as Json,
    p_self_reflection: draft.selfReflection,
  });

  if (error) throw error;
}

// ────────────────────────────────────────────────────────────
// 어휘 저장소
// ────────────────────────────────────────────────────────────

export async function fetchVocabulary(): Promise<VocabularyItem[]> {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('id, expression, meaning, example_sentence, esp_category, mastered, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data as VocabularyRow[]).map(mapVocabulary);
}

export async function setVocabularyMastered(
  id: string,
  mastered: boolean
): Promise<void> {
  const { error } = await supabase
    .from('vocabulary')
    .update({ mastered })
    .eq('id', id);

  if (error) throw error;
}

// ────────────────────────────────────────────────────────────
// CAF 추이
// ────────────────────────────────────────────────────────────

/** 최근 7일의 CAF 평균 추이. 세션이 없는 날은 제외된다. */
export async function fetchCAFHistory(): Promise<CAFHistoryPoint[]> {
  const { data, error } = await supabase
    .from('caf_daily')
    .select('day, fluency, accuracy, complexity')
    .order('day', { ascending: false })
    .limit(7);

  if (error) throw error;

  return (data ?? [])
    .filter((row): row is typeof row & { day: string } => row.day !== null)
    .reverse()
    .map((row) => ({
      date: KOREAN_WEEKDAYS[new Date(`${row.day}T00:00:00`).getDay()],
      fluency: row.fluency ?? 0,
      accuracy: row.accuracy ?? 0,
      complexity: row.complexity ?? 0,
    }));
}

// ────────────────────────────────────────────────────────────
// 한 번에 불러오기
// ────────────────────────────────────────────────────────────

export interface LearnerData {
  profile: UserProfile;
  exitTickets: ExitTicket[];
  vocabulary: VocabularyItem[];
  cafHistory: CAFHistoryPoint[];
}

export async function fetchLearnerData(): Promise<LearnerData> {
  const [profile, exitTickets, vocabulary, cafHistory] = await Promise.all([
    fetchProfile(),
    fetchExitTickets(),
    fetchVocabulary(),
    fetchCAFHistory(),
  ]);

  return { profile, exitTickets, vocabulary, cafHistory };
}
