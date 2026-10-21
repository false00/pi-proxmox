import { execFile as execFileCallback } from "node:child_process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
export const API_VIEWER_URL = "https://pve.proxmox.com/pve-docs/api-viewer/apidoc.js";
const CACHED_OFFICIAL_SUMMARY = {
  routeCount: 449,
  methodCount: 680,
  methods: ["DELETE", "GET", "POST", "PUT"],
  namespaces: [
    ["nodes", 360],
    ["cluster", 262],
    ["access", 45],
    ["pools", 7],
    ["storage", 5],
    ["version", 1],
  ],
  auditedOn: "2026-10-21",
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

// The API viewer is a JavaScript file whose first statement assigns the schema as a JSON array.
// Extract that array and parse it as data instead of evaluating any downloaded code.
export function parseApiSchema(source) {
  const marker = "const apiSchema = ";
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) throw new Error("API viewer source does not declare apiSchema");

  const start = markerIndex + marker.length;
  let depth = 0;
  let inString = false;
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (inString) {
      if (char === "\\") i++;
      else if (char === "\"") inString = false;
    } else if (char === "\"") {
      inString = true;
    } else if (char === "[" || char === "{") {
      depth++;
    } else if (char === "]" || char === "}") {
      depth--;
      if (depth === 0) return JSON.parse(source.slice(start, i + 1));
    }
  }
  throw new Error("API viewer apiSchema declaration is not terminated");
}

export async function loadOfficialSchema() {
  return parseApiSchema(await fetchApiViewerSource());
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

  function walk(nodes) {
    for (const node of nodes || []) {
      if (node.info) {
        routeCount += 1;
        const methodNames = Object.keys(node.info);
        methodCount += methodNames.length;
        for (const method of methodNames) methods.add(method);
        const top = node.path.split("/").filter(Boolean)[0] || "/";
        namespaces.set(top, (namespaces.get(top) || 0) + methodNames.length);
      }

      if (node.children) walk(node.children);
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

async function main() {
  let official;
  let sourceMode = "network";
  let note;
  try {
    official = summarizeSchema(await loadOfficialSchema());
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
      dedicatedCoverage: "Curated proxmox_* tools cover common day-to-day workflows; tests/endpoints.test.mjs checks their requests against a snapshot of this schema.",
      universalCoverage: "proxmox_api_call plus proxmox_api_upload_file provide practical reach across the remainder of the official API viewer surface.",
    },
  };

  if (note) {
    report.note = note;
  }

  console.log(JSON.stringify(report, null, 2));
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  await main();
}
