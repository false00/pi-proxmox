import { suite, createClient, autoRun } from "./helpers.mjs";

export async function run() {
  const s = suite("Pagination");
  const client = createClient();

  const nodes = await client.get("/nodes");
  const nodeName = nodes[0].node;

  await s.test("task_list with limit=3", async () => {
    const tasks = await client.get(`/nodes/${nodeName}/tasks`, { limit: 3 });
    if (tasks.length > 3) throw new Error(`Expected ≤3, got ${tasks.length}`);
  });

  await s.test("task_list with start=0, limit=2", async () => {
    const tasks = await client.get(`/nodes/${nodeName}/tasks`, { start: 0, limit: 2 });
    if (tasks.length > 2) throw new Error(`Expected ≤2, got ${tasks.length}`);
  });

  await s.test("task_log with start=0, limit=5", async () => {
    const tasks = await client.get(`/nodes/${nodeName}/tasks`, { limit: 1 });
    if (!tasks.length) { console.log("    (skipped)"); return; }
    const log = await client.get(`/nodes/${nodeName}/tasks/${tasks[0].upid}/log`, { start: 0, limit: 5 });
    if (!Array.isArray(log)) throw new Error("Expected array");
  });

  await s.test("cluster_log works (no params)", async () => {
    const log = await client.get("/cluster/log");
    if (!Array.isArray(log)) throw new Error("Expected array");
  });

  return s.print();
}

autoRun(run, import.meta.url);
