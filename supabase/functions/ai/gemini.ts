/**
 * Gemini REST 호출 헬퍼.
 *
 * npm 패키지 대신 REST 엔드포인트를 직접 호출한다. Deno 런타임에서
 * 의존성 해석 실패 없이 동작하고 콜드 스타트가 짧다.
 */

const API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.6-flash";

/** GEMINI_API_KEY 시크릿이 등록되지 않았으면 각 핸들러는 데모 응답으로 폴백한다. */
export function hasGeminiKey(): boolean {
  return API_KEY.length > 0;
}

export interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  /** OpenAPI 형식 스키마. 지정하면 JSON 모드로 응답한다. */
  responseSchema?: Record<string, unknown>;
}

export async function generate(options: GenerateOptions): Promise<string> {
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: options.prompt }] }],
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
