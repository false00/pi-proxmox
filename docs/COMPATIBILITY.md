# Compatibility notes

This document records the environments verified directly from this repository.

## Tested environment

| Component | Verified value |
|---|---|
| Pi runtime | `0.79.6` |
| Proxmox VE release | `9.2` |
| Proxmox VE version | `9.2.3` |
| Node.js | `>=22` supported by package metadata |

## What this means

The repository's live integration tests and runtime-behavior tests were executed successfully against a reachable Proxmox VE `9.2.3` environment using the package's current toolset.

## Authentication modes exercised

- API token authentication
- Password/ticket fallback for `/nodes/{node}/execute` behavior

In the verified environment, normal API requests worked with the configured API token, but `/nodes/{node}/execute` still required the documented password/ticket retry path.

## Coverage expectations

Verified in-repo:

- VM lifecycle
- LXC lifecycle
- storage upload
- QEMU guest-agent operations
- task and pagination behavior
- Pi runtime error and progress semantics
- universal raw API access for `GET`, `POST`, `PUT`, `DELETE`, and multipart upload workflows
- `/nodes/{node}/execute` batch execution using official `args` command objects, plus legacy `body` alias compatibility

## Caveat

These notes reflect verified environments available during repository work. Proxmox may change behavior across releases, and users should validate against their own clusters before using destructive workflows in production.
