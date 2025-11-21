import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

// Helper function to sleep/delay
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function callLLM(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const prompt = `${systemPrompt}\n\n${userPrompt}`;

  const maxRetries = 3;
  const baseDelay = 1000; // 1 second in milliseconds

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: "application/json"
        }
      });

      // Success - return the response
      return result.response.text();
      
    } catch (error: any) {
      const errorStr = error?.message || String(error);
      
      // Check if it's a rate limit error (429)
      if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) {
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const waitTime = baseDelay * Math.pow(2, attempt);
          console.warn(`⏳ Rate limited (attempt ${attempt + 1}/${maxRetries}). Waiting ${waitTime}ms...`);
          await sleep(waitTime);
          continue; // Retry
        } else {
          // Last attempt failed
          throw new Error(
            "Rate limit exceeded after retries. This is a temporary issue. " +
            "Please wait 30 seconds and try again."
          );
        }
      }
      
      // Not a rate limit error - throw immediately
      throw error;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error("Failed to get response from Gemini");
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