# Troubleshooting

This document covers the most common operational issues seen with `@false00/pi-proxmox`.

## Empty VM or container results

Symptoms:

- `proxmox_vm_list` returns no VMs
- `proxmox_lxc_list` returns no containers
- storage or cluster visibility looks incomplete

Likely causes:

- the API token, or its user, has no grant on a path that covers those guests; a privilege-separated token gets the intersection of both, so both need the grant
- the guests are outside the pool or path you granted

Recommended fix:

- grant the role (for example `PVEAuditor`) to both the user and the token on the narrowest path that covers the guests
- do not switch to a `root@pam` token or disable privilege separation

See:

- [docs/PERMISSIONS.md](PERMISSIONS.md)

## `/nodes/{node}/execute` fails while other tools work

Symptoms:

- `proxmox_node_execute` fails with authentication or permission errors
- other token-backed tools still work

Likely cause:

- `/nodes/{node}/execute` is root-only in the Proxmox API (`root@pam`), so it rejects API tokens; with the recommended least-privilege setup this failure is expected

Recommended fix:

- run the batched requests individually with the dedicated tools or `proxmox_api_call`
- the `root@pam` password fallback (`PROXMOX_USERNAME` and `PROXMOX_PASSWORD`) is optional and discouraged; if you deliberately enable it, isolate it as described in [docs/PERMISSIONS.md](PERMISSIONS.md)

## `Permission check failed` errors

Symptoms:

- a tool fails with an `authentication` category error that mentions `Permission check failed`

Likely cause:

- the token, or its user, lacks the privilege that endpoint checks on that path

Recommended fix:

- look the tool up in the privilege map in [docs/PERMISSIONS.md](PERMISSIONS.md) and grant the missing privilege through a role, to both the user and the token, on the narrowest path that works

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
