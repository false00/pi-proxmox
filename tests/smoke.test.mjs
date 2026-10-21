import { suite, autoRun } from "./helpers.mjs";
import { lxcTemplateList } from "../dist/tools/lxc.js";
import { nodeExecute } from "../dist/tools/node.js";
import { ProxmoxError } from "../dist/proxmox-client.js";
import { dotEnvTemplate } from "../dist/config.js";

const EXECUTE_COMMANDS = '[{"method":"GET","path":"version"}]';

function rootOnlyRejection() {
  return new ProxmoxError("Permission check failed (user != root@pam)", {
    status: 403,
    endpoint: "/nodes/pve1/execute",
    method: "POST",
  });
}

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

  await s.test("node_execute fails closed with root-only guidance when no password fallback is set", async () => {
    const tool = nodeExecute({
      password: "",
      async post() {
        throw rootOnlyRejection();
      },
      async postWithTicketAuth() {
        throw new Error("password fallback must not be used when it is not configured");
      },
    });

    let thrown;
    try {
      await tool.execute("node-execute", { node: "pve1", commands: EXECUTE_COMMANDS }, null, null);
    } catch (err) {
      thrown = err;
    }

    if (!thrown) throw new Error("Expected proxmox_node_execute to fail closed");
    const payload = JSON.parse(thrown.message);
    if (payload.category !== "authentication") throw new Error(`Expected authentication category, got ${payload.category}`);
    if (!payload.guidance.includes("root-only")) throw new Error(`Expected root-only guidance, got ${payload.guidance}`);
    if (payload.endpoint !== "/nodes/pve1/execute") throw new Error(`Unexpected endpoint: ${payload.endpoint}`);
  });

  await s.test("node_execute keeps the ticket-auth retry when the password fallback is set", async () => {
    let retriedPath;
    const tool = nodeExecute({
      password: "test-placeholder",
      async post() {
        throw rootOnlyRejection();
      },
      async postWithTicketAuth(path) {
        retriedPath = path;
        return [{ status: 200, data: { release: "test" } }];
      },
    });

    const result = await tool.execute("node-execute", { node: "pve1", commands: EXECUTE_COMMANDS }, null, null);
    if (retriedPath !== "/nodes/pve1/execute") throw new Error(`Expected ticket-auth retry on /execute, got ${retriedPath}`);
    if (JSON.parse(result.content[0].text)[0]?.status !== 200) throw new Error("Unexpected retry result");
  });

  await s.test("auto-created .env template recommends a least-privilege token", async () => {
    const template = dotEnvTemplate({ username: "root@pam", password: "", tokenId: "", tokenSecret: "" });
    if (!template.includes("PROXMOX_TOKEN_ID=pi-proxmox@pve!automation")) {
      throw new Error("Template does not default to a dedicated non-root token");
    }
    if (!template.includes("--privsep 1")) throw new Error("Template does not recommend privilege separation");
    if (/^PROXMOX_(USERNAME|PASSWORD)=/m.test(template)) throw new Error("Template enables the password fallback by default");
    if (/root@pam!|--privsep[= ]0/.test(template)) throw new Error("Template recommends a root or full-privilege token");

    const explicit = dotEnvTemplate({ username: "root@pam", password: "supplied-by-env" });
    if (!/^PROXMOX_USERNAME=root@pam$/m.test(explicit) || !/^PROXMOX_PASSWORD=supplied-by-env$/m.test(explicit)) {
      throw new Error("Template no longer preserves explicitly supplied fallback credentials");
    }
  });

  return s.print();
}

autoRun(run, import.meta.url);
