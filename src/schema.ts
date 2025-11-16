import { z } from "zod";

export const Message = z.object({
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string()
});

export const AnalyzeDislikeInput = z.object({
  chat_id: z.string().optional(),
  model: z.string().optional(),
  messages: z.array(Message).min(2, "Provide at least a small conversation"),
  user_comment: z.string().optional(),
  task_hint: z.string().optional()
});

export const AnalyzeDislikeOutput = z.object({
  summary: z.string(),
  root_causes: z.array(z.string()).default([]),
  suggested_prompt: z.string(),
  alternatives: z.array(z.string()).default([]),
  confidence: z
    .coerce
    .number()
    .transform((v) => {
      if (Number.isNaN(v)) return 0.5;
      // clamp into [0, 1]
      if (v < 0) return 0;
      if (v > 1) return 1;
      return v;
    })
});

export type TAnalyzeDislikeInput = z.infer<typeof AnalyzeDislikeInput>;
export type TAnalyzeDislikeOutput = z.infer<typeof AnalyzeDislikeOutput>;
