import { buildUserPrompt } from "./prompt.js";
import { callLLM } from "./llm.js";

const system = "Respond ONLY with a valid JSON object matching the required schema.";
const user = buildUserPrompt({
  messages: [
    { role: "user", content: "merge two CSVs on user_id and keep latest timestamp" },
    { role: "assistant", content: "you can just merge them, it's fine 🤷" }
  ],
  user_comment: "didn't keep latest timestamp; wrong columns",
  task_hint: "python pandas, files users.csv and events.csv, event_time is ISO8601"
});

callLLM(system, user)
  .then(txt => console.log(txt))
  .catch(err => console.error(err));
