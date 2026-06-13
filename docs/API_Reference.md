# Proxmox VE API — Full Reference Index

Comprehensive index of all Proxmox VE API resource paths. See the linked documents for detailed parameter and usage information.

## Quick Links to Detailed Documentation
| Category | File |
|----------|------|
| General Overview | [API_Overview](API_Overview.md) |
| Authentication | [API_Authentication](API_Authentication.md) |
| Access Control | [Access_Control](Access_Control.md) |
| Cluster | [Cluster](Cluster.md) |
| High Availability | [Cluster_HA](Cluster_HA.md) |
| Ceph Storage | [Cluster_Ceph](Cluster_Ceph.md) |
| SDN Networking | [Cluster_SDN](Cluster_SDN.md) |
| Firewall | [Cluster_Firewall](Cluster_Firewall.md) |
| Backup & Services | [Cluster_Backup_Services](Cluster_Backup_Services.md) |
| Nodes (overview) | [Nodes](Nodes.md) |
| Node Administration | [Node_Administration](Node_Administration.md) |
| Node Monitoring | [Node_Monitoring](Node_Monitoring.md) |
| QEMU VMs | [VM_QEMU](VM_QEMU.md) |
| LXC Containers | [VM_LXC](VM_LXC.md) |
| ISO & Templates | [ISO_Template_Management](ISO_Template_Management.md) |
| Storage | [Storage](Storage.md) |
| Storage Replication | [Storage_Replication](Storage_Replication.md) |

## Resource Tree

### `/version`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/version` | Proxmox VE version information |

### `/access`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/access/ticket` | Create authentication ticket |
| GET | `/access/users` | List users |
| POST | `/access/users` | Create user |
| GET | `/access/users/{userid}` | Get user |
| PUT | `/access/users/{userid}` | Update user |
| DELETE | `/access/users/{userid}` | Delete user |
| GET | `/access/groups` | List groups |
| POST | `/access/groups` | Create group |
| GET | `/access/groups/{groupid}` | Get group |
| PUT | `/access/groups/{groupid}` | Update group |
| DELETE | `/access/groups/{groupid}` | Delete group |
| GET | `/access/roles` | List roles |
| POST | `/access/roles` | Create role |
| GET | `/access/roles/{roleid}` | Get role |
| PUT | `/access/roles/{roleid}` | Update role |
| DELETE | `/access/roles/{roleid}` | Delete role |
| GET | `/access/acl` | List ACL entries |
| PUT | `/access/acl` | Update ACL |
| GET | `/access/domains` | List auth domains |
| GET | `/access/domains/{realm}` | Get domain config |
| GET | `/access/tfa` | TFA configuration |
| GET | `/access/password` | Password management |
| POST | `/access/password` | Change password |
| GET | `/access/permissions` | List user permissions |
| GET | `/access/openid` | OpenID Connect config |

### `/cluster`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/cluster/status` | Cluster status |
| GET | `/cluster/resources` | Resource list |
| GET | `/cluster/log` | Cluster log |
| GET | `/cluster/options` | Cluster options |
| PUT | `/cluster/options` | Update options |
| GET | `/cluster/nextid` | Get next VM ID |
| GET | `/cluster/config` | Join config |
| GET | `/cluster/ha/status` | HA status |
| GET | `/cluster/ha/resources` | HA resource list |
| POST | `/cluster/ha/resources` | Add HA resource |
| GET | `/cluster/ha/resources/{sid}` | Get HA resource |
| PUT | `/cluster/ha/resources/{sid}` | Update HA resource |
| DELETE | `/cluster/ha/resources/{sid}` | Remove HA resource |
| GET | `/cluster/ha/groups` | HA group list |
| POST | `/cluster/ha/groups` | Create HA group |
| GET | `/cluster/ha/groups/{group}` | Get HA group |
| PUT | `/cluster/ha/groups/{group}` | Update HA group |
| DELETE | `/cluster/ha/groups/{group}` | Delete HA group |
| GET | `/cluster/ceph/status` | Ceph status |
| GET | `/cluster/ceph/config` | Ceph config |
| PUT | `/cluster/ceph/config` | Update Ceph config |
| GET | `/cluster/ceph/flags` | Ceph flags |
| GET | `/cluster/ceph/mon` | List monitors |
| POST | `/cluster/ceph/mon` | Add monitor |
| DELETE | `/cluster/ceph/mon/{monid}` | Remove monitor |
| GET | `/cluster/ceph/osd` | List OSDs |
| POST | `/cluster/ceph/osd` | Create OSD |
| PUT | `/cluster/ceph/osd/{osdid}` | Update OSD |
| DELETE | `/cluster/ceph/osd/{osdid}` | Remove OSD |
| GET | `/cluster/ceph/pool` | List pools |
| POST | `/cluster/ceph/pool` | Create pool |
| PUT | `/cluster/ceph/pool/{poolname}` | Update pool |
| DELETE | `/cluster/ceph/pool/{poolname}` | Remove pool |
| GET | `/cluster/sdn/zones` | SDN zone list |
| POST | `/cluster/sdn/zones` | Create zone |
| PUT | `/cluster/sdn/zones/{zone}` | Update zone |
| DELETE | `/cluster/sdn/zones/{zone}` | Delete zone |
| GET | `/cluster/sdn/vnets` | VNet list |
| POST | `/cluster/sdn/vnets` | Create VNet |
| DELETE | `/cluster/sdn/vnets/{vnet}` | Delete VNet |
| GET | `/cluster/sdn/vnets/{vnet}/subnets` | List subnets |
| POST | `/cluster/sdn/vnets/{vnet}/subnets` | Add subnet |
| GET | `/cluster/firewall/rules` | Cluster firewall rules |
| POST | `/cluster/firewall/rules` | Add rule |
| PUT | `/cluster/firewall/rules/{pos}` | Update rule |
| DELETE | `/cluster/firewall/rules/{pos}` | Delete rule |
| GET | `/cluster/firewall/aliases` | Firewall aliases |
| POST | `/cluster/firewall/aliases` | Add alias |
| GET | `/cluster/firewall/ipset` | IPSet list |
| POST | `/cluster/firewall/ipset` | Create IPSet |
| GET | `/cluster/firewall/groups` | Security groups |
| POST | `/cluster/firewall/groups` | Create group |
| GET | `/cluster/firewall/options` | Firewall options |
| PUT | `/cluster/firewall/options` | Update options |
| GET | `/cluster/backup` | Backup job list |
| POST | `/cluster/backup` | Create backup job |
| GET | `/cluster/backup/{id}` | Get backup job |
| PUT | `/cluster/backup/{id}` | Update backup job |
| DELETE | `/cluster/backup/{id}` | Delete backup job |
| GET | `/cluster/jobs` | Job list |
| GET | `/cluster/metrics` | Metrics config |
| POST | `/cluster/metrics` | Add metrics server |
| GET | `/cluster/acme` | ACME config |
| POST | `/cluster/acme` | Setup ACME |
| GET | `/cluster/notifications` | Notification config |
| POST | `/cluster/notifications/endpoints` | Add endpoint |
| GET | `/cluster/mapping` | Device mapping |

### `/nodes/{node}`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/nodes` | List all nodes |
| POST | `/nodes` | Create node (join) |
| GET | `/nodes/{node}` | Get node details |
| GET | `/nodes/{node}/status` | Node status |
| GET | `/nodes/{node}/config` | Node config |
| PUT | `/nodes/{node}/config` | Update config |
| GET | `/nodes/{node}/version` | Node version |
| GET | `/nodes/{node}/apt` | APT info |
| POST | `/nodes/{node}/apt/update` | Refresh package index |
| GET | `/nodes/{node}/capabilities` | System capabilities |
| GET | `/nodes/{node}/certificates` | Certificate list |
| POST | `/nodes/{node}/certificates/{cert}/renew` | Renew certificate |
| GET | `/nodes/{node}/dns` | DNS config |
| PUT | `/nodes/{node}/dns` | Update DNS |
| GET | `/nodes/{node}/time` | Time config |
| PUT | `/nodes/{node}/time` | Set time |
| GET | `/nodes/{node}/hardware` | Hardware list |
| GET | `/nodes/{node}/disks` | Disk list |
| GET | `/nodes/{node}/disks/list` | Block device list |
| GET | `/nodes/{node}/disks/smart/{disk}` | SMART data |
| POST | `/nodes/{node}/disks/init` | Initialize disk |
| POST | `/nodes/{node}/disks/zfs` | Create ZFS pool |
| POST | `/nodes/{node}/disks/lvm` | Create LVM |
| POST | `/nodes/{node}/disks/directory` | Create directory storage |
| GET | `/nodes/{node}/network` | Network interfaces |
| POST | `/nodes/{node}/network` | Create interface |
| PUT | `/nodes/{node}/network/{iface}` | Update interface |
| DELETE | `/nodes/{node}/network/{iface}` | Delete interface |
| POST | `/nodes/{node}/network/reload` | Apply network changes |
| GET | `/nodes/{node}/services` | Service list |
| POST | `/nodes/{node}/services/{svc}/start` | Start service |
| POST | `/nodes/{node}/services/{svc}/stop` | Stop service |
| POST | `/nodes/{node}/services/{svc}/restart` | Restart service |
| GET | `/nodes/{node}/journal` | Journal log |
| GET | `/nodes/{node}/syslog` | Syslog |
| GET | `/nodes/{node}/tasks` | Task list |
| GET | `/nodes/{node}/tasks/{upid}/status` | Task status |
| GET | `/nodes/{node}/tasks/{upid}/log` | Task log |
| DELETE | `/nodes/{node}/tasks/{upid}` | Stop task |
| GET | `/nodes/{node}/rrddata` | RRD data |
| GET | `/nodes/{node}/subscription` | Subscription status |
| POST | `/nodes/{node}/execute` | Execute command |
| POST | `/nodes/{node}/stop` | Stop node |
| POST | `/nodes/{node}/reboot` | Reboot node |
| GET | `/nodes/{node}/netstat` | Network stats |
| POST | `/nodes/{node}/wakeonlan` | Wake on LAN |

### `/nodes/{node}/qemu`
See [VM_QEMU](VM_QEMU.md) for complete QEMU VM endpoint reference.

### `/nodes/{node}/lxc`
See [VM_LXC](VM_LXC.md) for complete LXC container endpoint reference.

### `/pools`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/pools` | List pools |
| POST | `/pools` | Create pool |
| GET | `/pools/{poolid}` | Get pool |
| PUT | `/pools/{poolid}` | Update pool |
| DELETE | `/pools/{poolid}` | Delete pool |

### `/storage`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/storage` | List storage |
| POST | `/storage` | Create storage |
| GET | `/storage/{storageid}` | Get storage |
| PUT | `/storage/{storageid}` | Update storage |
| DELETE | `/storage/{storageid}` | Delete storage |
