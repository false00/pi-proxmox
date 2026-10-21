import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { autoRun, suite } from "./helpers.mjs";
import { ProxmoxClient } from "../dist/proxmox-client.js";
import * as vmTools from "../dist/tools/vm.js";
import * as lxcTools from "../dist/tools/lxc.js";
import * as nodeTools from "../dist/tools/node.js";
import * as storageTools from "../dist/tools/storage.js";
import * as clusterTools from "../dist/tools/cluster.js";
import * as backupTools from "../dist/tools/backup.js";
import * as firewallTools from "../dist/tools/firewall.js";
import * as taskTools from "../dist/tools/task.js";
import * as accessTools from "../dist/tools/access.js";
import * as haTools from "../dist/tools/ha.js";
import * as replicationTools from "../dist/tools/replication.js";
import * as rawTools from "../dist/tools/raw.js";

// Offline checks against tests/fixtures/pve-api-snapshot.json, a snapshot of the official API viewer
// schema (refresh it with `npm run update:api-snapshot`). Every dedicated tool runs against a recording
// client, and each request must name an official route, method, and parameters.

const SNAPSHOT = JSON.parse(readFileSync(new URL("./fixtures/pve-api-snapshot.json", import.meta.url), "utf8"));
const DEDICATED_MODULES = [vmTools, lxcTools, nodeTools, storageTools, clusterTools, backupTools, firewallTools, taskTools, accessTools, haTools, replicationTools];

const ROUTES = Object.keys(SNAPSHOT.routes).map(template => {
  const names = [];
  const pattern = template.split("/").map(segment => {
    const placeholder = /^\{(.+)\}$/.exec(segment);
    if (!placeholder) return segment.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
    names.push(placeholder[1]);
    // Volume IDs such as local:iso/disk.iso keep their slash in content paths.
    return placeholder[1] === "volume" ? "(.+)" : "([^/]+)";
  }).join("/");
  return { template, names, regex: new RegExp(`^${pattern}$`) };
}).sort((a, b) => a.names.length - b.names.length);

function matchRoute(path) {
  return ROUTES.find(route => route.regex.test(path));
}

function parameterSpec(template, method) {
  const names = SNAPSHOT.routes[template]?.[method];
  if (!names) return undefined;
  return {
    required: names.filter(name => !name.endsWith("?")),
    accepted: names.map(name => name.replace(/\?$/, "")),
  };
}

function accepts(accepted, key) {
  return accepted.includes(key) || accepted.some(name => name.endsWith("[n]") && new RegExp(`^${name.slice(0, -3)}\\d+$`).test(key));
}

function recordingClient(calls) {
  const record = method => async (path, params) => {
    calls.push({ method, path, params: params ?? {} });
    return method === "GET" ? [{ node: "pve1", vmid: 100, volid: "local:iso/test.iso" }] : null;
  };
  return {
    password: "",
    get: record("GET"),
    post: record("POST"),
    put: record("PUT"),
    delete: record("DELETE"),
    postWithTicketAuth: record("POST"),
    async upload(path, form) {
      calls.push({ method: "POST", path, params: Object.fromEntries([...form.keys()].map(key => [key, "multipart"])) });
      return "UPID:pve1:upload";
    },
    async _probePermissions() {
      return { canListVMs: true, canListLXCs: true };
    },
  };
}

const SAMPLE_VALUES = {
  node: "pve1",
  vmid: 100,
  newid: 101,
  pid: 4242,
  target: "pve2",
  storage: "local",
  snapname: "pre-update",
  upid: "UPID:pve1:00001234:00005678:65000000:qmstart:100:root@pam:",
  id: "100-0",
  userid: "pi-proxmox@pve",
  tokenid: "automation",
  groupid: "operators",
  roleid: "PiOperator",
  poolid: "pi-proxmox",
  sid: "vm:100",
  group: "ha-group",
  name: "web",
  service: "pveproxy",
  disk: "scsi0",
  mp: "rootfs",
  size: "+1G",
  volid: "local:iso/test.iso",
  file: "/etc/hostname",
  url: "https://example.invalid/test.iso",
  path: "/pool/pi-proxmox",
  roles: "PVEAuditor",
  commands: "[{\"method\":\"GET\",\"path\":\"version\"}]",
  command: "uptime",
  cidr: "192.0.2.0/24",
  action: "ACCEPT",
  pos: "0",
  content: "iso",
};

function sampleValue(key, schema) {
  if (key in SAMPLE_VALUES) return SAMPLE_VALUES[key];
  if (schema.type === "integer") return 1;
  if (schema.type === "number") return 1.5;
  return `sample-${key}`;
}

function sampleParams(tool, variant = {}) {
  const { $only, ...overrides } = variant;
  const params = {};
  for (const [key, schema] of Object.entries(tool.parameters?.properties || {})) {
    if (key === "level" || key === "type") continue;
    if ($only && !$only.includes(key)) continue;
    params[key] = sampleValue(key, schema);
  }
  return { ...params, ...overrides };
}

const FIREWALL_LEVELS = ["cluster", "pve1", "vm/100", "lxc/100"];
const firewallScope = level => ({ level, node: level.includes("/") ? "pve1" : undefined });
const GUEST_OR_CLUSTER_ONLY = new Set([
  "proxmox_firewall_aliases",
  "proxmox_firewall_alias_create",
  "proxmox_firewall_alias_delete",
  "proxmox_firewall_ipset_list",
  "proxmox_firewall_ipset_create",
  "proxmox_firewall_ipset_delete",
]);

const GUEST_FIREWALL_OPTIONS = ["node", "enable", "policy_in", "policy_out", "log_level_in", "log_level_out", "dhcp", "ndp"];

const VARIANTS = {
  proxmox_storage_scan: [{}, { type: "nfs" }, { type: "cifs" }, { type: "iscsi" }, { type: "lvm" }, { type: "lvmthin" }, { type: "zfs" }],
  proxmox_node_hardware: [{}, { type: "pci" }, { type: "usb" }],
  proxmox_firewall_rule_add: FIREWALL_LEVELS.map(level => ({ ...firewallScope(level), type: "in" })),
  // Each firewall level accepts a different option set, as the tool description says.
  proxmox_firewall_options_update: [
    { level: "cluster", $only: ["enable", "policy_in", "policy_out"] },
    { level: "pve1", $only: ["enable", "log_level_in", "log_level_out", "ndp"] },
    { level: "vm/100", $only: GUEST_FIREWALL_OPTIONS },
    { level: "lxc/100", $only: GUEST_FIREWALL_OPTIONS },
  ],
  proxmox_cluster_resources: [{}, { type: "vm" }],
  proxmox_storage_create: [{ type: "dir" }],
};

function variantsFor(tool) {
  if (VARIANTS[tool.name]) return VARIANTS[tool.name];
  if (tool.parameters?.properties?.level) {
    const levels = GUEST_OR_CLUSTER_ONLY.has(tool.name) ? FIREWALL_LEVELS.filter(level => level !== "pve1") : FIREWALL_LEVELS;
    return levels.map(firewallScope);
  }
  return [{}];
}

function dedicatedFactories() {
  return DEDICATED_MODULES.flatMap(mod => Object.values(mod)).filter(value => typeof value === "function");
}

async function withStubbedFetch(fn) {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 });
  try {
    return await fn();
  } finally {
    globalThis.fetch = original;
  }
}

async function runTool(factory, params) {
  const calls = [];
  const tool = factory(recordingClient(calls));
  await withStubbedFetch(() => tool.execute("endpoint-test", params, undefined, undefined));
  return calls;
}

async function callsFor(factory, params) {
  const calls = await runTool(factory, params);
  return calls.map(({ method, path, params: sent }) => ({
    method,
    path,
    params: Object.fromEntries(Object.entries(sent).filter(([, value]) => value !== undefined && value !== null)),
  }));
}

function assertCalls(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${label}: expected ${e}, got ${a}`);
}

async function expectValidationError(factory, params, label) {
  let thrown;
  try {
    await runTool(factory, params);
  } catch (err) {
    thrown = err;
  }
  if (!thrown) throw new Error(`${label}: expected a validation error`);
  const payload = JSON.parse(thrown.message);
  if (payload.category !== "validation") throw new Error(`${label}: expected validation category, got ${payload.category}`);
}

const ENDPOINT_MENTION = /\b(GET|POST|PUT|DELETE)\b[\s|`]+(\/[A-Za-z0-9_{}\-./<>:@!]+)/g;

function endpointMentions(text) {
  const mentions = [];
  for (const match of text.matchAll(ENDPOINT_MENTION)) {
    let path = match[2].replace(/[.,:]+$/, "").replace(/\/+$/, "");
    if (path.startsWith("/api2/json")) path = path.slice("/api2/json".length);
    if (path === "") continue;
    mentions.push({ method: match[1], path, raw: match[0] });
  }
  return mentions;
}

export async function run() {
  const s = suite("Endpoint conformance (offline)");

  await s.test("API snapshot fixture covers the official API viewer", async () => {
    const routeCount = Object.keys(SNAPSHOT.routes).length;
    if (routeCount < 400) throw new Error(`Snapshot looks truncated: ${routeCount} routes`);
    if (!SNAPSHOT.source?.startsWith("https://pve.proxmox.com/")) throw new Error("Snapshot does not record its official source");
  });

  await s.test("every dedicated tool request uses an official route, method, and parameters", async () => {
    const problems = [];
    let checked = 0;
    for (const factory of dedicatedFactories()) {
      const probe = factory(recordingClient([]));
      for (const variant of variantsFor(probe)) {
        const label = `${probe.name}${variant.level ? ` [level=${variant.level}]` : ""}${variant.type ? ` [type=${variant.type}]` : ""}`;
        let calls;
        try {
          calls = await callsFor(factory, sampleParams(probe, variant));
        } catch (err) {
          problems.push(`${label}: threw ${err.message.slice(0, 160)}`);
          continue;
        }
        if (calls.length === 0) problems.push(`${label}: made no request`);
        for (const call of calls) {
          checked++;
          const route = matchRoute(call.path);
          if (!route) {
            problems.push(`${label}: ${call.method} ${call.path} is not an official API path`);
            continue;
          }
          const spec = parameterSpec(route.template, call.method);
          if (!spec) {
            problems.push(`${label}: ${call.method} is not allowed on ${route.template} (allowed: ${Object.keys(SNAPSHOT.routes[route.template]).join(", ")})`);
            continue;
          }
          const sent = Object.keys(call.params);
          const unknown = sent.filter(key => !accepts(spec.accepted, key));
          const missing = spec.required.filter(key => !route.names.includes(key) && !sent.includes(key));
          if (unknown.length > 0) problems.push(`${label}: ${call.method} ${route.template} does not accept ${unknown.join(", ")}`);
          if (missing.length > 0) problems.push(`${label}: ${call.method} ${route.template} is missing required ${missing.join(", ")}`);
        }
      }
    }
    if (checked < 150) throw new Error(`Expected to check every dedicated tool, only checked ${checked} requests`);
    if (problems.length > 0) throw new Error(`\n    ${problems.join("\n    ")}`);
  });

  await s.test("corrected endpoints stay on their official paths", async () => {
    assertCalls(await callsFor(nodeTools.nodeReboot, { node: "pve1" }), [
      { method: "POST", path: "/nodes/pve1/status", params: { command: "reboot" } },
    ], "proxmox_node_reboot");
    assertCalls(await callsFor(nodeTools.nodeStop, { node: "pve1" }), [
      { method: "POST", path: "/nodes/pve1/status", params: { command: "shutdown" } },
    ], "proxmox_node_stop");
    assertCalls(await callsFor(replicationTools.replicationCreate, { vmid: 100, target: "pve2" }), [
      { method: "POST", path: "/cluster/replication", params: { id: "100-0", type: "local", target: "pve2" } },
    ], "proxmox_replication_create");
    assertCalls(await callsFor(replicationTools.replicationCreate, { vmid: 100, target: "pve2", jobnum: 2, schedule: "*/30", rate: 50, disable: 1 }), [
      { method: "POST", path: "/cluster/replication", params: { id: "100-2", type: "local", target: "pve2", schedule: "*/30", rate: 50, disable: 1 } },
    ], "proxmox_replication_create with options");
    assertCalls(await callsFor(replicationTools.replicationDelete, { id: "100-0", keep: 1 }), [
      { method: "DELETE", path: "/cluster/replication/100-0", params: { keep: 1 } },
    ], "proxmox_replication_delete");
    assertCalls(await callsFor(replicationTools.replicationRun, { node: "pve1", id: "100-0" }), [
      { method: "POST", path: "/nodes/pve1/replication/100-0/schedule_now", params: {} },
    ], "proxmox_replication_run");
    assertCalls(await callsFor(accessTools.tokenCreate, { userid: "pi-proxmox@pve", tokenid: "automation", comment: "pi" }), [
      { method: "POST", path: "/access/users/pi-proxmox@pve/token/automation", params: { comment: "pi", privsep: 1 } },
    ], "proxmox_token_create");
    assertCalls(await callsFor(vmTools.vmAgentGetNetworkInterfaces, { node: "pve1", vmid: 100 }), [
      { method: "GET", path: "/nodes/pve1/qemu/100/agent/network-get-interfaces", params: {} },
    ], "proxmox_vm_agent_get_network_interfaces");
  });

  await s.test("tools that returned directory indexes now read the documented data", async () => {
    assertCalls(await callsFor(haTools.haStatus, {}), [
      { method: "GET", path: "/cluster/ha/status/current", params: {} },
    ], "proxmox_ha_status");
    assertCalls(await callsFor(clusterTools.clusterConfig, {}), [
      { method: "GET", path: "/cluster/config/join", params: {} },
    ], "proxmox_cluster_config");
    assertCalls(await callsFor(nodeTools.nodeServiceStatus, { node: "pve1", service: "pveproxy" }), [
      { method: "GET", path: "/nodes/pve1/services/pveproxy/state", params: {} },
    ], "proxmox_node_service_status");
    assertCalls(await callsFor(nodeTools.nodeHardware, { node: "pve1" }), [
      { method: "GET", path: "/nodes/pve1/hardware/pci", params: {} },
    ], "proxmox_node_hardware");
    assertCalls(await callsFor(storageTools.storageScan, { node: "pve1", type: "nfs", server: "nas.example.invalid" }), [
      { method: "GET", path: "/nodes/pve1/scan/nfs", params: { server: "nas.example.invalid" } },
    ], "proxmox_storage_scan");
  });

  await s.test("corrected parameters match the official API", async () => {
    assertCalls(await callsFor(nodeTools.nodeJournal, { node: "pve1", since: 1700000000, until: 1700003600, lastentries: 50 }), [
      { method: "GET", path: "/nodes/pve1/journal", params: { since: 1700000000, until: 1700003600, lastentries: 50 } },
    ], "proxmox_node_journal");
    assertCalls(await callsFor(lxcTools.lxcResize, { node: "pve1", vmid: 100, mp: "rootfs", size: "+2G" }), [
      { method: "PUT", path: "/nodes/pve1/lxc/100/resize", params: { disk: "rootfs", size: "+2G" } },
    ], "proxmox_lxc_resize");
    const key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample pi@example";
    assertCalls(await callsFor(lxcTools.lxcCreate, { node: "pve1", vmid: 100, hostname: "ct", ostemplate: "local:vztmpl/debian.tar.zst", ssh_public_keys: key, pool: "pi-proxmox" }), [
      { method: "POST", path: "/nodes/pve1/lxc", params: { vmid: 100, hostname: "ct", ostemplate: "local:vztmpl/debian.tar.zst", pool: "pi-proxmox", "ssh-public-keys": key } },
    ], "proxmox_lxc_create");
    assertCalls(await callsFor(clusterTools.clusterUpdateOptions, { email_from: "pve@example.invalid" }), [
      { method: "PUT", path: "/cluster/options", params: { email_from: "pve@example.invalid" } },
    ], "proxmox_cluster_update_options");
    assertCalls(await callsFor(accessTools.groupCreate, { groupid: "operators", comment: "ops" }), [
      { method: "POST", path: "/access/groups", params: { groupid: "operators", comment: "ops" } },
    ], "proxmox_group_create");
    assertCalls(await callsFor(accessTools.aclUpdate, { path: "/pool/pi-proxmox", roles: "PVEAuditor", tokens: "pi-proxmox@pve!automation" }), [
      { method: "PUT", path: "/access/acl", params: { path: "/pool/pi-proxmox", roles: "PVEAuditor", tokens: "pi-proxmox@pve!automation" } },
    ], "proxmox_acl_update");
    assertCalls(await callsFor(vmTools.vmAgentFileWrite, { node: "pve1", vmid: 100, file: "/tmp/hello.txt", content: "aGVsbG8K" }), [
      { method: "POST", path: "/nodes/pve1/qemu/100/agent/file-write", params: { file: "/tmp/hello.txt", content: "aGVsbG8K", encode: 0 } },
    ], "proxmox_vm_agent_file_write passes base64 content through");
  });

  await s.test("backup job listing reads the official enabled field", async () => {
    const tool = backupTools.backupList({
      async get() {
        return [
          { id: "backup-a", enabled: 0, all: 1 },
          { id: "backup-b", vmid: "100,101" },
          { id: "backup-c", enabled: "0", pool: "pi-proxmox" },
        ];
      },
    });
    const jobs = JSON.parse((await tool.execute("backup-list", {}, undefined, undefined)).content[0].text);
    const summary = jobs.map(job => `${job.id}:${job.enabled}:${job.vmid}:${job.pool}`);
    const expected = ["backup-a:false:all:", "backup-b:true:100,101:", "backup-c:false::pi-proxmox"];
    if (JSON.stringify(summary) !== JSON.stringify(expected)) throw new Error(`Unexpected backup job mapping: ${JSON.stringify(summary)}`);
  });

  await s.test("REST client sends DELETE parameters in the query string, never a body", async () => {
    // pveproxy answers a DELETE that carries a body with 501 "Unexpected content for method".
    const original = globalThis.fetch;
    const requests = [];
    globalThis.fetch = async (url, init) => {
      requests.push({ url: String(url), init });
      return new Response(JSON.stringify({ data: null }), { status: 200 });
    };
    try {
      const client = new ProxmoxClient();
      Object.assign(client, { host: "pve.example.invalid", port: "8006", token: "test@pve!offline=not-a-secret", _dispatcher: undefined });
      await client.delete("/cluster/replication/100-0", { keep: 1, force: undefined });
      await client.delete("/nodes/pve1/qemu/100", { purge: 1 });
      await client.post("/cluster/replication", { id: "100-0", type: "local", target: "pve2" });
      await client.get("/nodes/pve1/journal", { lastentries: 10 });
    } finally {
      globalThis.fetch = original;
    }
    const [replicationDelete, vmDelete, post, get] = requests;
    for (const [request, query] of [[replicationDelete, "/cluster/replication/100-0?keep=1"], [vmDelete, "/nodes/pve1/qemu/100?purge=1"], [get, "/nodes/pve1/journal?lastentries=10"]]) {
      if (!request.url.endsWith(`/api2/json${query}`)) throw new Error(`Expected ${query}, got ${request.url}`);
      if (request.init.body !== undefined) throw new Error(`${request.init.method} ${query} must not send a body`);
      if (request.init.headers["Content-Type"]) throw new Error(`${request.init.method} ${query} must not send a Content-Type`);
    }
    if (!post.url.endsWith("/api2/json/cluster/replication")) throw new Error(`Unexpected POST URL ${post.url}`);
    if (post.init.body !== "id=100-0&type=local&target=pve2") throw new Error(`Unexpected POST body ${post.init.body}`);
  });

  await s.test("operations Proxmox does not offer are not exposed", async () => {
    if ("lxcReset" in lxcTools) throw new Error("lxc.js still exports lxcReset");
    const names = [...dedicatedFactories(), ...Object.values(rawTools)].map(factory => factory(recordingClient([])).name);
    if (names.includes("proxmox_lxc_reset")) throw new Error("proxmox_lxc_reset is still defined");
    if (names.length !== 141) throw new Error(`Expected 141 tools, found ${names.length}`);
  });

  await s.test("invalid scopes and types fail validation before any request", async () => {
    await expectValidationError(firewallTools.firewallAliases, { level: "pve1" }, "node-level aliases");
    await expectValidationError(firewallTools.firewallIpsetCreate, { level: "pve1", name: "blocklist" }, "node-level IPSet");
    await expectValidationError(firewallTools.firewallRules, { level: "vm/100" }, "guest level without node");
    await expectValidationError(firewallTools.firewallRules, { level: "ct/100", node: "pve1" }, "unknown level");
    await expectValidationError(firewallTools.firewallRuleAdd, { node: "pve1", type: "in", action: "DROP" }, "node without level would hit the cluster firewall");
    await expectValidationError(firewallTools.firewallOptionsUpdate, { level: "cluster", node: "pve1", enable: 1 }, "node with cluster level");
    await expectValidationError(firewallTools.firewallRulesDelete, { level: "pve1", node: "pve2", pos: "0" }, "node conflicting with node level");
    await expectValidationError(storageTools.storageScan, { node: "pve1", type: "ceph" }, "unsupported scan type");
    await expectValidationError(storageTools.storageScan, { node: "pve1", type: "nfs" }, "nfs scan without server");
    await expectValidationError(nodeTools.nodeHardware, { node: "pve1", type: "cpu" }, "unsupported hardware type");
  });

  await s.test("endpoints named in docs and tool descriptions exist in the official API", async () => {
    const files = [
      "README.md",
      "AGENTS.md",
      "CONTRIBUTING.md",
      "SECURITY.md",
      ...readdirSync("docs").filter(name => name.endsWith(".md")).map(name => join("docs", name)),
    ];
    const sources = files.map(file => ({ label: file, text: readFileSync(file, "utf8") }));
    for (const factory of [...dedicatedFactories(), ...Object.values(rawTools)]) {
      const tool = factory(recordingClient([]));
      const parameterText = Object.values(tool.parameters?.properties || {}).map(schema => schema.description || "").join("\n");
      sources.push({ label: tool.name, text: `${tool.description}\n${parameterText}` });
    }

    const problems = [];
    let checked = 0;
    for (const { label, text } of sources) {
      for (const mention of endpointMentions(text)) {
        checked++;
        const route = matchRoute(mention.path);
        if (!route) problems.push(`${label}: ${mention.raw} names a path the API does not have`);
        else if (!SNAPSHOT.routes[route.template][mention.method]) problems.push(`${label}: ${mention.raw} uses a method ${route.template} does not support`);
      }
    }
    if (checked < 100) throw new Error(`Expected to check the documented endpoints, only found ${checked}`);
    if (problems.length > 0) throw new Error(`\n    ${problems.join("\n    ")}`);
  });

  return s.print();
}

autoRun(run, import.meta.url);
