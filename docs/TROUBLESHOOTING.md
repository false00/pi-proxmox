# Troubleshooting

This document covers the most common operational issues seen with `@false00/pi-proxmox`.

## Empty VM or container results

Symptoms:

- `proxmox_vm_list` returns no VMs
- `proxmox_lxc_list` returns no containers
- storage or cluster visibility looks incomplete

Likely causes:

- token privilege separation is enabled
- token permissions are too narrow

See:

- [docs/PERMISSIONS.md](PERMISSIONS.md)

## `/nodes/{node}/execute` fails while other tools work

Symptoms:

- `proxmox_node_execute` fails with authentication or permission errors
- other token-backed tools still work

Likely cause:

- the special `/nodes/{node}/execute` endpoint rejected API-token auth in your environment

Recommended fix:

- configure `PROXMOX_USERNAME` and `PROXMOX_PASSWORD` so the documented ticket-auth retry path can be used

## Guest agent operations fail

Symptoms:

- `proxmox_vm_agent_exec` fails
- `proxmox_vm_agent_ping` fails
- file read/write via guest agent fails

Likely causes:

- guest agent is disabled in VM config
- guest agent package is not installed or not running inside the VM

## Storage upload issues

Symptoms:

- upload task is created but file does not show up immediately
- uploaded ISO or template does not appear in content listing right away

Notes:

- uploads can be asynchronous
- always verify via storage content listing or task status

## Timeout errors

Symptoms:

- tool returns a timeout category

Mitigations:

- increase `PROXMOX_TIMEOUT_MS`
- increase `PROXMOX_TOOL_TIMEOUT_MS`
- retry when the error is marked retryable

## Raw API and `/execute` confusion

Important distinction:

- `proxmox_api_call` talks directly to any official Proxmox API path under `/api2/json`
- `proxmox_node_execute` batches multiple **node-relative API calls**
- `/nodes/{node}/execute` is **not shell execution**

## Still stuck?

When filing an issue, include:

- package version
- Proxmox version
- Pi version
- the tool name used
- the error category and message
- whether you are using token-only auth or token-plus-password fallback
