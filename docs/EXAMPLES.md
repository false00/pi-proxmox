# Usage examples

This document gives concrete examples of how `@false00/pi-proxmox` is intended to be used from Pi.

## Dedicated tools first

For common workflows, prefer the dedicated `proxmox_*` tools.

### Inspect the cluster

```text
List all nodes in my Proxmox cluster
Show cluster status and quorum
List recent tasks on pve1
```

Likely tools:

- `proxmox_node_list`
- `proxmox_cluster_status`
- `proxmox_task_list`

### VM lifecycle

```text
List all VMs on pve1
Start VM 101 on pve1
Shut down VM 101 gracefully
Take a snapshot of VM 101 named pre-upgrade
Roll back VM 101 to snapshot pre-upgrade
```

Likely tools:

- `proxmox_vm_list`
- `proxmox_vm_start`
- `proxmox_vm_shutdown`
- `proxmox_vm_snapshot`
- `proxmox_vm_snapshot_rollback`

### LXC lifecycle

```text
List all containers on pve1
Create a Debian LXC container with 2 GB RAM on pve1
Stop container 201 on pve1
Delete container 201 on pve1
```

Likely tools:

- `proxmox_lxc_list`
- `proxmox_lxc_create`
- `proxmox_lxc_stop`
- `proxmox_lxc_delete`

### Storage

```text
List all storage backends on pve1
Show ISO content on local storage
Upload an ISO to local storage on pve1
```

Likely tools:

- `proxmox_storage_list`
- `proxmox_storage_content`
- `proxmox_storage_upload`

### Guest agent operations

```text
Run hostname inside VM 118
Read /etc/hostname from VM 118
List network interfaces inside VM 118
```

Likely tools:

- `proxmox_vm_agent_exec`
- `proxmox_vm_agent_file_read`
- `proxmox_vm_agent_get_network_interfaces`

## When to use the raw tools

Use the raw tools when the official Proxmox API supports something that does not yet have a dedicated wrapper in this package.

### Generic API call example

```json
{
  "method": "GET",
  "path": "/cluster/resources",
  "params": "{\"type\":\"vm\"}"
}
```

Tool:

- `proxmox_api_call`

### Generic upload example

Upload a local file to an official upload endpoint:

```json
{
  "path": "/nodes/pve1/storage/local/upload",
  "file_path": "./ubuntu.iso",
  "fields": "{\"content\":\"iso\"}"
}
```

Tool:

- `proxmox_api_upload_file`

## `/nodes/{node}/execute` example

This endpoint is **not shell execution**. It batches node-relative Proxmox API requests.

Example command batch:

```json
[
  { "method": "GET", "path": "version" },
  { "method": "GET", "path": "status" },
  { "method": "GET", "path": "tasks", "args": { "limit": 3 } }
]
```

Tool:

- `proxmox_node_execute`

Legacy compatibility:

- `body` is still accepted as an alias for `args`
- `args` is the preferred form because it matches the official API schema more closely
