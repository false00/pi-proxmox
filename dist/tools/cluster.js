import { Type } from "@sinclair/typebox";
import { throwIfAborted, emitProgress, safeExecute } from "../tool-runtime.js";

export function clusterStatus(client) {
  return {
    name: "proxmox_cluster_status",
    label: "Get Cluster Status",
    description: "Gets the overall cluster status, including quorum state, node membership, and connectivity.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, "Fetching cluster status...");
      return await client.get("/cluster/status");
    }),
  };
}

export function clusterResources(client) {
  return {
    name: "proxmox_cluster_resources",
    label: "List Cluster Resources",
    description: "Gets an aggregated view of all cluster resources: VMs, containers, nodes, and storage.",
    parameters: Type.Object({ type: Type.Optional(Type.String({ description: "Filter by type: vm, container, node, storage, pool" })) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, "Fetching cluster resources...");
      const query = params.type ? { type: params.type } : undefined;
      const resources = await client.get("/cluster/resources", query);
      const hasVms = resources.some(r => r.type === "qemu" || r.type === "lxc");
      if (!hasVms && resources.length > 0) {
        const perms = await client._probePermissions();
        if (!perms.canListVMs) {
          const notes = ["⚠ No VMs or containers visible — your API token lacks permissions. In the Proxmox Web UI, go to Datacenter > Permissions > API Tokens and uncheck \"Privilege Separation\" for your token."];
          return { _data: resources, _notes: notes };
        }
      }
      return resources;
    }),
  };
}

export function clusterNextId(client) {
  return {
    name: "proxmox_cluster_next_id",
    label: "Get Next VM ID",
    description: "Returns the next available VM/container ID in the cluster. If a vmid is provided, checks if that ID is available.",
    parameters: Type.Object({ vmid: Type.Optional(Type.Integer({ description: "Check if a specific ID is available (optional)" })) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const query = params.vmid ? { vmid: params.vmid } : undefined;
      return await client.get("/cluster/nextid", query);
    }),
  };
}

export function clusterVersion(client) {
  return {
    name: "proxmox_cluster_version",
    label: "Get Cluster Version",
    description: "Returns the Proxmox VE version, release, and repository ID for the cluster.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get("/version");
    }),
  };
}

export function clusterLog(client) {
  return {
    name: "proxmox_cluster_log",
    label: "Get Cluster Log",
    description: "Gets the cluster log with optional filtering.",
    parameters: Type.Object({ limit: Type.Optional(Type.Integer({ description: "Max log entries (default: 50)" })), since: Type.Optional(Type.String({ description: "Show entries since timestamp" })) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const query = {};
      if (params.limit) query.limit = params.limit;
      if (params.since) query.since = params.since;
      return await client.get("/cluster/log", query);
    }),
  };
}

export function clusterOptions(client) {
  return {
    name: "proxmox_cluster_options",
    label: "Get Cluster Options",
    description: "Gets the cluster-wide configuration options.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get("/cluster/options");
    }),
  };
}

export function clusterUpdateOptions(client) {
  return {
    name: "proxmox_cluster_update_options",
    label: "Update Cluster Options",
    description: "Updates cluster-wide configuration options.",
    parameters: Type.Object({
      language: Type.Optional(Type.String({ description: "Default language (e.g., 'en')" })),
      keyboard: Type.Optional(Type.String({ description: "Keyboard layout (e.g., 'en-us')" })),
      console: Type.Optional(Type.String({ description: "Console viewer (e.g., 'applet', 'vv', 'html5')" })),
      email: Type.Optional(Type.String({ description: "Cluster notification email address" })),
      mac_prefix: Type.Optional(Type.String({ description: "MAC address prefix" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, "Updating cluster options...");
      return await client.put("/cluster/options", params);
    }),
  };
}

export function clusterConfig(client) {
  return {
    name: "proxmox_cluster_config",
    label: "Get Cluster Config",
    description: "Gets the cluster join configuration.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get("/cluster/config");
    }),
  };
}

export function checkPermissions(client) {
  return {
    name: "proxmox_check_permissions",
    label: "Check Token Permissions",
    description: "Probes the API token's permissions — tests which Proxmox resources (VMs, containers, storage, etc.) the current token can access. Useful for diagnosing empty listings.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, "Probing token permissions...");
      const tests = [];
      const probe = async (label, fn) => { try { await fn(); tests.push({ test: label, result: "ok" }); } catch (e) { tests.push({ test: label, result: "denied", detail: e.message }); } };
      await probe("list nodes", () => client.get("/nodes"));
      const nodes = await client.get("/nodes");
      if (nodes?.length > 0) {
        const n = nodes[0].node;
        await probe(`list VMs on ${n}`, () => client.get(`/nodes/${n}/qemu`));
        await probe(`list containers on ${n}`, () => client.get(`/nodes/${n}/lxc`));
        await probe(`node status for ${n}`, () => client.get(`/nodes/${n}/status`));
        await probe(`node services for ${n}`, () => client.get(`/nodes/${n}/services`));
      }
      await probe("cluster resources", () => client.get("/cluster/resources"));
      await probe("cluster status", () => client.get("/cluster/status"));
      await probe("list storage", () => client.get("/storage"));
      await probe("list backups", () => client.get("/cluster/backup"));
      const denied = tests.filter(t => t.result === "denied");
      const edges = denied.map(t => `⚠ "${t.test}" denied — ${t.detail}. Fix: In Proxmox Web UI, go to Datacenter > Permissions > API Tokens and uncheck "Privilege Separation" for your token.`);
      return { _data: { permissions: tests, summary: tests.filter(t => t.result === "ok").length + "/" + tests.length + " probes passed" }, _notes: edges };
    }),
  };
}
