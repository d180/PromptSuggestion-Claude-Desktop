import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAnalyzeDislikeTool } from "./tool.js";

async function main() {
  const server = new McpServer({
    name: "dislike-coach",
    version: "1.0.0",
  });

  // Register your tool
  registerAnalyzeDislikeTool(server);

  // Use stdio transport (what Claude/Cursor/FastMCP expect)
  const transport = new StdioServerTransport();

  // Connect MCP protocol to stdio
  await server.connect(transport);

  // The process stays open, receiving/sending MCP messages
}

main().catch((err) => {
  console.error("❌ Fatal MCP error:", err);
  process.exit(1);
});
