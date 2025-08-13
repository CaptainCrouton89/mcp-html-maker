#!/usr/bin/env node

import { createOpenAI } from "@ai-sdk/openai";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { generateText } from "ai";
import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";
import { z } from "zod";

const server = new McpServer({
  name: "mcp-html-maker",
  version: "1.0.0",
});

server.tool(
  "make-html-page",
  "Generate an HTML page using GPT-5 and save it to a file path",
  {
    description: z
      .string()
      .describe("A detailed description of the HTML page to generate"),
    filePath: z
      .string()
      .describe("Absolute file path where the HTML should be saved"),
  },
  async ({ description, filePath }) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { text } = await generateText({
      model: openai("gpt-5"),
      prompt: `
Generate complete, valid HTML code for a 1080x720pxwebpage based on this description: 

${description}

Return ONLY the HTML code, no explanations or markdown formatting. The HTML should be complete and ready to save as a .html file.`,
    });

    const dir = dirname(filePath);
    mkdirSync(dir, { recursive: true });

    writeFileSync(filePath, text, "utf8");

    return {
      content: [
        {
          type: "text",
          text: `Success: HTML page generated and saved to ${filePath}`,
        },
      ],
    };
  }
);

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("HTML Maker running...");
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

main().catch(console.error);
