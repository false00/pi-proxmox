# Proxmox VE API - Cluster Infrastructure

This document provides a summary of the cluster-level infrastructure endpoints. Detailed references for each subsystem are available in the dedicated files below.

| Subsystem | File | Key Paths |
|-----------|------|-----------|
| Core Cluster | [Cluster](Cluster.md) | `/cluster`, `/nodes`, `/pools`, `/version` |
| High Availability | [Cluster_HA](Cluster_HA.md) | `/cluster/ha` |
| Ceph Storage | [Cluster_Ceph](Cluster_Ceph.md) | `/cluster/ceph` |
| SDN Networking | [Cluster_SDN](Cluster_SDN.md) | `/cluster/sdn` |
| Firewall | [Cluster_Firewall](Cluster_Firewall.md) | `/cluster/firewall` |
| Backup & Services | [Cluster_Backup_Services](Cluster_Backup_Services.md) | `/cluster/backup`, `/cluster/metrics`, `/cluster/acme`, `/cluster/notifications` |

## Cluster Status
```
GET /cluster/status
```
Returns cluster membership, quorum state, and node connectivity.

```
GET /cluster/resources
```
Returns aggregated view of all cluster resources (VMs, CTs, storage, nodes).

```
GET /cluster/log
```
Access cluster-wide log entries.

```
GET /cluster/options
```
View and modify cluster-wide options.

## Required Permissions
Most cluster endpoints require `Sys.Audit` or `Sys.Modify` on `/`. Individual subsystems may require more specific permissions.
