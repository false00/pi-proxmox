import { suite, createClient, autoRun } from "./helpers.mjs";
import { execOnNode } from "../dist/tool-runtime.js";

export async function run() {
  const s = suite("Batch API Execute");
  const client = createClient();

  const nodes = await client.get("/nodes");
  const nodeName = nodes[0].node;

  await s.test("execOnNode single GET version", async () => {
    const r = await execOnNode(client, nodeName, [{ method: "GET", path: "version" }]);
    if (!Array.isArray(r) || r[0].status !== 200) throw new Error(`Unexpected: ${JSON.stringify(r)}`);
    console.log(`    (version: ${r[0].data.release} ${r[0].data.version})`);
  });

  await s.test("execOnNode GET status", async () => {
    const r = await execOnNode(client, nodeName, [{ method: "GET", path: "status" }]);
    if (!Array.isArray(r) || r[0].status !== 200) throw new Error(`Unexpected: ${JSON.stringify(r)}`);
  });

  await s.test("execOnNode GET qemu list", async () => {
    const r = await execOnNode(client, nodeName, [{ method: "GET", path: "qemu" }]);
    if (!Array.isArray(r) || r[0].status !== 200) throw new Error(`Unexpected: ${JSON.stringify(r)}`);
    console.log(`    (${r[0].data.length} VMs)`);
  });

  await s.test("execOnNode multiple commands", async () => {
    const r = await execOnNode(client, nodeName, [
      { method: "GET", path: "version" },
      { method: "GET", path: "status" },
    ]);
    if (!Array.isArray(r) || r.length !== 2) throw new Error(`Expected 2 results, got ${r.length}`);
  });

  await s.test("execOnNode supports official args objects", async () => {
    const r = await execOnNode(client, nodeName, [{ method: "GET", path: "tasks", args: { limit: 1 } }]);
    if (!Array.isArray(r) || r[0].status !== 200) throw new Error(`Unexpected: ${JSON.stringify(r)}`);
    if (!Array.isArray(r[0].data) || r[0].data.length < 1) throw new Error("Expected at least one task result");
  });

  await s.test("execOnNode accepts legacy body alias and maps it to args", async () => {
    const r = await execOnNode(client, nodeName, [{ method: "GET", path: "tasks", body: { limit: 1 } }]);
    if (!Array.isArray(r) || r[0].status !== 200) throw new Error(`Unexpected: ${JSON.stringify(r)}`);
    if (!Array.isArray(r[0].data) || r[0].data.length < 1) throw new Error("Expected at least one task result");
  });

  await s.test("execOnNode uses ticket fallback when API token is rejected", async () => {
    const probe = createClient();
    const probeNodes = await probe.get("/nodes");
    const probeNode = probeNodes[0].node;

    let usedFallback = false;
    const originalFallback = probe.postWithTicketAuth.bind(probe);
    probe.postWithTicketAuth = async (...args) => {
      usedFallback = true;
      return await originalFallback(...args);
    };

    const result = await execOnNode(probe, probeNode, [{ method: "GET", path: "version" }]);
    if (!Array.isArray(result) || result[0]?.status !== 200) throw new Error(`Unexpected: ${JSON.stringify(result)}`);
    if (!usedFallback) throw new Error("Expected ticket-auth fallback to be exercised in this environment");
  });

  return s.print();
}

autoRun(run, import.meta.url);
