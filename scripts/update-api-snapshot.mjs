// Refreshes tests/fixtures/pve-api-snapshot.json from the official Proxmox VE API viewer.
// tests/endpoints.test.mjs checks every dedicated tool request, and every endpoint the docs name,
// against this snapshot without network access. Rerun it when Proxmox publishes API changes:
//   npm run update:api-snapshot
// Each route maps an HTTP method to its parameter names; a trailing "?" marks an optional parameter.
import { writeFileSync } from "node:fs";
import { API_VIEWER_URL, loadOfficialSchema } from "./audit-official-api.mjs";

const OUTPUT = new URL("../tests/fixtures/pve-api-snapshot.json", import.meta.url);

function collectRoutes(nodes, routes = new Map()) {
  for (const node of nodes || []) {
    if (node.info) {
      const methods = {};
      for (const method of Object.keys(node.info).sort()) {
        const properties = node.info[method].parameters?.properties || {};
        methods[method] = Object.keys(properties).sort().map(name => (properties[name].optional ? `${name}?` : name));
      }
      routes.set(node.path, methods);
    }
    collectRoutes(node.children, routes);
  }
  return routes;
}

const routes = collectRoutes(await loadOfficialSchema());
const lines = [...routes.keys()].sort().map(path => `    ${JSON.stringify(path)}: ${JSON.stringify(routes.get(path))}`);
const output = [
  "{",
  `  "source": ${JSON.stringify(API_VIEWER_URL)},`,
  `  "retrieved": ${JSON.stringify(new Date().toISOString().slice(0, 10))},`,
  "  \"routes\": {",
  lines.join(",\n"),
  "  }",
  "}",
  "",
].join("\n");

writeFileSync(OUTPUT, output);
console.log(`Wrote ${routes.size} routes to tests/fixtures/pve-api-snapshot.json`);
