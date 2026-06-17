# Proxmox VE API Reference

Complete documentation of the Proxmox VE REST API, covering all resource categories, authentication methods, and endpoint details.

## Package-specific operator guides
- [API Coverage Audit](API_COVERAGE_AUDIT.md) — How this package approaches full official API reach
- [Compatibility Notes](COMPATIBILITY.md) — Verified Pi and Proxmox versions
- [Examples](EXAMPLES.md) — Practical usage recipes
- [Permissions Guide](PERMISSIONS.md) — Token, privilege separation, and `/execute` auth behavior
- [Troubleshooting](TROUBLESHOOTING.md) — Common failure modes and fixes

## API Fundamentals
- [API Overview](API_Overview.md) — Architecture, base URL, JSON Schema, formats, pvesh CLI, client libraries
- [API Authentication](API_Authentication.md) — Ticket-based auth, API tokens, CSRF protection

## Access Control
- [Access Control](Access_Control.md) — Users, groups, roles, ACLs, authentication domains, TFA, permissions

## Cluster Management
- [Cluster Overview](Cluster.md) — Cluster status, options, log, nextid, node/pool/version management
- [High Availability](Cluster_HA.md) — HA groups, resources, failover configuration
- [Ceph Storage](Cluster_Ceph.md) — Ceph pool, OSD, monitor, and configuration management
- [Software Defined Networking](Cluster_SDN.md) — SDN zones, VNets, subnets, controllers
- [Cluster Firewall](Cluster_Firewall.md) — Firewall rules, aliases, IPSet, security groups
- [Backup & Services](Cluster_Backup_Services.md) — Backup jobs, restore, metrics, ACME, notifications, job tracking

## Node Management
- [Nodes](Nodes.md) — Per-node resources: QEMU, LXC, storage, replication, SDN, services, tasks
- [Node Administration](Node_Administration.md) — Hardware, disks, network, certificates, journal, syslog, config, apt, DNS, time, execute
- [Node Monitoring](Node_Monitoring.md) — RRD stats, rrddata, real-time metrics, performance data

## Virtualization
- [QEMU Virtual Machines](VM_QEMU.md) — VM lifecycle, configuration, snapshots, clone, firewall, QEMU agent
- [LXC Containers](VM_LXC.md) — Container lifecycle, configuration, snapshots, templates, firewall
- [ISO & Template Management](ISO_Template_Management.md) — ISO upload, template management, pveam

## Storage
- [Storage Backends](Storage.md) — Storage types, content management, pools
- [Storage Replication](Storage_Replication.md) — ZFS replication, scheduling, configuration

## Quick Reference
- [API Reference Index](API_Reference.md) — Full endpoint reference with links to detailed docs
