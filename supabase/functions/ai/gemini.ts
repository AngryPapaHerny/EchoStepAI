/**
 * Gemini REST 호출 헬퍼.
 *
 * npm 패키지 대신 REST 엔드포인트를 직접 호출한다. Deno 런타임에서
 * 의존성 해석 실패 없이 동작하고 콜드 스타트가 짧다.
 */

const API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.1-flash-lite";

/** GEMINI_API_KEY 시크릿이 등록되지 않았으면 각 핸들러는 데모 응답으로 폴백한다. */
export function hasGeminiKey(): boolean {
  return API_KEY.length > 0;
}

/** 이전 대화 한 턴. Gemini 의 role 규약을 그대로 쓴다(AI 는 "model"). */
export interface HistoryTurn {
  role: "user" | "model";
  text: string;
}

export interface GenerateOptions {
  /** 이번 턴의 사용자 입력. contents 의 마지막 user 파트가 된다. */
  prompt: string;
  /**
   * 이전 대화 턴. 하나의 문자열로 이어붙이지 않고 실제 role 턴으로 보낸다.
   * 모델이 화자를 혼동하지 않고, 공통 접두사에 프롬프트 캐시가 걸린다.
   */
  history?: HistoryTurn[];
  systemInstruction?: string;
  /** OpenAPI 형식 스키마. 지정하면 JSON 모드로 응답한다. */
  responseSchema?: Record<string, unknown>;
}

/**
 * Gemini 는 contents 가 user 턴으로 시작하고 role 이 번갈아 나오기를 기대한다.
 * 우리 대화는 AI 인사말로 시작할 수 있으므로 그 형태로 맞춰준다.
 */
function normalizeHistory(history: HistoryTurn[]): HistoryTurn[] {
  const turns: HistoryTurn[] = [];

  for (const turn of history) {
    if (!turn.text) continue;

    const previous = turns[turns.length - 1];
    if (previous && previous.role === turn.role) {
      previous.text = `${previous.text}\n${turn.text}`;
      continue;
    }

    turns.push({ role: turn.role, text: turn.text });
  }

  // AI 인사말로 시작하면 앞에 중립적인 무대 지시를 하나 끼워 넣는다.
  if (turns[0]?.role === "model") {
    turns.unshift({ role: "user", text: "[Session started.]" });
  }

  return turns;
}

export async function generate(options: GenerateOptions): Promise<string> {
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const history = normalizeHistory(options.history ?? []);

  const body: Record<string, unknown> = {
    contents: [
      ...history.map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      { role: "user", parts: [{ text: options.prompt }] },
    ],
  };

  if (options.systemInstruction) {
    body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }

  if (options.responseSchema) {
    body.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: options.responseSchema,
    };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
      "User-Agent": "echostep-ai",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini ${response.status}: ${detail.slice(0, 500)}`);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];

  return parts
    .map((part: { text?: string }) => part.text ?? "")
    .join("")
    .trim();
}

/** JSON 모드 응답을 파싱한다. 모델이 코드펜스를 덧붙이는 경우까지 방어한다. */
export function parseJson<T>(text: string): T {
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "");
  return JSON.parse(cleaned) as T;
}
