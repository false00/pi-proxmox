import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { autoRun, suite } from "./helpers.mjs";
import { createMcpServer, createProgressReporter } from "../dist/mcp-server.js";

async function withInMemoryServer(tools, runTest) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "pi-proxmox-mcp-test", version: "1.0.0" });
  const server = createMcpServer(tools);

  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    await runTest(client);
  } finally {
    await client.close();
    await server.close();
  }
}

export async function run() {
  const s = suite("MCP bridge");

  await s.test("stdio MCP server exposes the complete Pi tool surface", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [resolve(process.cwd(), "dist", "mcp-server.js")],
      cwd: process.cwd(),
      stderr: "pipe",
    });
    const client = new Client({ name: "pi-proxmox-mcp-test", version: "1.0.0" });

    try {
      await client.connect(transport);
      const serverInfo = client.getServerVersion();
      const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8"));
      if (serverInfo?.version !== pkg.version) {
        throw new Error(`MCP server reports version ${serverInfo?.version}, package.json has ${pkg.version}`);
      }
      const response = await client.listTools();
      if (response.tools.length !== 141) throw new Error(`Expected 141 MCP tools, got ${response.tools.length}`);

      const create = response.tools.find(tool => tool.name === "proxmox_lxc_create");
      if (!create) throw new Error("Missing proxmox_lxc_create MCP tool");
      if (create.inputSchema?.properties?.vmid?.type !== "integer") {
        throw new Error("MCP bridge did not preserve the LXC create JSON schema");
      }

      const templates = response.tools.find(tool => tool.name === "proxmox_lxc_template_list");
      if (templates?.inputSchema?.properties?.storage?.type !== "string") {
        throw new Error("MCP bridge did not preserve the optional LXC template storage schema");
      }

      const raw = response.tools.find(tool => tool.name === "proxmox_api_call");
      if (!raw) throw new Error("Missing proxmox_api_call MCP tool");

      const invalid = await client.callTool({
        name: "proxmox_api_call",
        arguments: { method: "PATCH", path: "/version" },
      });
      if (!invalid.isError) throw new Error("Expected invalid raw API method to return an MCP tool error");
      const details = JSON.parse(invalid.content[0].text);
      if (details.category !== "validation") throw new Error("MCP bridge did not preserve the Pi validation error category");

      const unknown = await client.callTool({ name: "proxmox_missing_tool", arguments: {} });
      if (!unknown.isError || !unknown.content[0].text.includes("Unknown Proxmox tool")) {
        throw new Error("MCP bridge did not return a structured unknown-tool error");
      }
    } finally {
      await client.close();
      await transport.close();
    }
  });

  await s.test("MCP tool calls preserve execution context, results, progress, and errors", async () => {
    const execution = {};
    const tools = [
      {
        name: "proxmox_test_success",
        label: "Test Success",
        description: "Test-only successful tool",
        parameters: { type: "object", properties: { value: { type: "integer" } }, required: ["value"] },
        async execute(toolCallId, params, signal, onUpdate, context) {
          execution.toolCallId = toolCallId;
          execution.params = params;
          execution.signalWasActive = signal instanceof AbortSignal && !signal.aborted;
          execution.context = context;
          onUpdate({ content: [{ type: "text", text: "Halfway there" }], details: { status: "Halfway there" } });
          return { content: [{ type: "text", text: `Value: ${params.value}` }] };
        },
      },
      {
        name: "proxmox_test_failure",
        label: "Test Failure",
        description: "Test-only failing tool",
        parameters: { type: "object", properties: {} },
        async execute() {
          throw new Error("simulated tool failure");
        },
      },
    ];

    await withInMemoryServer(tools, async client => {
      const progress = [];
      const success = await client.callTool(
        { name: "proxmox_test_success", arguments: { value: 7 } },
        undefined,
        { onprogress: update => progress.push(update) },
      );
      await new Promise(resolve => setImmediate(resolve));

      if (success.isError || success.content[0].text !== "Value: 7") throw new Error("MCP success result was not preserved");
      if (!execution.toolCallId.startsWith("mcp-proxmox_test_success-")) throw new Error("MCP tool call ID was not generated");
      if (execution.params.value !== 7) throw new Error("MCP tool arguments were not preserved");
      if (!execution.signalWasActive) throw new Error("MCP request signal was not passed to the Pi tool");
      if (execution.context?.source !== "vscode-mcp") throw new Error("MCP execution context was not preserved");
      if (progress.length !== 1 || progress[0].message !== "Halfway there") throw new Error("MCP progress was not delivered to the client");

      const failure = await client.callTool({ name: "proxmox_test_failure", arguments: {} });
      if (!failure.isError || failure.content[0].text !== "simulated tool failure") {
        throw new Error("Thrown Pi tool errors were not translated to MCP tool errors");
      }
    });
  });

  await s.test("MCP cancellation aborts the Pi tool signal", async () => {
    let observedAbort = false;
    const tool = {
      name: "proxmox_test_cancel",
      label: "Test Cancellation",
      description: "Test-only cancellable tool",
      parameters: { type: "object", properties: {} },
      async execute(_toolCallId, _params, signal) {
        await new Promise((resolve, reject) => {
          const abort = () => {
            observedAbort = true;
            reject(new DOMException("The operation was aborted", "AbortError"));
          };
          if (signal.aborted) abort();
          else signal.addEventListener("abort", abort, { once: true });
        });
        return { content: [{ type: "text", text: "unexpected completion" }] };
      },
    };

    await withInMemoryServer([tool], async client => {
      const controller = new AbortController();
      const request = client.callTool(
        { name: "proxmox_test_cancel", arguments: {} },
        undefined,
        { signal: controller.signal },
      );
      await new Promise(resolve => setImmediate(resolve));
      controller.abort();

      try {
        await request;
        throw new Error("Expected cancelled MCP request to reject");
      } catch (error) {
        const isAbort = error.name === "AbortError"
          || (error.code === -32001 && /AbortError|aborted/i.test(error.message));
        if (!isAbort) throw error;
      }
      await new Promise(resolve => setImmediate(resolve));
      if (!observedAbort) throw new Error("MCP cancellation did not reach the Pi tool signal");
    });
  });

  await s.test("Pi progress updates map to MCP progress notifications", async () => {
    const notifications = [];
    const reporter = createProgressReporter({
      async sendNotification(notification) {
        notifications.push(notification);
      },
    }, "progress-test");

    reporter({ content: [{ type: "text", text: "Fetching cluster nodes..." }], details: { status: "Fetching cluster nodes..." } });
    await new Promise(resolve => setImmediate(resolve));

    if (notifications.length !== 1) throw new Error("Expected one MCP progress notification");
    if (notifications[0].params.progressToken !== "progress-test") throw new Error("Progress token was not preserved");
    if (notifications[0].params.message !== "Fetching cluster nodes...") throw new Error("Progress message was not preserved");
  });

  return s.print();
}

autoRun(run, import.meta.url);
