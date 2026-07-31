/**
 * EchoStep AI :: `ai` Edge Function
 *
 * 기존 Express 서버의 세 엔드포인트를 경로 기반으로 라우팅한다.
 *   POST /functions/v1/ai/roleplay
 *   POST /functions/v1/ai/exit-ticket
 *   POST /functions/v1/ai/translate
 *
 * verify_jwt 가 켜져 있으므로 로그인한 사용자만 호출할 수 있고,
 * GEMINI_API_KEY 는 서버 시크릿으로만 존재해 브라우저에 노출되지 않는다.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { exitTicket, roleplay, roleplayFallback, translate } from "./handlers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // "/functions/v1/ai/roleplay" → "roleplay"
  const route = new URL(req.url).pathname.split("/").filter(Boolean).pop() ?? "";

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  try {
    switch (route) {
      case "roleplay":
        return json(await roleplay(payload));
      case "exit-ticket":
        return json(await exitTicket(payload));
      case "translate":
        return json(await translate(payload));
      default:
        return json(
          {
            error: `Unknown route "${route}"`,
            available: ["roleplay", "exit-ticket", "translate"],
          },
          404,
        );
    }
  } catch (error) {
    console.error(`[ai/${route}]`, error);

    // 롤플레이는 대화가 끊기지 않도록 회복용 응답을 200으로 돌려준다.
    if (route === "roleplay") {
      return json(roleplayFallback);
    }

    return json(
      {
        error: `${route} processing failed`,
        detail: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
