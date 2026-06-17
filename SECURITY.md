# Security policy

`@false00/pi-proxmox` is an infrastructure automation package for the Pi coding agent. It can issue real Proxmox API calls that affect VMs, containers, storage, firewall rules, ACLs, and cluster operations.

## Supported security posture

We aim to keep the package:

- explicit about destructive behavior
- conservative with auth handling
- transparent about limitations
- free of hard-coded secrets

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

- create a dedicated Proxmox automation token
- disable privilege separation only when the tool coverage you need requires it
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
