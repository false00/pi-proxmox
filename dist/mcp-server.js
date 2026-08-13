#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import piProxmoxExtension from "./index.js";

function serializeSchema(schema) {
  return JSON.parse(JSON.stringify(schema));
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export function createProgressReporter(extra, progressToken) {
  if (progressToken === undefined || typeof extra?.sendNotification !== "function") return undefined;

  let progress = 0;
  return update => {
    const message = update?.details?.status || update?.content?.find(item => item?.type === "text")?.text;
    progress += 1;
    void extra.sendNotification({
      method: "notifications/progress",
      params: { progressToken, progress, message },
    }).catch(() => undefined);
  };
}

export async function collectPiTools() {
  const tools = [];
  await piProxmoxExtension({
    registerTool(tool) {
      tools.push(tool);
    },
  });
  return tools;
}

export function createMcpServer(tools) {
  const toolMap = new Map(tools.map(tool => [tool.name, tool]));
  const server = new Server(
    {
      name: "pi-proxmox",
      version: "1.0.2",
    },
    {
      capabilities: {
        tools: {},
      },
      instructions: "Proxmox VE tools backed by the local pi-proxmox configuration. Verify live inventory and ask before destructive infrastructure changes.",
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map(tool => ({
      name: tool.name,
      title: tool.label,
      description: tool.description,
      inputSchema: serializeSchema(tool.parameters),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const tool = toolMap.get(request.params.name);
    if (!tool) {
      return {
        content: [{ type: "text", text: `Unknown Proxmox tool: ${request.params.name}` }],
        isError: true,
      };
    }

    try {
      const progressToken = request.params._meta?.progressToken ?? extra._meta?.progressToken;
      return await tool.execute(
        `mcp-${tool.name}-${Date.now()}`,
        request.params.arguments || {},
        extra.signal,
        createProgressReporter(extra, progressToken),
        { source: "vscode-mcp" },
      );
    } catch (error) {
      return {
        content: [{ type: "text", text: errorMessage(error) }],
        isError: true,
      };
    }
  });

  return server;
}

export async function startMcpServer() {
  const tools = await collectPiTools();
  const server = createMcpServer(tools);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`pi-proxmox MCP server started with ${tools.length} tools.`);
  return server;
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  startMcpServer().catch(error => {
    console.error(`pi-proxmox MCP server failed: ${errorMessage(error)}`);
    process.exit(1);
  });
}
