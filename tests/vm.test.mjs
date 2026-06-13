import { suite, createClient, autoRun } from "./helpers.mjs";

export async function run() {
  const s = suite("VM Lifecycle");
  const client = createClient();

  const nodes = await client.get("/nodes");
  const nodeName = nodes[0].node;

  let vmid;
  await s.test("get next VM ID", async () => {
    vmid = parseInt(await client.get("/cluster/nextid"));
  });

  let created = false;
  await s.test("create VM with cloud image and agent", async () => {
    await client.post(`/nodes/${nodeName}/qemu`, {
      vmid,
      name: `pi-test-${vmid}`,
      memory: 512,
      cores: 1,
      ostype: "l26",
      net0: "virtio,bridge=vmbr0",
      scsi0: "local-lvm:4",
      ide2: "local:iso/ubuntu-24.04-server-cloudimg-amd64.img,media=cdrom",
      boot: "order=scsi0;ide2",
      scsihw: "virtio-scsi-single",
      agent: 1,
      ciuser: "root",
      cipassword: "TestPass123!",
      start: 0,
    });
    created = true;
    console.log(`    (VM ${vmid} created)`);
  });

  await s.test("verify VM in list", async () => {
    const vms = await client.get(`/nodes/${nodeName}/qemu`);
    if (!vms.find(v => v.vmid === vmid)) throw new Error("VM not found in list");
  });

  await s.test("start VM", async () => {
    await client.post(`/nodes/${nodeName}/qemu/${vmid}/status/start`);
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const status = await client.get(`/nodes/${nodeName}/qemu/${vmid}/status/current`);
      if (status.status === "running") {
        console.log(`    (VM ${vmid} is running)`);
        return;
      }
    }
    throw new Error("VM did not reach running state");
  });

  await s.test("get VM config (after start)", async () => {
    const config = await client.get(`/nodes/${nodeName}/qemu/${vmid}/config`);
    if (!config.name) throw new Error(`No name in config, keys: ${Object.keys(config).join(",")}`);
    if (config.name !== `pi-test-${vmid}`) throw new Error(`Unexpected name: ${config.name}`);
  });

  await s.test("stop VM", async () => {
    await client.post(`/nodes/${nodeName}/qemu/${vmid}/status/stop`);
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const status = await client.get(`/nodes/${nodeName}/qemu/${vmid}/status/current`);
      if (status.status === "stopped") {
        console.log(`    (VM ${vmid} stopped)`);
        return;
      }
    }
    throw new Error("VM did not stop");
  });

  if (created) {
    await s.test("delete VM and verify removal", async () => {
      await client.delete(`/nodes/${nodeName}/qemu/${vmid}`);
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const vms = await client.get(`/nodes/${nodeName}/qemu`);
        if (!vms.find(v => v.vmid === vmid)) {
          console.log(`    (VM ${vmid} deleted)`);
          return;
        }
      }
      throw new Error("VM not removed (timed out)");
    });
  }

  return s.print();
}

autoRun(run, import.meta.url);
