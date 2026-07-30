import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to initialize Gemini Client lazily or safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// 1. TBLT Roleplay Interaction Endpoint
app.post("/api/chat/roleplay", async (req, res) => {
  try {
    const {
      scenarioTitle,
      scenarioGoal,
      aiRole,
      userRole,
      userMajorOrJob,
      cefrLevel,
      conversationHistory,
      userMessage,
      mode // 'voice' | 'text'
    } = req.body;

    const ai = getGeminiClient();

    // If Gemini key is missing, respond with structured fallback response
    if (!ai) {
      return res.json({
        aiResponse: `[Demo Mode] (${aiRole || "AI Assistant"}) Hello! Thank you for speaking with me about ${scenarioGoal || "your task"}. What would you like to discuss next?`,
        koreanTranslation: "안녕하세요! 대화에 응해주셔서 감사합니다. 다음으로 어떤 이야기를 나누고 싶으신가요?",
        suggestedReplies: [
          "I'd like to check my reservation, please.",
          "Could you help me find Gate 12?",
          "Can I get a coffee with oat milk?"
        ],
        hint: "Politely state your request using 'I'd like to...' or 'Could you please...'.",
        nudgeCorrection: null
      });
    }

    // 5 Core Prompt Elements for TBLT
    const systemInstruction = `You are playing the role of "${aiRole || "Partner"}" in a TBLT (Task-Based Language Teaching) English roleplay scenario: "${scenarioTitle}".
The user is a English learner at CEFR level "${cefrLevel || "B1"}" with a background/major in "${userMajorOrJob || "General"}".
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

    // Construct prompt history
    const historyText = Array.isArray(conversationHistory)
      ? conversationHistory.map((m: { role: string; text: string }) => `${m.role === 'user' ? 'Learner' : 'AI'}: ${m.text}`).join('\n')
      : '';

    const prompt = `Conversation history so far:\n${historyText}\n\nLearner just said: "${userMessage}"\n\nRespond as ${aiRole} in JSON format according to system instruction.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiResponse: { type: Type.STRING },
            koreanTranslation: { type: Type.STRING },
            suggestedReplies: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            hint: { type: Type.STRING },
            nudgeCorrection: { type: Type.STRING, nullable: true }
          },
          required: ["aiResponse", "koreanTranslation", "suggestedReplies", "hint"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return res.json(result);

  } catch (error: any) {
    console.error("Error in roleplay API:", error);
    return res.status(500).json({
      error: "Roleplay processing failed",
      aiResponse: "I'm sorry, I missed that. Could you please repeat that?",
      koreanTranslation: "죄송합니다, 잘 듣지 못했습니다. 다시 말씀해주시겠어요?",
      suggestedReplies: ["Sure, let me repeat.", "Can you hear me now?", "Let me rephrase."],
      hint: "Try rephrasing your sentence clearly."
    });
  }
});

// 2. AI Exit Ticket & Reflection Analysis Endpoint
app.post("/api/chat/exit-ticket", async (req, res) => {
  try {
    const { scenarioTitle, transcript, userMajorOrJob, selfReflection } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        overallScore: 88,
        fluencyLevel: "Advanced",
        accuracyLevel: "Good",
        topMistakes: [
          {
            mistake: "I have went to the store yesterday.",
            correction: "I went to the store yesterday.",
            explanation: "Simple past is used for specific finished times."
          },
          {
            mistake: "She don't like coffee.",
            correction: "She doesn't like coffee.",
            explanation: "Subject-verb agreement (3rd person singular)."
          },
          {
            mistake: "I am agree with your opinion.",
            correction: "I agree with your opinion.",
            explanation: "'Agree' is already a verb, so 'am' is not needed."
          }
        ],
        newExpressions: [
          {
            expression: "Catch up with",
            meaning: "소식을 나누다 / 밀린 이야기를 하다",
            exampleSentence: "It was great to catch up with you at the terminal.",
            espCategory: "General"
          },
          {
            expression: "Hit the ground running",
            meaning: "지체 없이 활발히 시작하다",
            exampleSentence: "We are ready to hit the ground running with this task.",
            espCategory: userMajorOrJob || "Business"
          },
          {
            expression: "On the same page",
            meaning: "같은 생각(입장)을 공유하다",
            exampleSentence: "Let's make sure we are on the same page regarding check-in time.",
            espCategory: "General"
          },
          {
            expression: "Cut to the chase",
            meaning: "본론으로 바로 들어가다",
            exampleSentence: "To cut to the chase, I'd like to request a room change.",
            espCategory: "Business"
          }
        ],
        encouragement: "Great job today! Your speaking confidence and fluency are visibly growing.",
        cafData: {
          fluencyScore: 85,
          accuracyScore: 80,
          complexityScore: 78
        }
      });
    }

    const transcriptText = Array.isArray(transcript)
      ? transcript.map((m: { sender: string; text: string }) => `${m.sender}: ${m.text}`).join('\n')
      : transcript;

    const systemInstruction = `You are an expert Applied Linguist and EFL instructor evaluating an AI voice roleplay session for a Korean learner.
Scenario: "${scenarioTitle}". Learner Major/Field: "${userMajorOrJob || "General"}".
Learner's self-reflection note: "${selfReflection || "None"}".

Analyze the transcript thoroughly and output a JSON object with:
1. "overallScore": number (0 to 100)
2. "fluencyLevel": string ("Beginner" | "Intermediate" | "Advanced")
3. "accuracyLevel": string ("Needs Work" | "Good" | "Excellent")
4. "topMistakes": array of up to 3 objects: { "mistake": string, "correction": string, "explanation": string (in English) }
5. "newExpressions": array of 4 useful idioms/phrases that appeared or fit the context: { "expression": string, "meaning": string (in Korean), "exampleSentence": string, "espCategory": string }
6. "encouragement": string (warm, encouraging summary in English)
7. "cafData": object with { "fluencyScore": number (0-100), "accuracyScore": number (0-100), "complexityScore": number (0-100) }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Evaluate this roleplay transcript:\n${transcriptText}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER },
            fluencyLevel: { type: Type.STRING },
            accuracyLevel: { type: Type.STRING },
            topMistakes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  mistake: { type: Type.STRING },
                  correction: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["mistake", "correction", "explanation"]
              }
            },
            newExpressions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  expression: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  exampleSentence: { type: Type.STRING },
                  espCategory: { type: Type.STRING }
                },
                required: ["expression", "meaning", "exampleSentence", "espCategory"]
              }
            },
            encouragement: { type: Type.STRING },
            cafData: {
              type: Type.OBJECT,
              properties: {
                fluencyScore: { type: Type.INTEGER },
                accuracyScore: { type: Type.INTEGER },
                complexityScore: { type: Type.INTEGER }
              },
              required: ["fluencyScore", "accuracyScore", "complexityScore"]
            }
          },
          required: ["overallScore", "fluencyLevel", "accuracyLevel", "topMistakes", "newExpressions", "encouragement", "cafData"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return res.json(result);

  } catch (error: any) {
    console.error("Error in exit-ticket API:", error);
    return res.status(500).json({ error: "Exit ticket generation failed" });
  }
});

// 3. Quick Translation Endpoint
app.post("/api/chat/translate", async (req, res) => {
  try {
    const { text } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ translation: "해당 문장의 한국어 번역 예시입니다." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Translate the following English phrase naturally into Korean for an English learner:\n"${text}"`,
    });

    return res.json({ translation: response.text?.trim() || "번역 결과를 불러올 수 없습니다." });
  } catch (err) {
    return res.json({ translation: "번역을 가져오는 중 오류가 발생했습니다." });
  }
});

// Serve frontend / Vite in Dev vs Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EchoStep AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
