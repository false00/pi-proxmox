import { Type } from "@sinclair/typebox";
import { throwIfAborted, emitProgress, safeExecute } from "../tool-runtime.js";

export function vmList(client) {
  return {
    name: "proxmox_vm_list",
    label: "List Virtual Machines",
    description: "Lists all QEMU/KVM virtual machines on a specific node in the Proxmox cluster.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Fetching VMs on node ${params.node}...`);
      const vms = await client.get(`/nodes/${params.node}/qemu`);
      const result = vms.map(v => ({
        vmid: v.vmid,
        name: v.name || "",
        status: v.status,
        cpu: v.cpu ?? 0,
        mem: v.mem ?? 0,
        disk: v.disk ?? 0,
        uptime: v.uptime ?? 0,
      }));
      if (result.length === 0) {
        const perms = await client._probePermissions();
        const notes = [];
        if (perms.canListVMs === false) {
          notes.push("⚠ No VMs found — your API token appears to lack VM permissions. Fix: In the Proxmox Web UI, go to Datacenter > Permissions > API Tokens, select your token, and make sure \"Privilege Separation\" is UNCHECKED. Or recreate via CLI: `pveum user token add root@pam TOKENNAME --privsep=0`");
        }
        if (notes.length > 0) return { _data: result, _notes: notes };
      }
      return result;
    }),
  };
}

export function vmStatus(client) {
  return {
    name: "proxmox_vm_status",
    label: "Get VM Status",
    description: "Gets detailed real-time status and resource usage for a specific virtual machine.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID (e.g., 100)" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Fetching status for VM ${params.vmid}...`);
      const status = await client.get(`/nodes/${params.node}/qemu/${params.vmid}/status/current`);
      const config = await client.get(`/nodes/${params.node}/qemu/${params.vmid}/config`);
      return { status, config };
    }),
  };
}

export function vmConfig(client) {
  return {
    name: "proxmox_vm_config",
    label: "Get VM Configuration",
    description: "Gets the full configuration of a virtual machine including CPU, memory, network, disks, and BIOS settings.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/qemu/${params.vmid}/config`);
    }),
  };
}

export function vmStart(client) {
  return {
    name: "proxmox_vm_start",
    label: "Start Virtual Machine",
    description: "Starts a stopped virtual machine.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Starting VM ${params.vmid} on ${params.node}...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/status/start`);
    }),
  };
}

export function vmStop(client) {
  return {
    name: "proxmox_vm_stop",
    label: "Stop Virtual Machine",
    description: "Force-stops a running virtual machine (hard power-off). Use proxmox_vm_shutdown for graceful shutdown.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Stopping VM ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/status/stop`);
    }),
  };
}

export function vmShutdown(client) {
  return {
    name: "proxmox_vm_shutdown",
    label: "Shutdown Virtual Machine",
    description: "Gracefully shuts down a running virtual machine via ACPI signal.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
      timeout: Type.Optional(Type.Integer({ description: "Shutdown timeout in seconds (default: 30)" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Shutting down VM ${params.vmid}...`);
      const body = params.timeout ? { timeout: params.timeout } : undefined;
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/status/shutdown`, body);
    }),
  };
}

export function vmCreate(client) {
  return {
    name: "proxmox_vm_create",
    label: "Create Virtual Machine",
    description: "Creates a new QEMU/KVM virtual machine on a Proxmox node.",
    parameters: Type.Object({
      node: Type.String({ description: "Target Proxmox node" }),
      vmid: Type.Integer({ description: "Unique VM ID" }),
      name: Type.String({ description: "VM hostname" }),
      memory: Type.Integer({ description: "RAM in MB" }),
      cores: Type.Optional(Type.Integer({ description: "CPU cores (default: 1)" })),
      sockets: Type.Optional(Type.Integer({ description: "CPU sockets (default: 1)" })),
      ostype: Type.Optional(Type.String({ description: "OS type: l24, l26, win10, win11, etc." })),
      net0: Type.Optional(Type.String({ description: "Network config, e.g. 'virtio,bridge=vmbr0'" })),
      ide2: Type.Optional(Type.String({ description: "CDROM, e.g. 'local:iso/ubuntu.iso,media=cdrom'" })),
      boot: Type.Optional(Type.String({ description: "Boot order, e.g. 'order=ide2;scsi0'" })),
      scsihw: Type.Optional(Type.String({ description: "SCSI controller: virtio-scsi-single, lsi, etc." })),
      agent: Type.Optional(Type.Integer({ description: "Enable QEMU agent: 1 or 0" })),
      pool: Type.Optional(Type.String({ description: "Resource pool" })),
      start: Type.Optional(Type.Integer({ description: "Start VM after creation: 1 or 0" })),
      tags: Type.Optional(Type.String({ description: "Comma-separated tags" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Creating VM ${params.vmid} (${params.name}) on ${params.node}...`);
      return await client.post(`/nodes/${params.node}/qemu`, params);
    }),
  };
}

export function vmDelete(client) {
  return {
    name: "proxmox_vm_delete",
    label: "Delete Virtual Machine",
    description: "Deletes a virtual machine. Optionally purges from backup jobs.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID to delete" }),
      purge: Type.Optional(Type.Integer({ description: "Also remove from backup jobs: 1 or 0" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting VM ${params.vmid}...`);
      return await client.delete(`/nodes/${params.node}/qemu/${params.vmid}`, { purge: params.purge });
    }),
  };
}

export function vmSnapshot(client) {
  return {
    name: "proxmox_vm_snapshot",
    label: "Snapshot Virtual Machine",
    description: "Creates a snapshot of a virtual machine, optionally including RAM state.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
      snapname: Type.String({ description: "Snapshot name (e.g., 'pre-update')" }),
      description: Type.Optional(Type.String({ description: "Snapshot description" })),
      vmstate: Type.Optional(Type.Integer({ description: "Include running memory state: 1 or 0" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Creating snapshot '${params.snapname}' for VM ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/snapshot`, params);
    }),
  };
}

export function vmClone(client) {
  return {
    name: "proxmox_vm_clone",
    label: "Clone Virtual Machine",
    description: "Clones a VM or template. Supports full clone and linked clone.",
    parameters: Type.Object({
      node: Type.String({ description: "Source Proxmox node" }),
      vmid: Type.Integer({ description: "Source VM ID" }),
      newid: Type.Integer({ description: "New VM ID for the clone" }),
      name: Type.Optional(Type.String({ description: "Name for the cloned VM" })),
      target: Type.Optional(Type.String({ description: "Target node (defaults to source)" })),
      full: Type.Optional(Type.Integer({ description: "Full clone vs linked clone: 1 or 0" })),
      format: Type.Optional(Type.String({ description: "Disk format: raw, qcow2, vmdk" })),
      pool: Type.Optional(Type.String({ description: "Resource pool" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Cloning VM ${params.vmid} -> ${params.newid}...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/clone`, params);
    }),
  };
}

export function vmMigrate(client) {
  return {
    name: "proxmox_vm_migrate",
    label: "Migrate Virtual Machine",
    description: "Migrates a virtual machine to another node in the cluster. Supports online (live) migration.",
    parameters: Type.Object({
      node: Type.String({ description: "Source Proxmox node" }),
      vmid: Type.Integer({ description: "VM ID to migrate" }),
      target: Type.String({ description: "Target node name" }),
      online: Type.Optional(Type.Integer({ description: "Live migration: 1 or 0 (default: 1)" })),
      force: Type.Optional(Type.Integer({ description: "Force migration: 1 or 0" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Migrating VM ${params.vmid} from ${params.node} to ${params.target}...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/migrate`, params);
    }),
  };
}

export function vmResizeDisk(client) {
  return {
    name: "proxmox_vm_resize_disk",
    label: "Resize VM Disk",
    description: "Resizes a virtual machine disk. Size is specified as an increment (e.g., '+10G').",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
      disk: Type.String({ description: "Disk identifier (e.g., 'scsi0', 'virtio0')" }),
      size: Type.String({ description: "Size increment (e.g., '+10G')" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Resizing ${params.disk} by ${params.size} for VM ${params.vmid}...`);
      return await client.put(`/nodes/${params.node}/qemu/${params.vmid}/resize`, params);
    }),
  };
}

export function vmReset(client) {
  return {
    name: "proxmox_vm_reset",
    label: "Reset Virtual Machine",
    description: "Resets a running virtual machine (hard reset).",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "VM ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Resetting VM ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/status/reset`);
    }),
  };
}

export function vmResume(client) {
  return {
    name: "proxmox_vm_resume",
    label: "Resume Virtual Machine",
    description: "Resumes a suspended virtual machine.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "VM ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Resuming VM ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/status/resume`);
    }),
  };
}

export function vmSuspend(client) {
  return {
    name: "proxmox_vm_suspend",
    label: "Suspend Virtual Machine",
    description: "Suspends a running virtual machine (saves state to disk).",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "VM ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Suspending VM ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/status/suspend`);
    }),
  };
}

export function vmReboot(client) {
  return {
    name: "proxmox_vm_reboot",
    label: "Reboot Virtual Machine",
    description: "Reboots a running virtual machine.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "VM ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Rebooting VM ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/status/reboot`);
    }),
  };
}

export function vmUpdateConfig(client) {
  return {
    name: "proxmox_vm_update_config",
    label: "Update VM Configuration",
    description: "Updates the configuration of a virtual machine. Supports all VM config parameters (CPU, memory, network, disks, etc.).",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
      memory: Type.Optional(Type.Integer({ description: "RAM in MB" })),
      cores: Type.Optional(Type.Integer({ description: "CPU cores" })),
      sockets: Type.Optional(Type.Integer({ description: "CPU sockets" })),
      ostype: Type.Optional(Type.String({ description: "OS type: l24, l26, win10, win11, etc." })),
      net0: Type.Optional(Type.String({ description: "Network config" })),
      ide2: Type.Optional(Type.String({ description: "CDROM config" })),
      boot: Type.Optional(Type.String({ description: "Boot order" })),
      scsihw: Type.Optional(Type.String({ description: "SCSI controller" })),
      agent: Type.Optional(Type.Integer({ description: "Enable QEMU agent: 1 or 0" })),
      pool: Type.Optional(Type.String({ description: "Resource pool" })),
      tags: Type.Optional(Type.String({ description: "Comma-separated tags" })),
      onboot: Type.Optional(Type.Integer({ description: "Start on node boot: 1 or 0" })),
      protection: Type.Optional(Type.Integer({ description: "Enable protection: 1 or 0" })),
      template: Type.Optional(Type.Integer({ description: "Mark as template: 1 or 0" })),
      description: Type.Optional(Type.String({ description: "VM description" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Updating config for VM ${params.vmid}...`);
      return await client.put(`/nodes/${params.node}/qemu/${params.vmid}/config`, params);
    }),
  };
}

export function vmTemplate(client) {
  return {
    name: "proxmox_vm_template",
    label: "Convert VM to Template",
    description: "Converts a stopped virtual machine into a template. The VM must be stopped before conversion.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "VM ID (must be stopped)" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Converting VM ${params.vmid} to template...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/template`);
    }),
  };
}

export function vmMoveDisk(client) {
  return {
    name: "proxmox_vm_move_disk",
    label: "Move VM Disk",
    description: "Moves a disk to a different storage backend.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
      disk: Type.String({ description: "Disk identifier (e.g., 'scsi0', 'virtio0')" }),
      storage: Type.String({ description: "Target storage identifier" }),
      format: Type.Optional(Type.String({ description: "Target format: raw, qcow2, vmdk" })),
      delete: Type.Optional(Type.Integer({ description: "Delete source after move: 1 or 0" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Moving disk ${params.disk} for VM ${params.vmid} to ${params.storage}...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/move_disk`, params);
    }),
  };
}

export function vmPendingChanges(client) {
  return {
    name: "proxmox_vm_pending_changes",
    label: "Get VM Pending Changes",
    description: "Lists pending configuration changes for a virtual machine (changes applied on next reboot).",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "VM ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/qemu/${params.vmid}/pending`);
    }),
  };
}

// --- VM Snapshots ---

export function vmSnapshotList(client) {
  return {
    name: "proxmox_vm_snapshot_list",
    label: "List VM Snapshots",
    description: "Lists all snapshots for a virtual machine.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "VM ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/qemu/${params.vmid}/snapshot`);
    }),
  };
}

export function vmSnapshotRollback(client) {
  return {
    name: "proxmox_vm_snapshot_rollback",
    label: "Rollback VM Snapshot",
    description: "Rolls back a virtual machine to a specified snapshot.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "VM ID" }), snapname: Type.String({ description: "Snapshot name to rollback to" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Rolling back VM ${params.vmid} to snapshot '${params.snapname}'...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/snapshot/${params.snapname}/rollback`);
    }),
  };
}

export function vmSnapshotDelete(client) {
  return {
    name: "proxmox_vm_snapshot_delete",
    label: "Delete VM Snapshot",
    description: "Deletes a snapshot from a virtual machine.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), vmid: Type.Integer({ description: "VM ID" }), snapname: Type.String({ description: "Snapshot name to delete" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting snapshot '${params.snapname}' from VM ${params.vmid}...`);
      return await client.delete(`/nodes/${params.node}/qemu/${params.vmid}/snapshot/${params.snapname}`);
    }),
  };
}

// --- QEMU Guest Agent Tools ---

export function vmAgentExec(client) {
  return {
    name: "proxmox_vm_agent_exec",
    label: "VM Agent Execute Command",
    description: "Executes a command inside a VM via the QEMU Guest Agent. Requires agent: 1 in VM config and qemu-guest-agent installed. Returns a PID; use proxmox_vm_agent_exec_status to get output.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
      command: Type.String({ description: "Command to execute (e.g., 'uptime', 'cat /etc/hostname')" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Executing command in VM ${params.vmid} via guest agent...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/agent/exec`, { command: params.command });
    }),
  };
}

export function vmAgentExecStatus(client) {
  return {
    name: "proxmox_vm_agent_exec_status",
    label: "VM Agent Exec Status",
    description: "Checks the status and output of a previously submitted guest agent command by PID.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
      pid: Type.Integer({ description: "PID returned by proxmox_vm_agent_exec" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Checking exec status for PID ${params.pid} in VM ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/agent/exec-status`, { pid: params.pid });
    }),
  };
}

export function vmAgentPing(client) {
  return {
    name: "proxmox_vm_agent_ping",
    label: "VM Agent Ping",
    description: "Pings the QEMU Guest Agent inside a VM to verify it is running and responsive.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Pinging guest agent in VM ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/agent/ping`);
    }),
  };
}

export function vmAgentInfo(client) {
  return {
    name: "proxmox_vm_agent_info",
    label: "VM Agent Info",
    description: "Returns detailed information about the QEMU Guest Agent version and supported commands.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Fetching guest agent info for VM ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/agent/info`);
    }),
  };
}

export function vmAgentGetHostName(client) {
  return {
    name: "proxmox_vm_agent_get_host_name",
    label: "VM Agent Get Hostname",
    description: "Gets the hostname of a VM via the QEMU Guest Agent.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/agent/get-host-name`);
    }),
  };
}

export function vmAgentGetNetworkInterfaces(client) {
  return {
    name: "proxmox_vm_agent_get_network_interfaces",
    label: "VM Agent Get Network Interfaces",
    description: "Gets network interface information from a VM via the QEMU Guest Agent.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/agent/get-network-interfaces`);
    }),
  };
}

export function vmAgentGetOSInfo(client) {
  return {
    name: "proxmox_vm_agent_get_osinfo",
    label: "VM Agent Get OS Info",
    description: "Gets operating system information from a VM via the QEMU Guest Agent.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/agent/get-osinfo`);
    }),
  };
}

export function vmAgentGetTime(client) {
  return {
    name: "proxmox_vm_agent_get_time",
    label: "VM Agent Get Time",
    description: "Gets the system time from a VM via the QEMU Guest Agent.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/agent/get-time`);
    }),
  };
}

export function vmAgentGetUsers(client) {
  return {
    name: "proxmox_vm_agent_get_users",
    label: "VM Agent Get Users",
    description: "Lists currently logged-in users in a VM via the QEMU Guest Agent.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/agent/get-users`);
    }),
  };
}

export function vmAgentGetVcpus(client) {
  return {
    name: "proxmox_vm_agent_get_vcpus",
    label: "VM Agent Get VCPUs",
    description: "Gets VCPU information (online/offline status) from a VM via the QEMU Guest Agent.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/agent/get-vcpus`);
    }),
  };
}

export function vmAgentFileRead(client) {
  return {
    name: "proxmox_vm_agent_file_read",
    label: "VM Agent File Read",
    description: "Reads a file from a VM via the QEMU Guest Agent. Returns content as base64-encoded data.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
      file: Type.String({ description: "Absolute path to the file (e.g., '/etc/hostname')" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Reading ${params.file} from VM ${params.vmid} via guest agent...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/agent/file-read`, { file: params.file });
    }),
  };
}

export function vmAgentFileWrite(client) {
  return {
    name: "proxmox_vm_agent_file_write",
    label: "VM Agent File Write",
    description: "Writes base64-encoded content to a file in a VM via the QEMU Guest Agent.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
      file: Type.String({ description: "Absolute path to the file (e.g., '/etc/test.conf')" }),
      content: Type.String({ description: "Base64-encoded file content" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Writing to ${params.file} in VM ${params.vmid} via guest agent...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/agent/file-write`, { file: params.file, content: params.content });
    }),
  };
}

export function vmAgentSetUserPassword(client) {
  return {
    name: "proxmox_vm_agent_set_user_password",
    label: "VM Agent Set User Password",
    description: "Sets a user's password inside a VM via the QEMU Guest Agent. Requires the new password in plain text.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      vmid: Type.Integer({ description: "VM ID" }),
      username: Type.String({ description: "Username (e.g., 'root')" }),
      password: Type.String({ description: "New password in plain text" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Setting password for user '${params.username}' in VM ${params.vmid}...`);
      return await client.post(`/nodes/${params.node}/qemu/${params.vmid}/agent/set-user-password`, { username: params.username, password: params.password });
    }),
  };
}
