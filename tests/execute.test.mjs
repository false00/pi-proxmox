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

  return s.print();
}

autoRun(run, import.meta.url);
