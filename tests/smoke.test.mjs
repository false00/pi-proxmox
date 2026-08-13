import { suite, autoRun } from "./helpers.mjs";
import { lxcTemplateList } from "../dist/tools/lxc.js";

export async function run() {
  const s = suite("Smoke");

  await s.test("extension entrypoint registers expected tool surface", async () => {
    const mod = await import("../dist/index.js");
    const tools = [];
    await mod.default({
      registerTool(tool) {
        tools.push(tool);
      },
    });

    if (tools.length < 140) throw new Error(`Expected large tool surface, got ${tools.length}`);

    const names = new Set(tools.map(tool => tool.name));
    for (const required of [
      "proxmox_vm_list",
      "proxmox_lxc_list",
      "proxmox_node_execute",
      "proxmox_api_call",
      "proxmox_api_upload_file",
    ]) {
      if (!names.has(required)) throw new Error(`Missing required tool: ${required}`);
    }
  });

  await s.test("all registered tools use proxmox_ prefix", async () => {
    const mod = await import("../dist/index.js");
    const tools = [];
    await mod.default({
      registerTool(tool) {
        tools.push(tool);
      },
    });

    const bad = tools.map(tool => tool.name).filter(name => !name.startsWith("proxmox_"));
    if (bad.length > 0) throw new Error(`Unexpected non-prefixed tools: ${bad.join(", ")}`);
  });

  await s.test("LXC template list uses the storage content endpoint", async () => {
    const calls = [];
    const tool = lxcTemplateList({
      async get(path, params) {
        calls.push({ path, params });
        return [{ volid: "local:vztmpl/ubuntu-24.04-standard.tar.zst" }];
      },
    });

    const result = await tool.execute("template-list", { node: "pve1", storage: "local" }, null, null);
    const payload = JSON.parse(result.content[0].text);
    if (payload[0]?.volid !== "local:vztmpl/ubuntu-24.04-standard.tar.zst") {
      throw new Error("Unexpected LXC template list payload");
    }
    if (calls[0]?.path !== "/nodes/pve1/storage/local/content") {
      throw new Error(`Unexpected LXC template endpoint: ${calls[0]?.path}`);
    }
    if (calls[0]?.params?.content !== "vztmpl") {
      throw new Error("LXC template list did not request vztmpl storage content");
    }
  });

  return s.print();
}

autoRun(run, import.meta.url);
