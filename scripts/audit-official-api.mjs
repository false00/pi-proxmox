import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import vm from "node:vm";

const execFile = promisify(execFileCallback);
const API_VIEWER_URL = "https://pve.proxmox.com/pve-docs/api-viewer/apidoc.js";
const CACHED_OFFICIAL_SUMMARY = {
  routeCount: 444,
  methodCount: 675,
  methods: ["DELETE", "GET", "POST", "PUT"],
  namespaces: [
    ["nodes", 358],
    ["cluster", 259],
    ["access", 45],
    ["pools", 7],
    ["storage", 5],
    ["version", 1],
  ],
  auditedOn: "2026-06-17",
};

async function fetchApiViewerSource() {
  try {
    const response = await fetch(API_VIEWER_URL);
    if (!response.ok) {
      throw new Error(`Fetch failed with ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (fetchError) {
    try {
      const { stdout } = await execFile("curl", ["-sL", API_VIEWER_URL], { maxBuffer: 20 * 1024 * 1024 });
      if (!stdout || !stdout.includes("const apiSchema =")) {
        throw new Error("curl did not return the expected apiSchema payload");
      }
      return stdout;
    } catch (curlError) {
      throw new Error(`Failed to fetch official API viewer schema via fetch and curl. fetch: ${fetchError.message}; curl: ${curlError.message}`);
    }
  }
}

async function loadOfficialSchema() {
  const source = await fetchApiViewerSource();
  const prefix = source.split("Ext.onReady(")[0];
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${prefix}\nthis.__apiSchema = apiSchema;`, context);
  return context.__apiSchema;
}

async function loadLocalTools() {
  const mod = await import(new URL("../dist/index.js", import.meta.url));
  const tools = [];
  await mod.default({
    registerTool(tool) {
      tools.push(tool);
    },
  });
  return tools;
}

function summarizeSchema(schema) {
  let routeCount = 0;
  let methodCount = 0;
  const namespaces = new Map();
  const methods = new Set();

  function walk(nodes, base = "") {
    for (const node of nodes || []) {
      const segment = node.path || "";
      const full = segment.startsWith("/") ? segment : (base ? `${base}/${segment}` : segment);

      if (node.info) {
        routeCount += 1;
        const methodNames = Object.keys(node.info);
        methodCount += methodNames.length;
        for (const method of methodNames) methods.add(method);
        const top = full.split("/").filter(Boolean)[0] || "/";
        namespaces.set(top, (namespaces.get(top) || 0) + methodNames.length);
      }

      if (node.children) walk(node.children, full);
    }
  }

  walk(schema);

  return {
    routeCount,
    methodCount,
    methods: [...methods].sort(),
    namespaces: [...namespaces.entries()].sort((a, b) => b[1] - a[1]),
  };
}

function summarizeTools(tools) {
  const names = tools.map(tool => tool.name).sort();
  const summary = {
    total: names.length,
    rawCoverage: names.filter(name => name === "proxmox_api_call" || name === "proxmox_api_upload_file"),
    dedicated: names.filter(name => name.startsWith("proxmox_") && name !== "proxmox_api_call" && name !== "proxmox_api_upload_file"),
  };
  return { names, summary };
}

let official;
let sourceMode = "network";
let note;
try {
  const schema = await loadOfficialSchema();
  official = summarizeSchema(schema);
} catch (error) {
  sourceMode = "cached";
  note = `Live fetch failed; using cached official summary from ${CACHED_OFFICIAL_SUMMARY.auditedOn}. ${error.message}`;
  official = {
    routeCount: CACHED_OFFICIAL_SUMMARY.routeCount,
    methodCount: CACHED_OFFICIAL_SUMMARY.methodCount,
    methods: CACHED_OFFICIAL_SUMMARY.methods,
    namespaces: CACHED_OFFICIAL_SUMMARY.namespaces,
  };
}
const { summary } = summarizeTools(await loadLocalTools());

const report = {
  source: API_VIEWER_URL,
  sourceMode,
  auditedAt: new Date().toISOString(),
  official,
  local: {
    toolCount: summary.total,
    dedicatedToolCount: summary.dedicated.length,
    rawCoverageTools: summary.rawCoverage,
  },
  interpretation: {
    dedicatedCoverage: "Curated proxmox_* tools cover common day-to-day workflows.",
    universalCoverage: "proxmox_api_call plus proxmox_api_upload_file provide practical reach across the remainder of the official API viewer surface.",
  },
};

if (note) {
  report.note = note;
}

console.log(JSON.stringify(report, null, 2));
