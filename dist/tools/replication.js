import { Type } from "@sinclair/typebox";
import { throwIfAborted, emitProgress, safeExecute } from "../tool-runtime.js";

export function replicationList(client) {
  return {
    name: "proxmox_replication_list",
    label: "List Replication Jobs",
    description: "Lists all storage replication jobs for a node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/replication`);
    }),
  };
}

export function replicationCreate(client) {
  return {
    name: "proxmox_replication_create",
    label: "Create Replication Job",
    description: "Creates a storage replication job for a VM/container to a target node.",
    parameters: Type.Object({
      node: Type.String({ description: "Source Proxmox node" }),
      target: Type.String({ description: "Target node name" }),
      vmid: Type.Integer({ description: "VM/CT ID to replicate" }),
      schedule: Type.Optional(Type.String({ description: "Cron schedule (e.g., '*/15 * * * *' for every 15 min)" })),
      rate: Type.Optional(Type.String({ description: "Bandwidth limit (e.g., '100MB')" })),
      enabled: Type.Optional(Type.Integer({ description: "Enable job: 1 or 0" })),
      comment: Type.Optional(Type.String({ description: "Comment" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Creating replication job for VM ${params.vmid} to ${params.target}...`);
      return await client.post(`/nodes/${params.node}/replication`, params);
    }),
  };
}

export function replicationDelete(client) {
  return {
    name: "proxmox_replication_delete",
    label: "Delete Replication Job",
    description: "Deletes a storage replication job.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), id: Type.String({ description: "Replication job ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting replication job ${params.id}...`);
      return await client.delete(`/nodes/${params.node}/replication/${params.id}`);
    }),
  };
}

export function replicationRun(client) {
  return {
    name: "proxmox_replication_run",
    label: "Run Replication Job",
    description: "Triggers a manual synchronization for a replication job.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), id: Type.String({ description: "Replication job ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Running replication job ${params.id}...`);
      return await client.post(`/nodes/${params.node}/replication/${params.id}/run`);
    }),
  };
}

export function replicationLog(client) {
  return {
    name: "proxmox_replication_log",
    label: "Get Replication Job Log",
    description: "Gets the log for a storage replication job.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), id: Type.String({ description: "Replication job ID" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/replication/${params.id}/log`);
    }),
  };
}
