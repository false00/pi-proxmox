import { Type } from "@sinclair/typebox";
import { throwIfAborted, emitProgress, safeExecute } from "../tool-runtime.js";

export function storageList(client) {
  return {
    name: "proxmox_storage_list",
    label: "List Storage",
    description: "Lists all storage backends configured on a Proxmox node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Fetching storage on ${params.node}...`);
      const storage = await client.get(`/nodes/${params.node}/storage`);
      return storage.map(s => ({
        storage: s.storage, type: s.type, content: s.content || "", active: s.active,
        used: s.used ?? 0, available: s.avail ?? 0, total: s.total ?? 0,
      }));
    }),
  };
}

export function storageContent(client) {
  return {
    name: "proxmox_storage_content",
    label: "List Storage Content",
    description: "Lists the content (ISOs, backups, disk images) stored on a specific storage backend.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      storage: Type.String({ description: "Storage identifier (e.g., 'local', 'local-lvm')" }),
      content: Type.Optional(Type.String({ description: "Filter by type: iso, backup, vztmpl, images, snippets" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const query = params.content ? { content: params.content } : undefined;
      const volumes = await client.get(`/nodes/${params.node}/storage/${params.storage}/content`, query);
      return volumes.map(v => ({
        volid: v.volid, format: v.format || "", size: v.size ?? 0, used: v.used ?? 0, content: v.content || "",
      }));
    }),
  };
}

export function poolList(client) {
  return {
    name: "proxmox_pool_list",
    label: "List Resource Pools",
    description: "Lists all resource pools in the cluster.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get("/pools");
    }),
  };
}

export function poolCreate(client) {
  return {
    name: "proxmox_pool_create",
    label: "Create Resource Pool",
    description: "Creates a new resource pool for grouping VMs, containers, and storage.",
    parameters: Type.Object({ poolid: Type.String({ description: "Pool identifier" }), comment: Type.Optional(Type.String({ description: "Description" })) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Creating pool '${params.poolid}'...`);
      return await client.post("/pools", params);
    }),
  };
}

export function poolDelete(client) {
  return {
    name: "proxmox_pool_delete",
    label: "Delete Resource Pool",
    description: "Deletes a resource pool.",
    parameters: Type.Object({ poolid: Type.String({ description: "Pool identifier to delete" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting pool '${params.poolid}'...`);
      return await client.delete(`/pools/${params.poolid}`);
    }),
  };
}

// --- Storage Backends ---

export function storageCreate(client) {
  return {
    name: "proxmox_storage_create",
    label: "Create Storage Backend",
    description: "Creates a new storage backend configuration.",
    parameters: Type.Object({
      storage: Type.String({ description: "Storage identifier" }),
      type: Type.String({ description: "Storage type: dir, nfs, cifs, lvm, lvmthin, zfs, zfspool, rbd, cephfs, btrfs, pbs, iscsi" }),
      content: Type.Optional(Type.String({ description: "Content types: images, iso, vztmpl, backup, snippets, rootdir (comma-separated)" })),
      nodes: Type.Optional(Type.String({ description: "Comma-separated node names (or 'all')" })),
      path: Type.Optional(Type.String({ description: "Filesystem path (for dir type)" })),
      server: Type.Optional(Type.String({ description: "Server hostname/IP (for nfs, cifs)" })),
      export: Type.Optional(Type.String({ description: "Server export path (for nfs, cifs)" })),
      pool: Type.Optional(Type.String({ description: "Pool name (for rbd)" })),
      datastore: Type.Optional(Type.String({ description: "Datastore name (for pbs)" })),
      disable: Type.Optional(Type.Integer({ description: "Disable storage: 1 or 0" })),
      shared: Type.Optional(Type.Integer({ description: "Mark as shared: 1 or 0" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Creating storage '${params.storage}'...`);
      return await client.post("/storage", params);
    }),
  };
}

export function storageDetail(client) {
  return {
    name: "proxmox_storage_detail",
    label: "Get Storage Details",
    description: "Gets detailed configuration and status for a specific storage backend.",
    parameters: Type.Object({ storage: Type.String({ description: "Storage identifier" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/storage/${params.storage}`);
    }),
  };
}

export function storageDelete(client) {
  return {
    name: "proxmox_storage_delete",
    label: "Delete Storage Backend",
    description: "Deletes a storage backend configuration.",
    parameters: Type.Object({ storage: Type.String({ description: "Storage identifier to delete" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting storage '${params.storage}'...`);
      return await client.delete(`/storage/${params.storage}`);
    }),
  };
}

export function storageScan(client) {
  return {
    name: "proxmox_storage_scan",
    label: "Scan Storage Resources",
    description: "Scans for available storage resources (iSCSI, ZFS, LVM, NFS, Ceph) on a node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), type: Type.Optional(Type.String({ description: "Scan type: iscsi, lvm, nfs, ceph, zfs" })) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const query = params.type ? { type: params.type } : undefined;
      return await client.get(`/nodes/${params.node}/scan`, query);
    }),
  };
}

export function storageRemoveVolume(client) {
  return {
    name: "proxmox_storage_remove_volume",
    label: "Remove Storage Volume",
    description: "Removes a volume from a storage backend.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), storage: Type.String({ description: "Storage identifier" }), volid: Type.String({ description: "Volume identifier (e.g., 'local:iso/ubuntu.iso')" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Removing volume ${params.volid}...`);
      return await client.delete(`/nodes/${params.node}/storage/${params.storage}/content/${params.volid}`);
    }),
  };
}
