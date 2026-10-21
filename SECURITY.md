# Security policy

`@false00/pi-proxmox` is an infrastructure automation package for the Pi coding agent. It can issue real Proxmox API calls that affect VMs, containers, storage, firewall rules, ACLs, and cluster operations.

## Supported security posture

We aim to keep the package:

- explicit about destructive behavior
- conservative with auth handling
- transparent about limitations
- free of hard-coded secrets

## Repository security automation

This repository keeps security automation close to the shipped package:

- GitHub Actions uses immutable action SHAs for third-party workflow steps
- CI uses `npm ci` and runs `npm audit --audit-level=high`
- pull requests run GitHub dependency review to block high-severity vulnerable additions
- CodeQL scans the JavaScript codebase on pushes, pull requests, and a weekly schedule
- GitHub repository settings should keep vulnerability alerts, automated security fixes, private vulnerability reporting, and branch protection enabled

## Reporting a vulnerability

If you discover a security issue, please report it privately to the maintainer before opening a public issue.

Current maintainer contact from `package.json`:

- `false00 <jortega@curl.red>`

Please include:

- package version
- affected tool name or file path
- reproduction steps
- impact assessment
- whether the issue exposes secrets, privilege escalation, or destructive unintended behavior

## Scope

Security-sensitive areas include:

- authentication and token handling
- password fallback behavior
- file upload behavior
- destructive tools such as delete, stop, reboot, rollback, ACL, firewall, and HA changes
- any behavior that can cause Pi to misinterpret a failed operation as successful

## Secrets handling expectations

- Never commit real Proxmox tokens, passwords, or SSH keys
- Keep `~/.config/pi-proxmox/.env` out of version control
- Prefer API tokens over passwords where possible
- Use restricted file permissions for local credential files

## Operational guidance

For production use:

- use a dedicated, non-root Proxmox user and an API token with privilege separation enabled
- grant roles to both the user and the token on the narrowest path that works (for example a resource pool), starting read-only; see [docs/PERMISSIONS.md](docs/PERMISSIONS.md)
- do not use `root@pam` tokens or credentials for everyday work, and leave the password fallback unset so root-only operations fail closed
- set `PROXMOX_VERIFY_SSL=true` once the Proxmox host presents a certificate this machine trusts; the default `false` accepts the self-signed certificate Proxmox installs, and it applies only to requests to that host (files that `proxmox_storage_upload` downloads from other URLs are always TLS-verified)
- keep access-control privileges (users, tokens, ACLs, roles) off the token Pi uses
- scope and review access deliberately
- test against a non-critical node or lab environment before wide rollout
- review Pi prompts and active tools before approving destructive work

## Disclosure expectations

Please allow time for investigation and a fix before public disclosure, especially for issues involving:

- auth bypass
- secret leakage
- privilege escalation
- unsafe destructive actions
- package-install or package-loading trust issues
