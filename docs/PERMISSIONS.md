# Permissions and authentication

This document explains the permission model and authentication expectations for `@false00/pi-proxmox`.

## Recommended setup

For broad tool coverage, use:

- a dedicated Proxmox automation user or token owner
- an API token with sufficient rights for the operations you want Pi to perform
- privilege separation disabled for the token when you need full administrative coverage

## Why privilege separation matters

In Proxmox, API tokens created with privilege separation may appear to authenticate successfully while still returning incomplete or empty results for some resource listings.

In practice, this commonly affects:

- VM listings
- container listings
- storage visibility
- other administrative endpoints

Recommended CLI example:

```bash
pveum user token add root@pam automation --privsep=0
```

## `/nodes/{node}/execute` is special

This package verifies that ordinary token-based API access can succeed while `/nodes/{node}/execute` still requires password/ticket fallback in the tested environment.

That means:

- normal API token usage can work for most tools
- `proxmox_node_execute` may still need:
  - `PROXMOX_USERNAME`
  - `PROXMOX_PASSWORD`

This is why the password fallback path is intentionally preserved.

## Minimum documented expectations

For the package as a whole:

- `PROXMOX_TOKEN_ID`
- `PROXMOX_TOKEN_SECRET`

For `/nodes/{node}/execute` reliability in environments like the verified one:

- `PROXMOX_USERNAME`
- `PROXMOX_PASSWORD`

## Common failure patterns

### Authentication works, but VM or CT lists are empty

Likely cause:

- token privilege separation is enabled
- or permissions are too narrow

### Most tools work, but `proxmox_node_execute` fails

Likely cause:

- `/nodes/{node}/execute` rejected API-token auth

Fix:

- configure username/password fallback in `~/.config/pi-proxmox/.env`

### Guest agent tools fail

Likely cause:

- QEMU guest agent not enabled in the VM config
- guest agent package not installed inside the VM

## Security guidance

- prefer dedicated automation credentials over personal admin credentials where possible
- avoid storing secrets in the repository
- use restricted permissions on local `.env` files
- test destructive operations on non-critical workloads first
