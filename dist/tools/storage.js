import { Type } from "@sinclair/typebox";
import { throwIfAborted, emitProgress, safeExecute } from "../tool-runtime.js";

/**
 * Categorizes network fetch errors for consistent error handling.
 */
function categorizeFetchError(err, url) {
  const message = err?.message || String(err);
  if (message.includes("timed out") || message.includes("aborted")) {
    return { error: `Download timed out: ${url}`, category: "timeout", guidance: "The download source is slow or unresponsive. Try a different URL or increase timeout.", retryable: true };
  }
  if (message.includes("fetch") || message.includes("connect") || message.includes("ENOTFOUND") || message.includes("ECONN") || message.includes("Failed to fetch")) {
    return { error: `Network error downloading: ${url}`, category: "network", guidance: "Cannot reach the download URL. Verify the URL is accessible and the host has network connectivity.", retryable: true };
  }
  if (message.includes("Download failed:")) {
    // Extract HTTP status from message like "Download failed: 404 Not Found"
    const statusMatch = message.match(/Download failed: (\d+)/);
    const status = statusMatch ? parseInt(statusMatch[1]) : 0;
    if (status === 404) {
      return { error: message, category: "not_found", guidance: "The download URL returned 404. Check that the file exists at the URL.", retryable: false };
    }
    if (status >= 500) {
      return { error: message, category: "server_error", guidance: "The download source server returned an error. Try again later.", retryable: true };
    }
    return { error: message, category: "validation", guidance: "The download URL returned an error. Check the URL and try again.", retryable: false };
  }
  return { error: `Download failed: ${message}`, category: "unknown", guidance: "An unexpected error occurred during download.", retryable: false };
}

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

export function storageUpload(client) {
  return {
    name: "proxmox_storage_upload",
    label: "Upload File to Storage",
    description: "Downloads a file from a URL and uploads it to a Proxmox storage backend as an ISO, container template, or other content type. Supports ISO images, VZ templates, snippets, and more.",
    parameters: Type.Object({
      node: Type.String({ description: "Target Proxmox node" }),
      storage: Type.String({ description: "Storage identifier (e.g., 'local', 'local-lvm')" }),
      content: Type.Optional(Type.String({ description: "Content type: iso, vztmpl, snippets, backup (default: iso)" })),
      url: Type.String({ description: "URL to download the file from" }),
      filename: Type.Optional(Type.String({ description: "Destination filename (derived from URL if omitted)" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const content = params.content || "iso";
      const filename = params.filename || params.url.split("/").pop().split("?")[0];

      emitProgress(onUpdate, `Downloading ${params.url}...`);
      throwIfAborted(signal);

      let downloadResp;
      try {
        downloadResp = await fetch(params.url, {
          signal: signal ? signal : undefined,
          dispatcher: client._dispatcher,
        });
      } catch (err) {
        const categorized = categorizeFetchError(err, params.url);
        throw Object.assign(new Error(categorized.error), {
          name: "ProxmoxError",
          status: 0,
          category: categorized.category,
          guidance: categorized.guidance,
          retryable: categorized.retryable,
        });
      }

      if (!downloadResp.ok) {
        const categorized = categorizeFetchError(
          new Error(`Download failed: ${downloadResp.status} ${downloadResp.statusText}`),
          params.url
        );
        throw Object.assign(new Error(categorized.error), {
          name: "ProxmoxError",
          status: downloadResp.status,
          category: categorized.category,
          guidance: categorized.guidance,
          retryable: categorized.retryable,
        });
      }

      const buffer = await downloadResp.arrayBuffer();
      const totalBytes = buffer.byteLength;
      emitProgress(onUpdate, `Downloaded ${totalBytes} bytes — uploading to ${params.storage} as ${filename}...`);
      throwIfAborted(signal);

      const formData = new FormData();
      formData.append("content", content);
      formData.append("filename", new Blob([buffer]), filename);

      const result = await client.upload(`/nodes/${params.node}/storage/${params.storage}/upload`, formData);
      emitProgress(onUpdate, `Uploaded ${filename} to ${params.storage}`);
      const output = { filename, content, size: totalBytes };
      if (typeof result === "string") output.task = result;
      else Object.assign(output, result);
      return output;
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
