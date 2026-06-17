# Proxmox API coverage audit

This document records how `@false00/pi-proxmox` approaches "full API coverage" without turning the package into an unreadable one-tool-per-endpoint dump.

## Audit source

Official Proxmox VE API viewer:

- https://pve.proxmox.com/pve-docs/api-viewer/

Audit date:

- 2026-06-17

Repository audit command:

```bash
npm run audit:official-api
```

## Official surface observed at audit time

From the official API viewer schema published by Proxmox VE:

- **444 routes**
- **675 route/method combinations**
- top-level namespaces:
  - `access`
  - `cluster`
  - `nodes`
  - `pools`
  - `storage`
  - `version`
- supported REST methods observed:
  - `GET`
  - `POST`
  - `PUT`
  - `DELETE`

## Package coverage model

The package intentionally uses a **two-layer coverage strategy**.

### Layer 1: dedicated tools for common workflows

The bulk of day-to-day Proxmox operations are exposed through dedicated tools such as:

- VM lifecycle and guest-agent operations
- LXC lifecycle operations
- node inspection and node service controls
- storage management
- firewall operations
- backups, HA, replication, and tasks
- access control primitives

These tools are optimized for Pi:

- stable names
- agent-readable descriptions
- predictable parameter schemas
- structured JSON outputs
- consistent error handling

### Layer 2: universal raw API escape hatches

To ensure the package can reach **the rest of the official API surface**, it includes:

- `proxmox_api_call`
- `proxmox_api_upload_file`

Together, these tools provide practical coverage for:

- any official JSON endpoint under `/api2/json`
- standard `GET`, `POST`, `PUT`, and `DELETE` operations
- multipart upload-style endpoints that require file submission

## Why this approach

A literal one-tool-per-endpoint implementation for the full Proxmox API would create hundreds of narrowly-scoped tools, increase maintenance cost, and make the package harder for Pi to use effectively.

The hybrid model keeps the package:

- ergonomic for common tasks
- complete for uncommon tasks
- resilient to future API growth
- easier to test and document

## Validation in this repository

Coverage is backed by:

- dedicated domain tests in `tests/`
- runtime-behavior tests for Pi tool semantics
- raw API tests that exercise:
  - generic `GET`
  - generic `POST`
  - generic `PUT`
  - generic `DELETE`
  - generic multipart upload
- `/nodes/{node}/execute` tests that confirm batched node-relative API execution using official `args` command objects

## Caveat

This audit reflects the official Proxmox VE API viewer on the audit date above. Proxmox may add, remove, or change endpoints over time.

The raw API tools are intended to reduce the maintenance gap when that happens.
