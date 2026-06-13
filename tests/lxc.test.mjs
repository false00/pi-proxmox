import { suite, createClient, autoRun } from "./helpers.mjs";

export async function run() {
  const s = suite("LXC Container Lifecycle");
  const client = createClient();

  const nodes = await client.get("/nodes");
  const nodeName = nodes[0].node;

  let template;
  await s.test("find LXC template from storage", async () => {
    const stores = await client.get(`/nodes/${nodeName}/storage`);
    for (const store of stores) {
      const content = await client.get(`/nodes/${nodeName}/storage/${store.storage}/content`, { content: "vztmpl" });
      if (content.length > 0) {
        template = content.find(v => v.volid?.includes("debian-12"))?.volid || content[0].volid;
        break;
      }
    }
    if (!template) throw new Error("No template found");
    console.log(`    (template: ${template})`);
  });

  let ctid;
  await s.test("get next container ID", async () => {
    ctid = parseInt(await client.get("/cluster/nextid"));
  });

  let created = false;
  await s.test("create LXC container", async () => {
    await client.post(`/nodes/${nodeName}/lxc`, {
      vmid: ctid, hostname: `pi-test-${ctid}`, ostemplate: template,
      storage: "local-lvm", memory: 256, swap: 0, cores: 1,
      net0: "name=eth0,bridge=vmbr0,ip=dhcp", password: "TestPass123!", unprivileged: 1,
    });
    created = true;
  });

  await s.test("verify container in list", async () => {
    const ct = await client.get(`/nodes/${nodeName}/lxc`);
    if (!ct.find(c => c.vmid === ctid)) throw new Error("Container not found");
  });

  await s.test("start container", async () => {
    await client.post(`/nodes/${nodeName}/lxc/${ctid}/status/start`);
    await new Promise(r => setTimeout(r, 3000));
    const status = await client.get(`/nodes/${nodeName}/lxc/${ctid}/status/current`);
    if (status.status !== "running") throw new Error(`Not running: ${status.status}`);
  });

  await s.test("get container config", async () => {
    const config = await client.get(`/nodes/${nodeName}/lxc/${ctid}/config`);
    if (!config.hostname) throw new Error("No hostname in config");
  });

  await s.test("stop container", async () => {
    await client.post(`/nodes/${nodeName}/lxc/${ctid}/status/stop`);
    await new Promise(r => setTimeout(r, 2000));
    const status = await client.get(`/nodes/${nodeName}/lxc/${ctid}/status/current`);
    if (status.status !== "stopped") throw new Error(`Not stopped: ${status.status}`);
  });

  if (created) {
    await s.test("delete container", async () => {
      await client.delete(`/nodes/${nodeName}/lxc/${ctid}`);
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const ct = await client.get(`/nodes/${nodeName}/lxc`);
        if (!ct.find(c => c.vmid === ctid)) return;
      }
      throw new Error("Container not removed (timed out)");
    });
  }

  return s.print();
}

autoRun(run, import.meta.url);
