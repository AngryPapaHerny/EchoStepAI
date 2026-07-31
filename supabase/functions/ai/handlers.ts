/**
 * EchoStep AI 의 3개 AI 엔드포인트 핸들러.
 * 기존 Express 서버(server.ts)의 /api/chat/* 로직을 그대로 옮긴 것이다.
 */

import { generate, hasGeminiKey, parseJson } from "./gemini.ts";

interface ChatTurn {
  role?: string;
  sender?: string;
  text: string;
}

// ────────────────────────────────────────────────────────────
// 1. TBLT 롤플레이 대화
// ────────────────────────────────────────────────────────────

export async function roleplay(payload: Record<string, unknown>) {
  const {
    scenarioTitle,
    scenarioGoal,
    aiRole,
    userRole,
    userMajorOrJob,
    cefrLevel,
    conversationHistory,
    userMessage,
  } = payload as {
    scenarioTitle?: string;
    scenarioGoal?: string;
    aiRole?: string;
    userRole?: string;
    userMajorOrJob?: string;
    cefrLevel?: string;
    conversationHistory?: ChatTurn[];
    userMessage?: string;
  };

  // API 키가 없으면 데모 모드로 동작한다 (수업 시연용).
  if (!hasGeminiKey()) {
    return {
      aiResponse:
        `[Demo Mode] (${aiRole || "AI Assistant"}) Hello! Thank you for speaking with me about ${
          scenarioGoal || "your task"
        }. What would you like to discuss next?`,
      koreanTranslation:
        "안녕하세요! 대화에 응해주셔서 감사합니다. 다음으로 어떤 이야기를 나누고 싶으신가요?",
      suggestedReplies: [
        "I'd like to check my reservation, please.",
        "Could you help me find Gate 12?",
        "Can I get a coffee with oat milk?",
      ],
      hint: "Politely state your request using 'I'd like to...' or 'Could you please...'.",
      nudgeCorrection: null,
    };
  }

  const systemInstruction =
    `You are playing the role of "${aiRole || "Partner"}" in a TBLT (Task-Based Language Teaching) English roleplay scenario: "${scenarioTitle}".
The user is a English learner at CEFR level "${cefrLevel || "B1"}" with a background/major in "${userMajorOrJob || "General"}".
They are playing the role of "${userRole || "Learner"}".
Their specific goal in this task is: "${scenarioGoal}".

Follow these strict TBLT teaching guidelines:
1. **Role Definition**: Act naturally and authentically as ${aiRole}. Keep responses concise (1 to 3 natural conversational sentences), encouraging, and contextually realistic.
2. **Pedagogy & Non-Judgmental Flow**: Do NOT explicitly criticize minor grammar mistakes during the conversation. Instead, maintain natural conversation flow. Implicitly recast user errors if helpful.
3. **Language Balance**: Respond strictly in natural, conversational English.
4. **Interactive Support**: Provide 3 short, helpful suggested responses (in English) the user could say next, plus 1 helpful tip/hint.
5. **Output Format**: Return ONLY valid JSON with keys:
   - "aiResponse": string (what the AI partner says in English)
   - "koreanTranslation": string (Korean translation of the aiResponse)
   - "suggestedReplies": array of 3 strings (natural next phrases for the user)
   - "hint": string (helpful English hint/tip for what the user should say next)
   - "nudgeCorrection": string or null (if the user made a noticeable grammar mistake in their last input, provide a very polite, non-intrusive recast recommendation, e.g. "Tip: Instead of 'I go store', say 'I went to the store'").`;

  const historyText = Array.isArray(conversationHistory)
    ? conversationHistory
      .map((m) => `${m.role === "user" ? "Learner" : "AI"}: ${m.text}`)
      .join("\n")
    : "";

  const prompt =
    `Conversation history so far:\n${historyText}\n\nLearner just said: "${userMessage}"\n\nRespond as ${aiRole} in JSON format according to system instruction.`;

  const text = await generate({
    prompt,
    systemInstruction,
    responseSchema: {
      type: "OBJECT",
      properties: {
        aiResponse: { type: "STRING" },
        koreanTranslation: { type: "STRING" },
        suggestedReplies: { type: "ARRAY", items: { type: "STRING" } },
        hint: { type: "STRING" },
        nudgeCorrection: { type: "STRING", nullable: true },
      },
      required: ["aiResponse", "koreanTranslation", "suggestedReplies", "hint"],
    },
  });

  return parseJson(text);
}

export const roleplayFallback = {
  error: "Roleplay processing failed",
  aiResponse: "I'm sorry, I missed that. Could you please repeat that?",
  koreanTranslation: "죄송합니다, 잘 듣지 못했습니다. 다시 말씀해주시겠어요?",
  suggestedReplies: [
    "Sure, let me repeat.",
    "Can you hear me now?",
    "Let me rephrase.",
  ],
  hint: "Try rephrasing your sentence clearly.",
  nudgeCorrection: null,
};

// ────────────────────────────────────────────────────────────
// 2. AI Exit Ticket (성찰 일지) 분석
// ────────────────────────────────────────────────────────────

export async function exitTicket(payload: Record<string, unknown>) {
  const { scenarioTitle, transcript, userMajorOrJob, selfReflection } =
    payload as {
      scenarioTitle?: string;
      transcript?: ChatTurn[] | string;
      userMajorOrJob?: string;
      selfReflection?: string;
    };

  if (!hasGeminiKey()) {
    return demoExitTicket(userMajorOrJob);
  }

  const transcriptText = Array.isArray(transcript)
    ? transcript.map((m) => `${m.sender ?? m.role}: ${m.text}`).join("\n")
    : String(transcript ?? "");

  const systemInstruction =
    `You are an expert Applied Linguist and EFL instructor evaluating an AI voice roleplay session for a Korean learner.
Scenario: "${scenarioTitle}". Learner Major/Field: "${userMajorOrJob || "General"}".
Learner's self-reflection note: "${selfReflection || "None"}".

Analyze the transcript thoroughly and output a JSON object with:
1. "overallScore": number (0 to 100)
2. "fluencyLevel": string ("Beginner" | "Intermediate" | "Advanced")
3. "accuracyLevel": string ("Needs Work" | "Good" | "Excellent")
4. "topMistakes": array of up to 3 objects: { "mistake": string, "correction": string, "explanation": string (in English) }
5. "newExpressions": array of 4 useful idioms/phrases that appeared or fit the context: { "expression": string, "meaning": string (in Korean), "exampleSentence": string, "espCategory": string — must be exactly one of "Engineering", "Business", "Healthcare", "Hospitality", "General" }
6. "encouragement": string (warm, encouraging summary in English)
7. "cafData": object with { "fluencyScore": number (0-100), "accuracyScore": number (0-100), "complexityScore": number (0-100) }`;

  const text = await generate({
    prompt: `Evaluate this roleplay transcript:\n${transcriptText}`,
    systemInstruction,
    responseSchema: {
      type: "OBJECT",
      properties: {
        overallScore: { type: "INTEGER" },
        fluencyLevel: {
          type: "STRING",
          enum: ["Beginner", "Intermediate", "Advanced"],
        },
        accuracyLevel: {
          type: "STRING",
          enum: ["Needs Work", "Good", "Excellent"],
        },
        topMistakes: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              mistake: { type: "STRING" },
              correction: { type: "STRING" },
              explanation: { type: "STRING" },
            },
            required: ["mistake", "correction", "explanation"],
          },
        },
        newExpressions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              expression: { type: "STRING" },
              meaning: { type: "STRING" },
              exampleSentence: { type: "STRING" },
              espCategory: {
                type: "STRING",
                enum: [
                  "Engineering",
                  "Business",
                  "Healthcare",
                  "Hospitality",
                  "General",
                ],
              },
            },
            required: [
              "expression",
              "meaning",
              "exampleSentence",
              "espCategory",
            ],
          },
        },
        encouragement: { type: "STRING" },
        cafData: {
          type: "OBJECT",
          properties: {
            fluencyScore: { type: "INTEGER" },
            accuracyScore: { type: "INTEGER" },
            complexityScore: { type: "INTEGER" },
          },
          required: ["fluencyScore", "accuracyScore", "complexityScore"],
        },
      },
      required: [
        "overallScore",
        "fluencyLevel",
        "accuracyLevel",
        "topMistakes",
        "newExpressions",
        "encouragement",
        "cafData",
      ],
    },
  });

  return parseJson(text);
}

function demoExitTicket(userMajorOrJob?: string) {
  return {
    overallScore: 88,
    fluencyLevel: "Advanced",
    accuracyLevel: "Good",
    topMistakes: [
      {
        mistake: "I have went to the store yesterday.",
        correction: "I went to the store yesterday.",
        explanation: "Simple past is used for specific finished times.",
      },
      {
        mistake: "She don't like coffee.",
        correction: "She doesn't like coffee.",
        explanation: "Subject-verb agreement (3rd person singular).",
      },
      {
        mistake: "I am agree with your opinion.",
        correction: "I agree with your opinion.",
        explanation: "'Agree' is already a verb, so 'am' is not needed.",
      },
    ],
    newExpressions: [
      {
        expression: "Catch up with",
        meaning: "소식을 나누다 / 밀린 이야기를 하다",
        exampleSentence: "It was great to catch up with you at the terminal.",
        espCategory: "General",
      },
      {
        expression: "Hit the ground running",
        meaning: "지체 없이 활발히 시작하다",
        exampleSentence: "We are ready to hit the ground running with this task.",
        espCategory: userMajorOrJob || "Business",
      },
      {
        expression: "On the same page",
        meaning: "같은 생각(입장)을 공유하다",
        exampleSentence:
          "Let's make sure we are on the same page regarding check-in time.",
        espCategory: "General",
      },
      {
        expression: "Cut to the chase",
        meaning: "본론으로 바로 들어가다",
        exampleSentence: "To cut to the chase, I'd like to request a room change.",
        espCategory: "Business",
      },
    ],
    encouragement:
      "Great job today! Your speaking confidence and fluency are visibly growing.",
    cafData: { fluencyScore: 85, accuracyScore: 80, complexityScore: 78 },
  };
}

// ────────────────────────────────────────────────────────────
// 3. 빠른 번역
// ────────────────────────────────────────────────────────────

export async function translate(payload: Record<string, unknown>) {
  const { text } = payload as { text?: string };

  if (!hasGeminiKey()) {
    return { translation: "해당 문장의 한국어 번역 예시입니다." };
  }

  const result = await generate({
    prompt:
      `Translate the following English phrase naturally into Korean for an English learner. Return only the translation.\n"${text}"`,
  });

  return { translation: result || "번역 결과를 불러올 수 없습니다." };
}
