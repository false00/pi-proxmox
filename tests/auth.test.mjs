import { suite, createClient, autoRun } from "./helpers.mjs";

export async function run() {
  const s = suite("Auth & Connection");
  const client = createClient();

  let nodeName;
  await s.test("authenticate and list nodes", async () => {
    const nodes = await client.get("/nodes");
    if (!Array.isArray(nodes) || nodes.length === 0) throw new Error("No nodes");
    nodeName = nodes[0].node;
    console.log(`    (${nodes.length} nodes)`);
  });

  await s.test("get cluster status", async () => {
    const r = await client.get("/cluster/status");
    if (!Array.isArray(r)) throw new Error("Expected array");
  });

  await s.test("get next VM ID", async () => {
    const id = await client.get("/cluster/nextid");
    if (typeof id !== "string" && typeof id !== "number") throw new Error("Bad ID");
  });

  await s.test("list VMs", async () => {
    const vms = await client.get(`/nodes/${nodeName}/qemu`);
    console.log(`    (${vms.length} VMs)`);
  });

  await s.test("list containers", async () => {
    const ct = await client.get(`/nodes/${nodeName}/lxc`);
    console.log(`    (${ct.length} containers)`);
  });

  await s.test("list storage", async () => {
    const storage = await client.get(`/nodes/${nodeName}/storage`);
    console.log(`    (${storage.length} storage entries)`);
  });

  await s.test("get cluster resources", async () => {
    const r = await client.get("/cluster/resources");
    console.log(`    (${r.length} resources)`);
  });

  await s.test("list backup jobs", async () => {
    const jobs = await client.get("/cluster/backup");
    console.log(`    (${jobs.length} backup jobs)`);
  });

  await s.test("list pools", async () => {
    const pools = await client.get("/pools");
    console.log(`    (${pools.length} pools)`);
  });

  await s.test("list HA resources", async () => {
    const ha = await client.get("/cluster/ha/resources");
    console.log(`    (${ha.length} HA resources)`);
  });

  await s.test("no SSH methods on client", async () => {
    if (client.sshKeyPath !== undefined) throw new Error("sshKeyPath exists");
    if (typeof client.execViaSSH === "function") throw new Error("execViaSSH exists");
    if (typeof client.resolveSSHKeyPaths === "function") throw new Error("resolveSSHKeyPaths exists");
  });

  return s.print();
}

autoRun(run, import.meta.url);
