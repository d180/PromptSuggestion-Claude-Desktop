import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AnalyzeDislikeInput,
  AnalyzeDislikeOutput,
} from "./schema.js";
import type {
  TAnalyzeDislikeInput,
  TAnalyzeDislikeOutput,
} from "./schema.js";
import { buildUserPrompt } from "./prompt.js";
import { callLLM, safeParseJSON } from "./llm.js";

export function registerAnalyzeDislikeTool(server: McpServer) {
  server.registerTool(
    // 1️⃣ name
    "analyze_dislike",

    // 2️⃣ config
    {
      title: "Analyze a disliked LLM response",
      description:
        "Summarize a failed exchange and suggest a better follow-up prompt.",
      // ZodRawShape, not full Zod object
      inputSchema: AnalyzeDislikeInput.shape,
      outputSchema: AnalyzeDislikeOutput.shape,
    },

    // 3️⃣ callback
    async (rawArgs: unknown): Promise<{
      content: { type: "text"; text: string }[];
      structuredContent: TAnalyzeDislikeOutput;
    }> => {
      // Validate input
      const input: TAnalyzeDislikeInput = AnalyzeDislikeInput.parse(rawArgs);

      const payload = {
        messages: input.messages,
        ...(input.user_comment !== undefined && {
          user_comment: input.user_comment,
        }),
        ...(input.task_hint !== undefined && {
          task_hint: input.task_hint,
        }),
      };

      const systemBase =
        "Return ONLY a JSON object with keys: summary, root_causes, suggested_prompt, alternatives, confidence.";
      const systemStrict =
        "STRICT JSON ONLY. Keys: summary, root_causes, suggested_prompt, alternatives, confidence. No extra text.";

      const userPrompt = buildUserPrompt(payload);

      let raw = await callLLM(systemBase, userPrompt);
      let parsed = safeParseJSON(raw);

      let output: TAnalyzeDislikeOutput;

      try {
        output = AnalyzeDislikeOutput.parse(parsed);
      } catch {
        // retry with stricter system
        raw = await callLLM(systemStrict, userPrompt);
        parsed = safeParseJSON(raw);
        output = AnalyzeDislikeOutput.parse(parsed);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(output, null, 2),
          },
        ],
        structuredContent: output,
      };
    }
  );
}
