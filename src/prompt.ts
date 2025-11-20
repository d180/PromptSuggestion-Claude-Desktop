import type { TAnalyzeDislikeInput } from "./schema.js";

type BuildPromptArgs = {
  messages: TAnalyzeDislikeInput["messages"];
  user_comment?: string;
  task_hint?: string;
};

export function buildUserPrompt({
  messages,
  user_comment,
  task_hint,
}: BuildPromptArgs): string {
  const convo = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const lastUser =
    [...messages]
      .reverse()
      .find((m) => m.role === "user")?.content ?? "(unknown last user message)";

  return `
You are a PROMPT REWRITER for LLM chats.

You will receive:
- A short conversation between a USER and an ASSISTANT.
- The USER's most recent message.
- An optional user comment explaining why they disliked the last answer.
- An optional hint about the task domain.

Your job is to:
1. Infer what the user REALLY wanted, especially from the LAST user message.
2. Briefly understand why the last answer failed.
3. Produce a SINGLE, SELF-CONTAINED prompt that the user can send to the SAME assistant to get a much better answer.

CRITICAL RULES FOR "suggested_prompt":
- It MUST be written in the FIRST-PERSON perspective, as if the user is directly talking to the assistant.
  - Use "you" to refer to the assistant.
  - Use "I", "me", and "my" to refer to the user.
- Avoid generic phrases like "the user" or "users" when describing benefits.
  - Prefer phrasing such as "how it benefits me" or "how it improves my experience".
- It MUST NOT mention "the user", "the assistant", "previous discussion", "conversation above", "earlier answer", or thumbs-down feedback.
- It MUST be SELF-CONTAINED: it should make sense even if the assistant never saw the prior conversation.
- It MUST directly request the desired result (explanation, code, design, plan, etc.).
- It CAN add clarifying constraints based on context (e.g. "in simple terms", "with 3 concrete UX improvements", "step-by-step").
- It SHOULD be clear, concise, and specific.

Examples of BAD suggested_prompt (DO NOT WRITE THESE):
- "Based on the previous discussion, can you..."
- "Provide HTML/CSS for a login page for the user..."
- "Explain to the user how Docker works."
- "Explain how this improves the user's experience."

Examples of GOOD suggested_prompt (STYLE TO FOLLOW):
- "Explain Kubernetes pods to me in simple terms using a real-world analogy, and give me 3 concrete use cases."
- "Give me HTML/CSS for a simple login page, and include 3 specific modern UX improvements. Explain how each improvement helps me."
- "Explain how neural networks work to me in beginner-friendly language, using a clear analogy and a short example."

You will output STRICT JSON with these keys:
- "summary": short explanation of what went wrong with the assistant's last answer.
- "root_causes": array of 1–4 bullet-style reasons (strings) explaining the failure.
- "suggested_prompt": the single improved, self-contained FIRST-PERSON prompt the user should send next.
- "alternatives": array of 0–3 alternative prompts, each also directly sendable, self-contained, and written in first-person.
- "confidence": number between 0 and 1 (your confidence that the suggested_prompt will work well).

Full conversation:
${convo}

Last user message (for focus):
${lastUser}

User comment (may be empty):
${user_comment ?? "(none)"}

Task hint (may be empty):
${task_hint ?? "(none)"}
`;
}