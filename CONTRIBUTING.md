# Contributing to `@false00/pi-proxmox`

Thanks for contributing.

This package automates real Proxmox infrastructure through Pi, so the bar for correctness and clarity is intentionally high.

## Principles

- Prefer correctness over convenience
- Prefer explicit behavior over hidden magic
- Keep documentation in sync with runtime behavior
- Treat destructive operations with extra care
- Do not guess about Proxmox API behavior; verify it in code, docs, or live tests

## Repository layout

```text
dist/        Runtime source of truth
docs/        Bundled Proxmox reference material
tests/       Integration and runtime-behavior tests
.github/     CI workflow, issue templates, and repo automation
README.md    User-facing docs
AGENTS.md    Maintainer/agent operating guide
SECURITY.md  Vulnerability reporting and security policy
```

## Local development

Requirements:

- Node.js 20+
- Access to a reachable Proxmox VE environment for integration tests
- A configured `~/.config/pi-proxmox/.env`

Install dependencies:

```bash
npm install
```

Run the full suite:

```bash
npm test
```

Run individual suites:

```bash
npm run test:smoke
npm run test:auth
npm run test:pagination
npm run test:vm-agent
npm run test:execute
npm run test:lxc
npm run test:vm
npm run test:upload
npm run test:runtime
npm run test:raw-api
npm run test:package
npm run audit:official-api
```

## Change checklist

Before opening a PR or handing work off for review:

1. Update the runtime code in `dist/`
2. Update relevant tool descriptions in `dist/tools/*.js`
3. Update `README.md` for any user-visible behavior change
4. Update `AGENTS.md` if maintainer or agent expectations changed
5. Add or update tests
6. Run `npm test`
7. Run `npm run audit:official-api` if official-coverage claims or raw coverage behavior changed
8. Run `npm pack --dry-run` if packaging or metadata changed

## Tests

This project prefers live behavior verification over mocks, while still keeping non-live package and smoke checks available for CI and quick local validation.

Expectations:

- New or changed features should include success and error-path tests
- Tests that create resources must clean them up
- Raw API coverage changes should include tests for the universal tools where practical
- Package and trust-signal changes should include structural checks where practical
- Do not add tests that require unpublished secrets to be embedded in the repo

## Documentation style

Keep docs:

- concrete
- honest
- operationally useful
- aligned with shipped behavior

Avoid marketing claims you cannot verify.

## Security

Please read [SECURITY.md](SECURITY.md) before reporting vulnerabilities or making changes that affect credentials, auth, or destructive operations.

## Release policy

Maintainers do not commit, push, or publish from agent sessions unless the user explicitly asks for it.
