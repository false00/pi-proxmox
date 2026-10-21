# Changelog

All notable changes to `@false00/pi-proxmox` are documented here.

The format is intentionally simple and human-readable.

## Unreleased

### Breaking changes
- Raised the declared Node.js floor from `>=22.0.0` to `>=22.19.0`, the minimum that the `undici` 8.x runtime dependency already required.

### Added
- Added a stdio MCP bridge that exposes the existing `proxmox_*` tool surface to VS Code and other MCP clients, with non-live protocol and schema coverage.

### Changed
- LXC template listing now reads `vztmpl` content from a selectable storage backend instead of using the obsolete node template endpoint.
- Updated pinned GitHub Actions and grouped CodeQL updates so its initialization and analysis steps stay on the same version.
- Stabilized the protected package CI check name and expanded CI to cover the MCP bridge.
- Updated the pinned GitHub Actions to `actions/setup-node` 7.1.0 and `github/codeql-action` 4.39.1, still pinned to full commit SHAs.

### Security
- Updated `@earendil-works/pi-coding-agent`, `undici`, `typebox`, `brace-expansion`, and `protobufjs` to patched versions that pass the repository audit gate.
- Setup guidance now recommends a dedicated non-root user, a privilege-separated API token, and narrowly scoped ACLs (starting read-only) instead of a `root@pam` token with privilege separation disabled. `docs/PERMISSIONS.md` maps each tool to the privilege and path Proxmox checks.
- The password fallback is now documented as optional and discouraged: `/nodes/{node}/execute` is root-only, so leaving the fallback unset makes `proxmox_node_execute` fail closed. Runtime hints, error guidance, tool descriptions, and the auto-created `.env` template no longer point to root tokens or to disabling privilege separation.
- Resolved every open Dependabot alert and `npm audit` finding (the alerts were 1 critical, 7 high, 12 moderate, and 3 low): `@modelcontextprotocol/sdk` 1.32.1 and `undici` 8.12.3 (runtime dependencies), plus the transitive `proxy-addr` 2.0.8, `fast-uri` 3.1.9, `hono` 4.13.13, `ip-address` 10.7.4, and `qs` 6.16.1. No npm `overrides` are used.
- Updated the `@earendil-works/pi-coding-agent` development dependency from 0.84.1 to 1.3.0 (and `typebox` to 1.4.2). Pi 0.84.1 pins the vulnerable `undici` 8.9.0 and `brace-expansion` 5.0.9 in its `package.json` and `npm-shrinkwrap.json`; instead of forcing other versions into it with npm `overrides`, the upgrade brings Pi's own patched pins (`undici` 8.10.2, `brace-expansion` 5.0.12). Pi's 1.x breaking changes do not touch the extension contract this package uses (`pi.registerTool()` with `name`, `label`, `description`, TypeBox `parameters`, and `execute(toolCallId, params, signal, onUpdate, ctx)`), so no runtime code changed, and the peer dependency stays `"*"` as Pi's package guidance requires.

## 1.0.2 - 2026-07-16

### Added
- Scheduled CodeQL scanning for the JavaScript codebase.

### Changed
- Updated `undici` to `^8.7.0` and `typebox` to `^1.3.6`.
- Hardened GitHub Actions with immutable action SHAs, `npm ci`, dependency review, and stricter repository security settings.

## 1.0.1 - 2026-06-23

### Changed
- Updated `undici` from `^8.4.1` to `^8.5.0` to resolve npm audit advisories affecting the package dependency.

## 1.0.0 - 2026-06-17

### Added
- Universal API coverage tools:
  - `proxmox_api_call`
  - `proxmox_api_upload_file`
- Official API coverage audit documentation in `docs/API_COVERAGE_AUDIT.md`
- Compatibility notes in `docs/COMPATIBILITY.md`
- Usage examples in `docs/EXAMPLES.md`
- Permissions guide in `docs/PERMISSIONS.md`
- Troubleshooting guide in `docs/TROUBLESHOOTING.md`
- Official API audit script: `npm run audit:official-api`
- Raw API integration coverage in `tests/raw-api.test.mjs`
- Non-live smoke coverage in `tests/smoke.test.mjs`
- GitHub CI workflow and repository issue / PR templates

### Changed
- Package guidance now explicitly describes the project as a curated Proxmox tool suite plus universal raw API escape hatches
- Documentation now includes adoption-focused guidance, tested environment notes, tool-selection guidance, stability guarantees, and operational docs
- Runtime code now uses the Pi-preferred `typebox` package name in imports
- `/nodes/{node}/execute` guidance now matches the official API more closely: batched node-relative API requests, not arbitrary shell execution; official `args` is preferred while legacy `body` remains supported
- Declared Node.js support was tightened from `>=20` to `>=22` to match actual CI/runtime compatibility with the current dependency set

## 0.2.0 - 2026-06-17

### Added
- `CONTRIBUTING.md`
- `SECURITY.md`
- `dist/index.d.ts`
- `tests/runtime.test.mjs`
- `tests/package.test.mjs`

### Changed
- Package metadata hardened for Pi package trust and discoverability
- README rewritten to better explain scope, trust model, runtime behavior, and development workflow
- AGENTS guide upgraded into a maintainer operating manual
- Tool runtime now throws proper Pi tool errors instead of returning fake success payloads on failure
- Tool progress updates now use Pi-compatible partial update payloads
- `PROXMOX_TOOL_TIMEOUT_MS` is now enforced in the shared tool runtime

## 0.1.16 - 2026-06-13

- Last pre-hardening release before the trust, runtime, and package-structure improvements introduced in 0.2.x.
