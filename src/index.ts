import "dotenv/config";
import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAnalyzeDislikeTool } from "./tool.js";
import { AnalyzeDislikeOutput } from "./schema.js";
import { buildUserPrompt } from "./prompt.js";
import { callLLM, safeParseJSON } from "./llm.js";

// Helper function to sleep/delay
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const app = express();

  // ---------- middleware ----------
  app.use(cors());
  app.use(express.json());

  // ---------- simple health checks ----------
  app.get("/", (_req, res) => res.send("OK: dislike-coach up"));
  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));

  // ---------- dev/test endpoint (curl/Postman/extension) ----------
  app.post("/dev/analyze", async (req, res) => {
    console.log("🔧 [/dev/analyze] incoming body:", JSON.stringify(req.body, null, 2));

    try {
      const body = req.body ?? {};
      const messages = Array.isArray(body.messages) ? body.messages : [];

      if (!messages.length) {
        console.error("❌ [/dev/analyze] no messages found in request");
        return res.status(400).json({ error: "Missing or empty 'messages' array" });
      }

      // We trust the extension to send { role, content } pairs already in the right shape.
      const payload = {
        messages,
        user_comment: typeof body.user_comment === "string" ? body.user_comment : undefined,
        task_hint: typeof body.task_hint === "string" ? body.task_hint : undefined,
      };

      let system =
        "Return ONLY a JSON object with keys: summary, root_causes, suggested_prompt, alternatives, confidence.";
      const user = buildUserPrompt(payload);

      console.log("🔧 [/dev/analyze] calling LLM");

      try {
        const raw = await callLLM(system, user);
        const parsed = AnalyzeDislikeOutput.parse(safeParseJSON(raw));
        console.log("✅ [/dev/analyze] success");
        return res.json(parsed);
      } catch (firstErr) {
        console.warn("⚠️ [/dev/analyze] first parse failed, retrying:", firstErr);

        // Add delay before retry to avoid hitting rate limit again
        console.log("⏳ Waiting 3 seconds before retry...");
        await sleep(3000); // 3 second delay

        system =
          "STRICT JSON ONLY. Keys: summary, root_causes, suggested_prompt, alternatives, confidence. No extra text.";
        const raw2 = await callLLM(system, user);
        const parsed2 = AnalyzeDislikeOutput.parse(safeParseJSON(raw2));
        console.log("✅ [/dev/analyze] success on retry");
        return res.json(parsed2);
      }
    } catch (e: any) {
      console.error("❌ Error in /dev/analyze:", e);
      return res.status(400).json({ error: e.message ?? String(e) });
    }
  });

  // ---------- MCP endpoint setup ----------
  const server = new McpServer({ name: "dislike-coach", version: "1.0.0" });
  registerAnalyzeDislikeTool(server);

  // Streamable HTTP transport: stateless mode (no session IDs)
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  // Wire Express -> MCP transport
  app.all("/mcp", async (req, res) => {
    try {
      console.log("🛰  [/mcp] Incoming MCP request:", req.method, req.url);
      await transport.handleRequest(req, res, req.body ?? {});
    } catch (err) {
      console.error("❌ Error in /mcp handler:", err);
      res.status(500).json({ error: "MCP transport error" });
    }
  });

  // ---------- start server ----------
  const port = Number(process.env.PORT ?? 3333);
  app.listen(port, () => {
    console.log(`🚀 MCP dislike-coach listening on http://localhost:${port}/mcp`);
    console.log(`🔧 Dev endpoint available at http://localhost:${port}/dev/analyze`);
  });
}

main().catch((e) => {
  console.error("❌ Fatal startup error:", e);
  process.exit(1);
});