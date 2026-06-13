import { suite, createClient, autoRun } from "./helpers.mjs";

export async function run() {
  const s = suite("VM Agent Exec");
  const client = createClient();

  const nodes = await client.get("/nodes");
  const nodeName = nodes[0].node;

  let agentVM;
  await s.test("find running VM with agent for exec tests", async () => {
    const vms = await client.get(`/nodes/${nodeName}/qemu`);
    for (const vm of vms) {
      if (vm.status !== "running") continue;
      try {
        await client.post(`/nodes/${nodeName}/qemu/${vm.vmid}/agent/ping`);
        agentVM = vm;
        break;
      } catch { /* no agent */ }
    }
    if (!agentVM) throw new Error("No running VM with QEMU agent found");
    console.log(`    (VM ${agentVM.vmid}: ${agentVM.name})`);
  });

  await s.test("agent exec with single-word command (hostname)", async () => {
    const r = await client.post(`/nodes/${nodeName}/qemu/${agentVM.vmid}/agent/exec`, { command: ["hostname"] });
    if (!r.pid) throw new Error(`Expected pid, got ${JSON.stringify(r)}`);
  });

  await s.test("agent exec with spaced command (ps aux)", async () => {
    const r = await client.post(`/nodes/${nodeName}/qemu/${agentVM.vmid}/agent/exec`, { command: ["ps", "aux"] });
    if (!r.pid) throw new Error(`Expected pid, got ${JSON.stringify(r)}`);
    console.log(`    (PID: ${r.pid})`);
  });

  await s.test("agent exec-status via GET", async () => {
    const r = await client.post(`/nodes/${nodeName}/qemu/${agentVM.vmid}/agent/exec`, { command: ["hostname"] });
    await new Promise(r => setTimeout(r, 1000));
    const result = await client.get(`/nodes/${nodeName}/qemu/${agentVM.vmid}/agent/exec-status`, { pid: r.pid });
    if (!result.exited) throw new Error(`Command did not exit: ${JSON.stringify(result)}`);
    if (!result["out-data"]) throw new Error("No output data");
    console.log(`    (output: ${result["out-data"].trim()})`);
  });

  await s.test("agent file-read via GET", async () => {
    const r = await client.get(`/nodes/${nodeName}/qemu/${agentVM.vmid}/agent/file-read`, { file: "/etc/hostname" });
    if (!r["content"]) throw new Error(`No content: ${JSON.stringify(r)}`);
    console.log(`    (content: ${r["content"].trim()})`);
  });

  return s.print();
}

autoRun(run, import.meta.url);
