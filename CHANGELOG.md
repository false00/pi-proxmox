# Changelog

All notable changes to `@false00/pi-proxmox` are documented here.

The format is intentionally simple and human-readable.

## Unreleased

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
