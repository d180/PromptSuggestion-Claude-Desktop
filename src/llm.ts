import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export async function callLLM(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const prompt = `${systemPrompt}\n\n${userPrompt}`;

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192, // Changed from 1500 to 8192
      // Ask Gemini to return JSON only
      responseMimeType: "application/json"
      // No responseSchema here to avoid TS type mismatch
    }
  });

  // Gemini should now return plain JSON text
  return result.response.text();
}

export function safeParseJSON(maybeJson: string): any {
  try {
    return JSON.parse(maybeJson);
  } catch {
    // Try ```json ... ``` fenced output
    const fenced = maybeJson.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1] !== undefined) {
      return JSON.parse(fenced[1]);
    }
    // Try last JSON object in text
    const match = maybeJson.match(/\{[\s\S]*\}$/);
    if (match && match[0] !== undefined) {
      return JSON.parse(match[0]);
    }
    throw new Error("Model did not return valid JSON");
  }
}