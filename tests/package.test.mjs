import { execFileSync } from "node:child_process";
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
    if (!pkg.files?.includes("CHANGELOG.md")) throw new Error("CHANGELOG.md not published");
    if (!pkg.files?.includes("CONTRIBUTING.md")) throw new Error("CONTRIBUTING.md not published");
    if (!pkg.files?.includes("SECURITY.md")) throw new Error("SECURITY.md not published");
    if (!pkg.files?.includes("docs/API_COVERAGE_AUDIT.md")) throw new Error("API coverage audit doc not published");
    if (!pkg.files?.includes("docs/COMPATIBILITY.md")) throw new Error("Compatibility doc not published");
    if (!pkg.files?.includes("docs/EXAMPLES.md")) throw new Error("Examples doc not published");
    if (!pkg.files?.includes("docs/PERMISSIONS.md")) throw new Error("Permissions doc not published");
    if (!pkg.files?.includes("docs/TROUBLESHOOTING.md")) throw new Error("Troubleshooting doc not published");
    if (!pkg.files?.includes("scripts/audit-official-api.mjs")) throw new Error("Official API audit script not published");
    if (!pkg.peerDependencies?.["@earendil-works/pi-coding-agent"]) {
      throw new Error("Missing Pi peer dependency");
    }
    if (!pkg.peerDependencies?.typebox) {
      throw new Error("Missing typebox peer dependency");
    }
    if (!pkg.scripts?.["test:ci"]) throw new Error("Missing test:ci script");
  });

  await s.test("top-level trust docs exist", async () => {
    for (const path of ["README.md", "AGENTS.md", "CHANGELOG.md", "CONTRIBUTING.md", "SECURITY.md", "LICENSE", "docs/API_COVERAGE_AUDIT.md", "docs/COMPATIBILITY.md", "docs/EXAMPLES.md", "docs/PERMISSIONS.md", "docs/TROUBLESHOOTING.md", "scripts/audit-official-api.mjs"]) {
      if (!existsSync(path)) throw new Error(`Missing ${path}`);
    }
  });

  await s.test("repository automation and issue templates exist", async () => {
    for (const path of [
      ".github/workflows/ci.yml",
      ".github/workflows/codeql.yml",
      ".github/CODEOWNERS",
      ".github/dependabot.yml",
      ".github/pull_request_template.md",
      ".github/ISSUE_TEMPLATE/bug_report.md",
      ".github/ISSUE_TEMPLATE/feature_request.md",
      ".github/ISSUE_TEMPLATE/compatibility_report.md",
      ".github/ISSUE_TEMPLATE/config.yml",
    ]) {
      if (!existsSync(path)) throw new Error(`Missing ${path}`);
    }
  });

  await s.test("README documents trust and development sections", async () => {
    const readme = readText("README.md");
    for (const section of [
      "## Why this package",
      "## Trust, safety, and operating model",
      "### Official API coverage audit",
      "## Design philosophy",
      "## Stability guarantees",
      "## Top tasks and example prompts",
      "## Choosing dedicated tools vs raw tools",
      "## Operational docs",
      "## Compatibility",
      "## Configuration",
      "## Repository layout",
      "## Development",
      "### CI security gates",
    ]) {
      if (!readme.includes(section)) throw new Error(`Missing README section: ${section}`);
    }
  });

  await s.test("AGENTS guide documents testing and release discipline", async () => {
    const agents = readText("AGENTS.md");
    for (const section of [
      "## Mission",
      "## Pi package conventions",
      "## Testing policy",
      "## Release discipline",
      "## Release checklist",
    ]) {
      if (!agents.includes(section)) throw new Error(`Missing AGENTS section: ${section}`);
    }
  });

  await s.test("CHANGELOG documents unreleased and released entries", async () => {
    const changelog = readText("CHANGELOG.md");
    for (const section of ["## Unreleased", "## 0.2.0 - 2026-06-17"]) {
      if (!changelog.includes(section)) throw new Error(`Missing changelog section: ${section}`);
    }
  });

  await s.test("official API audit script returns structured JSON", async () => {
    const stdout = execFileSync("node", ["scripts/audit-official-api.mjs"], { encoding: "utf8" });
    const payload = JSON.parse(stdout);
    if (!payload.official?.routeCount) throw new Error("Missing official route count");
    if (!Array.isArray(payload.local?.rawCoverageTools)) throw new Error("Missing raw coverage tool list");
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
