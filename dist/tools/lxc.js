import { Type } from "@sinclair/typebox";
import { throwIfAborted, emitProgress, safeExecute } from "../tool-runtime.js";

export function lxcList(client) {
  return {
    name: "proxmox_lxc_list",
    label: "List LXC Containers",
    description: "Lists all LXC containers on a specific node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Fetching containers on node ${params.node}...`);
      const containers = await client.get(`/nodes/${params.node}/lxc`);
      const result = containers.map(c => ({
        vmid: c.vmid, name: c.name || "", status: c.status,
        cpu: c.cpu ?? 0, mem: c.mem ?? 0, disk: c.disk ?? 0, uptime: c.uptime ?? 0,
      }));
      if (result.length === 0) {
        const perms = await client._probePermissions();
        const notes = [];
        if (perms.canListLXCs === false) {
          notes.push("⚠ No containers found — your API token lacks permissions. Fix: In the Proxmox Web UI at Datacenter > Permissions > API Tokens, ensure \"Privilege Separation\" is UNCHECKED for your token. Or recreate via CLI: `pveum user token add root@pam TOKENNAME --privsep=0`");
        }
        if (notes.length > 0) return { _data: result, _notes: notes };
      }
      return result;
    }),
  };
}

export function lxcStatus(client) {
  return {
    name: "proxmox_lxc_status",
    label: "Get Container Status",
    description: "Gets real-time status and resource usage for a specific LXC container.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const status = await client.get(`/nodes/${params.node}/lxc/${params.vmid}/status/current`);
      const config = await client.get(`/nodes/${params.node}/lxc/${params.vmid}/config`);
      return { status, config };
    }),
  };
}

export function lxcStart(client) {
  return {
    name: "proxmox_lxc_start", label: "Start Container",
    description: "Starts a stopped LXC container.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Starting container ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/lxc/${params.vmid}/status/start`);
    }),
  };
}

export function lxcStop(client) {
  return {
    name: "proxmox_lxc_stop", label: "Stop Container",
    description: "Force-stops a running LXC container.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Stopping container ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/lxc/${params.vmid}/status/stop`);
    }),
  };
}

export function lxcShutdown(client) {
  return {
    name: "proxmox_lxc_shutdown", label: "Shutdown Container",
    description: "Gracefully shuts down an LXC container.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Shutting down container ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/lxc/${params.vmid}/status/shutdown`);
    }),
  };
}

export function lxcCreate(client) {
  return {
    name: "proxmox_lxc_create", label: "Create Container",
    description: "Creates a new LXC Linux container on a Proxmox node.",
    parameters: Type.Object({
      node: Type.String({ description: "Target Proxmox node" }),
      vmid: Type.Integer({ description: "Unique container ID" }),
      hostname: Type.String({ description: "Container hostname" }),
      ostemplate: Type.String({ description: "Template path, e.g. 'local:vztmpl/debian-12-standard_12.0-1_amd64.tar.gz'" }),
      storage: Type.Optional(Type.String({ description: "Storage for rootfs (default: local-lvm)" })),
      rootfs: Type.Optional(Type.String({ description: "Rootfs size, e.g. 'local-lvm:8' for 8GB" })),
      memory: Type.Optional(Type.Integer({ description: "RAM in MB (default: 512)" })),
      swap: Type.Optional(Type.Integer({ description: "Swap in MB (default: 512)" })),
      cores: Type.Optional(Type.Integer({ description: "CPU cores (default: 1)" })),
      net0: Type.Optional(Type.String({ description: "Network, e.g. 'name=eth0,bridge=vmbr0,ip=dhcp'" })),
      password: Type.Optional(Type.String({ description: "Root password" })),
      ssh_public_keys: Type.Optional(Type.String({ description: "SSH public keys" })),
      unprivileged: Type.Optional(Type.Integer({ description: "Unprivileged container: 1 or 0" })),
      start: Type.Optional(Type.Integer({ description: "Start after creation: 1 or 0" })),
      features: Type.Optional(Type.String({ description: "Features: 'nesting=1', 'fuse=1', etc." })),
      tags: Type.Optional(Type.String({ description: "Comma-separated tags" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Creating container ${params.vmid} (${params.hostname})...`);
      const body = { ...params };
      delete body.node;
      if (body.ssh_public_keys) body.ssh_public_keys = encodeURIComponent(body.ssh_public_keys);
      for (const key of Object.keys(body)) {
        if (body[key] === "" || body[key] === undefined || body[key] === null) delete body[key];
      }
      return await client.post(`/nodes/${params.node}/lxc`, body);
    }),
  };
}

export function lxcDelete(client) {
  return {
    name: "proxmox_lxc_delete", label: "Delete Container",
    description: "Deletes an LXC container. Optionally purges from backup jobs.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID to delete" }), purge: Type.Optional(Type.Integer({ description: "Also remove from backup jobs: 1 or 0" })) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting container ${params.vmid}...`);
      return await client.delete(`/nodes/${params.node}/lxc/${params.vmid}`, { purge: params.purge });
    }),
  };
}

export function lxcSnapshot(client) {
  return {
    name: "proxmox_lxc_snapshot", label: "Snapshot Container",
    description: "Creates a snapshot of an LXC container.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }), snapname: Type.String({ description: "Snapshot name" }), description: Type.Optional(Type.String({ description: "Description" })) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Creating snapshot '${params.snapname}' for container ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/lxc/${params.vmid}/snapshot`, params);
    }),
  };
}

export function lxcReset(client) {
  return {
    name: "proxmox_lxc_reset", label: "Reset Container",
    description: "Resets a running LXC container (hard reset).",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Resetting container ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/lxc/${params.vmid}/status/reset`);
    }),
  };
}

export function lxcResume(client) {
  return {
    name: "proxmox_lxc_resume", label: "Resume Container",
    description: "Resumes a suspended LXC container.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Resuming container ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/lxc/${params.vmid}/status/resume`);
    }),
  };
}

export function lxcSuspend(client) {
  return {
    name: "proxmox_lxc_suspend", label: "Suspend Container",
    description: "Suspends a running LXC container.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Suspending container ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/lxc/${params.vmid}/status/suspend`);
    }),
  };
}

export function lxcReboot(client) {
  return {
    name: "proxmox_lxc_reboot", label: "Reboot Container",
    description: "Reboots a running LXC container.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Rebooting container ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/lxc/${params.vmid}/status/reboot`);
    }),
  };
}

export function lxcUpdateConfig(client) {
  return {
    name: "proxmox_lxc_update_config", label: "Update Container Config",
    description: "Updates the configuration of an LXC container. Supports all container config parameters.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }),
      hostname: Type.Optional(Type.String({ description: "Container hostname" })),
      memory: Type.Optional(Type.Integer({ description: "RAM in MB" })),
      swap: Type.Optional(Type.Integer({ description: "Swap in MB" })),
      cores: Type.Optional(Type.Integer({ description: "CPU cores" })),
      cpulimit: Type.Optional(Type.Number({ description: "CPU usage limit (0-1)" })),
      cpuunits: Type.Optional(Type.Integer({ description: "CPU weight" })),
      net0: Type.Optional(Type.String({ description: "Network config" })),
      nameserver: Type.Optional(Type.String({ description: "DNS server" })),
      searchdomain: Type.Optional(Type.String({ description: "DNS search domain" })),
      onboot: Type.Optional(Type.Integer({ description: "Start on node boot: 1 or 0" })),
      protection: Type.Optional(Type.Integer({ description: "Protection: 1 or 0" })),
      features: Type.Optional(Type.String({ description: "Features: 'nesting=1', 'fuse=1', etc." })),
      tags: Type.Optional(Type.String({ description: "Comma-separated tags" })),
      description: Type.Optional(Type.String({ description: "Description" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Updating config for container ${params.vmid}...`);
      return await client.put(`/nodes/${params.node}/lxc/${params.vmid}/config`, params);
    }),
  };
}

export function lxcTemplate(client) {
  return {
    name: "proxmox_lxc_template", label: "Convert Container to Template",
    description: "Converts a stopped LXC container into a template.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID (must be stopped)" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Converting container ${params.vmid} to template...`);
      return await client.post(`/nodes/${params.node}/lxc/${params.vmid}/template`);
    }),
  };
}

export function lxcResize(client) {
  return {
    name: "proxmox_lxc_resize", label: "Resize Container Mountpoint",
    description: "Resizes a mount point on an LXC container.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }), mp: Type.String({ description: "Mount point ID (e.g., 'mp0', 'rootfs')" }), size: Type.String({ description: "New size (e.g., '+5G', '16G')" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Resizing ${params.mp} for container ${params.vmid}...`);
      return await client.put(`/nodes/${params.node}/lxc/${params.vmid}/resize`, params);
    }),
  };
}

export function lxcTemplateList(client) {
  return {
    name: "proxmox_lxc_template_list", label: "List LXC Templates",
    description: "Lists all cached LXC templates available on a node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/lxc/templates`);
    }),
  };
}

export function lxcPendingChanges(client) {
  return {
    name: "proxmox_lxc_pending_changes", label: "Get Container Pending Changes",
    description: "Lists pending configuration changes for an LXC container (applied on next restart).",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/lxc/${params.vmid}/pending`);
    }),
  };
}

export function lxcSnapshotList(client) {
  return {
    name: "proxmox_lxc_snapshot_list", label: "List Container Snapshots",
    description: "Lists all snapshots for an LXC container.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/lxc/${params.vmid}/snapshot`);
    }),
  };
}

export function lxcSnapshotRollback(client) {
  return {
    name: "proxmox_lxc_snapshot_rollback", label: "Rollback Container Snapshot",
    description: "Rolls back an LXC container to a specified snapshot.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }), snapname: Type.String({ description: "Snapshot name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Rolling back container ${params.vmid} to '${params.snapname}'...`);
      return await client.post(`/nodes/${params.node}/lxc/${params.vmid}/snapshot/${params.snapname}/rollback`);
    }),
  };
}

export function lxcSnapshotDelete(client) {
  return {
    name: "proxmox_lxc_snapshot_delete", label: "Delete Container Snapshot",
    description: "Deletes a snapshot from an LXC container.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "Container ID" }), snapname: Type.String({ description: "Snapshot name to delete" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting snapshot '${params.snapname}' from container ${params.vmid}...`);
      return await client.delete(`/nodes/${params.node}/lxc/${params.vmid}/snapshot/${params.snapname}`);
    }),
  };
}

export function lxcMigrate(client) {
  return {
    name: "proxmox_lxc_migrate", label: "Migrate Container",
    description: "Migrates an LXC container to another node in the cluster.",
    parameters: Type.Object({ node: Type.String({ description: "Source Proxmox node" }), vmid: Type.Integer({ description: "Container ID" }), target: Type.String({ description: "Target node name" }), online: Type.Optional(Type.Integer({ description: "Live migration: 1 or 0" })), restart: Type.Optional(Type.Integer({ description: "Restart after migration: 1 or 0" })), force: Type.Optional(Type.Integer({ description: "Force migration: 1 or 0" })) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Migrating container ${params.vmid} to ${params.target}...`);
      return await client.post(`/nodes/${params.node}/lxc/${params.vmid}/migrate`, params);
    }),
  };
}

