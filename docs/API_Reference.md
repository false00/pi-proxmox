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
| GET | `/access/tfa` | List TFA entries |
| GET | `/access/tfa/{userid}` | List a user's TFA entries |
| POST | `/access/tfa/{userid}` | Add a TFA entry |
| DELETE | `/access/tfa/{userid}/{id}` | Remove a TFA entry |
| GET | `/access/users/{userid}/token` | List a user's API tokens |
| POST | `/access/users/{userid}/token/{tokenid}` | Create an API token |
| DELETE | `/access/users/{userid}/token/{tokenid}` | Delete an API token |
| PUT | `/access/password` | Change password |
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
| GET | `/cluster/config/join` | Cluster join information |
| POST | `/cluster/config/join` | Join this node to a cluster |
| GET | `/cluster/config/nodes` | Corosync node list |
| GET | `/cluster/ha/status/current` | HA manager status |
| GET | `/cluster/ha/status/manager_status` | Full HA manager status, including LRM status |
| GET | `/cluster/ha/resources` | HA resource list |
| POST | `/cluster/ha/resources` | Add HA resource |
| GET | `/cluster/ha/resources/{sid}` | Get HA resource |
| PUT | `/cluster/ha/resources/{sid}` | Update HA resource |
| DELETE | `/cluster/ha/resources/{sid}` | Remove HA resource |
| GET | `/cluster/ha/rules` | HA rule list |
| POST | `/cluster/ha/rules` | Create HA rule |
| GET | `/cluster/ha/rules/{rule}` | Get HA rule |
| PUT | `/cluster/ha/rules/{rule}` | Update HA rule |
| DELETE | `/cluster/ha/rules/{rule}` | Delete HA rule |
| GET | `/cluster/ha/groups` | HA group list (deprecated in favor of HA rules) |
| POST | `/cluster/ha/groups` | Create HA group (deprecated) |
| GET | `/cluster/ha/groups/{group}` | Get HA group (deprecated) |
| PUT | `/cluster/ha/groups/{group}` | Update HA group (deprecated) |
| DELETE | `/cluster/ha/groups/{group}` | Delete HA group (deprecated) |
| GET | `/cluster/ceph/status` | Ceph status |
| GET | `/cluster/ceph/metadata` | Ceph daemon metadata |
| GET | `/cluster/ceph/flags` | Ceph flags |
| PUT | `/cluster/ceph/flags` | Set Ceph flags |
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
| GET | `/cluster/metrics/server` | Metrics server list |
| POST | `/cluster/metrics/server/{id}` | Add metrics server |
| GET | `/cluster/acme` | ACME index |
| POST | `/cluster/acme/account` | Register ACME account |
| POST | `/cluster/acme/plugins` | Add ACME DNS plugin |
| GET | `/cluster/notifications` | Notification index |
| POST | `/cluster/notifications/endpoints/smtp` | Add SMTP endpoint (also `sendmail`, `gotify`, `webhook`) |
| GET | `/cluster/mapping` | Device mapping |

### `/nodes/{node}`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/nodes` | List all nodes |
| GET | `/nodes/{node}` | Get node details |
| GET | `/nodes/{node}/status` | Node status |
| GET | `/nodes/{node}/config` | Node config |
| PUT | `/nodes/{node}/config` | Update config |
| GET | `/nodes/{node}/version` | Node version |
| GET | `/nodes/{node}/apt` | APT info |
| POST | `/nodes/{node}/apt/update` | Refresh package index |
| GET | `/nodes/{node}/capabilities` | System capabilities |
| GET | `/nodes/{node}/certificates` | Certificate list |
| PUT | `/nodes/{node}/certificates/acme/certificate` | Renew ACME certificate |
| GET | `/nodes/{node}/dns` | DNS config |
| PUT | `/nodes/{node}/dns` | Update DNS |
| GET | `/nodes/{node}/time` | Time config |
| PUT | `/nodes/{node}/time` | Set time |
| GET | `/nodes/{node}/hardware/pci` | PCI devices |
| GET | `/nodes/{node}/hardware/usb` | USB devices |
| GET | `/nodes/{node}/disks` | Disk list |
| GET | `/nodes/{node}/disks/list` | Block device list |
| GET | `/nodes/{node}/disks/smart` | SMART data (`disk=<device>`) |
| POST | `/nodes/{node}/disks/initgpt` | Initialize disk with GPT |
| POST | `/nodes/{node}/disks/zfs` | Create ZFS pool |
| POST | `/nodes/{node}/disks/lvm` | Create LVM |
| POST | `/nodes/{node}/disks/directory` | Create directory storage |
| GET | `/nodes/{node}/network` | Network interfaces |
| POST | `/nodes/{node}/network` | Create interface |
| PUT | `/nodes/{node}/network/{iface}` | Update interface |
| DELETE | `/nodes/{node}/network/{iface}` | Delete interface |
| PUT | `/nodes/{node}/network` | Apply pending network changes |
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
| POST | `/nodes/{node}/execute` | Execute batched node API requests |
| POST | `/nodes/{node}/status` | Reboot or shut down the node (`command=reboot` or `shutdown`) |
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
