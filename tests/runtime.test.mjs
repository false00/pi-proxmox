import { suite, createClient, autoRun } from "./helpers.mjs";
import { safeExecute } from "../dist/tool-runtime.js";
import { nodeList, nodeStatus, nodeExecute } from "../dist/tools/node.js";

export async function run() {
  const s = suite("Tool Runtime");
  const client = createClient();

  let nodeName;

  await s.test("tool timeout throws structured Pi tool error", async () => {
    const previous = process.env.PROXMOX_TOOL_TIMEOUT_MS;
    process.env.PROXMOX_TOOL_TIMEOUT_MS = "1000";

    const execute = safeExecute(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
      return { ok: true };
    });

    try {
      let thrown;
      try {
        await execute("timeout-test", {}, null, null);
      } catch (err) {
        thrown = err;
      }

      if (!thrown) throw new Error("Expected timeout error");
      const payload = JSON.parse(thrown.message);
      if (payload.category !== "timeout") throw new Error(`Expected timeout category, got ${payload.category}`);
      if (payload.httpStatus !== 408) throw new Error(`Expected 408 status, got ${payload.httpStatus}`);
      if (!payload.retryable) throw new Error("Expected retryable timeout");
    } finally {
      if (previous === undefined) delete process.env.PROXMOX_TOOL_TIMEOUT_MS;
      else process.env.PROXMOX_TOOL_TIMEOUT_MS = previous;
    }
  });

  await s.test("node_list emits Pi-compatible progress updates", async () => {
    const tool = nodeList(client);
    const updates = [];
    const result = await tool.execute("node-list", {}, null, update => updates.push(update));

    if (updates.length === 0) throw new Error("Expected at least one progress update");
    const first = updates[0];
    if (!Array.isArray(first.content) || first.content[0]?.type !== "text") {
      throw new Error(`Unexpected progress payload: ${JSON.stringify(first)}`);
    }
    if (!first.content[0].text.includes("Fetching cluster nodes")) {
      throw new Error(`Missing progress text: ${first.content[0].text}`);
    }

    const nodes = JSON.parse(result.content[0].text);
    if (!Array.isArray(nodes) || nodes.length === 0) throw new Error("Expected node list JSON");
    nodeName = nodes[0].node;
  });

  await s.test("node_status returns JSON content on success", async () => {
    const tool = nodeStatus(client);
    const result = await tool.execute("node-status", { node: nodeName }, null, null);
    const payload = JSON.parse(result.content[0].text);
    if (!payload || typeof payload !== "object") throw new Error("Expected object payload");
    if (typeof payload.cpu !== "number") throw new Error("Expected cpu field");
  });

  await s.test("validation errors throw with structured guidance", async () => {
    const tool = nodeExecute(client);
    let thrown;
    try {
      await tool.execute("node-execute", { node: nodeName, commands: "not-json" }, null, null);
    } catch (err) {
      thrown = err;
    }

    if (!thrown) throw new Error("Expected validation error");
    const payload = JSON.parse(thrown.message);
    if (payload.category !== "validation") throw new Error(`Expected validation category, got ${payload.category}`);
    if (!payload.guidance.includes("commands")) throw new Error(`Expected guidance mentioning commands, got ${payload.guidance}`);
    if (payload.retryable) throw new Error("Validation errors should not be retryable");
  });

  await s.test("API failures throw Pi tool errors instead of fake success results", async () => {
    const tool = nodeStatus(client);
    let thrown;
    try {
      await tool.execute("node-status-fail", { node: "__pi_nonexistent_node__" }, null, null);
    } catch (err) {
      thrown = err;
    }

    if (!thrown) throw new Error("Expected execute() to throw");
    const payload = JSON.parse(thrown.message);
    if (payload.category !== "server_error") throw new Error(`Expected server_error category, got ${payload.category}`);
    if (payload.endpoint !== "/nodes/__pi_nonexistent_node__/status") throw new Error(`Unexpected endpoint: ${payload.endpoint}`);
    if (payload.method !== "GET") throw new Error(`Unexpected method: ${payload.method}`);
    if (payload.httpStatus !== 500) throw new Error(`Unexpected status: ${payload.httpStatus}`);
  });

  return s.print();
}

autoRun(run, import.meta.url);
