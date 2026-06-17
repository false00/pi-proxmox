import { existsSync, readFileSync } from "node:fs";
import { suite, autoRun } from "./helpers.mjs";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readText(path) {
  return readFileSync(path, "utf8");
}

export async function run() {
  const s = suite("Package Structure");

  await s.test("package metadata includes trust and discovery fields", async () => {
    const pkg = readJson("package.json");

    if (!pkg.keywords?.includes("pi-package")) throw new Error("Missing pi-package keyword");
    if (!pkg.homepage) throw new Error("Missing homepage field");
    if (!pkg.bugs?.url) throw new Error("Missing bugs.url field");
    if (!pkg.pi?.extensions?.includes("./dist/index.js")) throw new Error("Missing pi.extensions entrypoint");
    if (!pkg.files?.includes("README.md")) throw new Error("README.md not published");
    if (!pkg.files?.includes("AGENTS.md")) throw new Error("AGENTS.md not published");
    if (!pkg.files?.includes("CONTRIBUTING.md")) throw new Error("CONTRIBUTING.md not published");
    if (!pkg.files?.includes("SECURITY.md")) throw new Error("SECURITY.md not published");
    if (!pkg.peerDependencies?.["@earendil-works/pi-coding-agent"]) {
      throw new Error("Missing Pi peer dependency");
    }
  });

  await s.test("top-level trust docs exist", async () => {
    for (const path of ["README.md", "AGENTS.md", "CONTRIBUTING.md", "SECURITY.md", "LICENSE"]) {
      if (!existsSync(path)) throw new Error(`Missing ${path}`);
    }
  });

  await s.test("README documents trust and development sections", async () => {
    const readme = readText("README.md");
    for (const section of [
      "## Why this package",
      "## Trust, safety, and operating model",
      "## Configuration",
      "## Repository layout",
      "## Development",
    ]) {
      if (!readme.includes(section)) throw new Error(`Missing README section: ${section}`);
    }
  });

  await s.test("AGENTS guide documents testing and release discipline", async () => {
    const agents = readText("AGENTS.md");
    for (const section of [
      "## Mission",
      "## Testing policy",
      "## Release discipline",
      "## Release checklist",
    ]) {
      if (!agents.includes(section)) throw new Error(`Missing AGENTS section: ${section}`);
    }
  });

  await s.test("Type declaration file referenced by exports exists", async () => {
    const pkg = readJson("package.json");
    const typePath = pkg.exports?.["."]?.types;
    if (!typePath) throw new Error("No exports.types field");
    const normalized = typePath.replace(/^\.\//, "");
    if (!existsSync(normalized)) throw new Error(`Missing type declaration: ${normalized}`);
  });

  return s.print();
}

autoRun(run, import.meta.url);
