import { suite, autoRun } from "./helpers.mjs";

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

  return s.print();
}

autoRun(run, import.meta.url);
