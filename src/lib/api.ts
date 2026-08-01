/**
 * Supabase Edge Function(`ai`) 호출 래퍼.
 *
 * 기존 Express의 `/api/chat/*` 를 대체한다. `functions.invoke` 가 로그인 세션의
 * access token을 자동으로 Authorization 헤더에 실어 보내므로, Edge Function 쪽
 * verify_jwt 가 이를 검증한다. Gemini 키는 서버에만 존재한다.
 */

import { supabase } from './supabase';
import type {
  AccuracyLevel,
  CAFData,
  CEFRLevel,
  ChatMessage,
  ESPCategory,
  FluencyLevel,
  MistakeCorrection,
  ModeType,
  Scenario,
  UserProfile,
} from '../types';

async function invoke<T>(route: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(`ai/${route}`, {
    body,
  });

  if (error) throw error;
  if (data === null) throw new Error(`Empty response from ai/${route}`);

  return data;
}

// ────────────────────────────────────────────────────────────
// 1. 롤플레이 한 턴
// ────────────────────────────────────────────────────────────

export interface RoleplayResponse {
  aiResponse: string;
  koreanTranslation: string;
  suggestedReplies: string[];
  hint: string;
  nudgeCorrection: string | null;
}

export function requestRoleplayTurn(params: {
  scenario: Scenario;
  user: UserProfile;
  conversationHistory: ChatMessage[];
  userMessage: string;
  mode: ModeType;
}): Promise<RoleplayResponse> {
  const { scenario, user, conversationHistory, userMessage, mode } = params;

  return invoke<RoleplayResponse>('roleplay', {
    scenarioTitle: scenario.title,
    scenarioGoal: scenario.defaultGoal,
    aiRole: scenario.aiRole,
    userRole: scenario.userRole,
    userMajorOrJob: user.majorOrJob,
    cefrLevel: user.cefrLevel,
    conversationHistory: conversationHistory.map((m) => ({
      role: m.sender,
      text: m.text,
    })),
    userMessage,
    mode,
  });
}

// ────────────────────────────────────────────────────────────
// 2. Exit Ticket 분석
// ────────────────────────────────────────────────────────────

export interface ExitTicketAnalysis {
  overallScore: number;
  fluencyLevel: FluencyLevel;
  accuracyLevel: AccuracyLevel;
  topMistakes: MistakeCorrection[];
  newExpressions: {
    expression: string;
    meaning: string;
    exampleSentence: string;
    espCategory: string;
  }[];
  encouragement: string;
  cafData: CAFData;
}

export function requestExitTicketAnalysis(params: {
  scenarioTitle: string;
  transcript: ChatMessage[];
  userMajorOrJob: ESPCategory;
  /** 채점은 원어민이 아니라 이 레벨의 기대 수준을 기준으로 이뤄진다. */
  cefrLevel: CEFRLevel;
  selfReflection: string;
}): Promise<ExitTicketAnalysis> {
  return invoke<ExitTicketAnalysis>('exit-ticket', {
    scenarioTitle: params.scenarioTitle,
    transcript: params.transcript.map((m) => ({
      sender: m.sender,
      text: m.text,
    })),
    userMajorOrJob: params.userMajorOrJob,
    cefrLevel: params.cefrLevel,
    selfReflection: params.selfReflection,
  });
}

// ────────────────────────────────────────────────────────────
// 3. 빠른 번역
// ────────────────────────────────────────────────────────────

export function requestTranslation(text: string): Promise<{ translation: string }> {
  return invoke<{ translation: string }>('translate', { text });
}
