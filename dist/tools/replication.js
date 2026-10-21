import { Type } from "typebox";
import { throwIfAborted, emitProgress, safeExecute } from "../tool-runtime.js";

export function replicationList(client) {
  return {
    name: "proxmox_replication_list",
    label: "List Replication Jobs",
    description: "Lists the status of all storage replication jobs on a node.",
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
    description: "Creates a cluster-wide storage replication job (POST /cluster/replication) that replicates a guest's local volumes to a target node. The job ID is '<vmid>-<jobnum>'; the guest's current node is the source.",
    parameters: Type.Object({
      vmid: Type.Integer({ description: "VM/CT ID to replicate" }),
      target: Type.String({ description: "Target node name" }),
      jobnum: Type.Optional(Type.Integer({ description: "Job number, used in the job ID '<vmid>-<jobnum>' (default: 0); use another number for an additional job of the same guest" })),
      schedule: Type.Optional(Type.String({ description: "Replication schedule as a systemd calendar event (default: '*/15', every 15 minutes)" })),
      rate: Type.Optional(Type.Number({ description: "Rate limit in megabytes per second" })),
      comment: Type.Optional(Type.String({ description: "Comment" })),
      disable: Type.Optional(Type.Integer({ description: "Create the job disabled: 1 or 0" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const id = `${params.vmid}-${params.jobnum ?? 0}`;
      emitProgress(onUpdate, `Creating replication job ${id} to ${params.target}...`);
      return await client.post("/cluster/replication", {
        id,
        type: "local",
        target: params.target,
        schedule: params.schedule,
        rate: params.rate,
        comment: params.comment,
        disable: params.disable,
      });
    }),
  };
}

export function replicationDelete(client) {
  return {
    name: "proxmox_replication_delete",
    label: "Delete Replication Job",
    description: "Marks a storage replication job for removal (DELETE /cluster/replication/{id}). Proxmox then removes the job's replication snapshots and, unless keep=1, the replicated volumes on the target node before deleting the job.",
    parameters: Type.Object({
      id: Type.String({ description: "Replication job ID in the form '<vmid>-<jobnum>', e.g. '100-0'" }),
      keep: Type.Optional(Type.Integer({ description: "Keep the replicated data on the target node: 1 or 0" })),
      force: Type.Optional(Type.Integer({ description: "Remove the job configuration without any cleanup: 1 or 0" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting replication job ${params.id}...`);
      return await client.delete(`/cluster/replication/${params.id}`, { keep: params.keep, force: params.force });
    }),
  };
}

export function replicationRun(client) {
  return {
    name: "proxmox_replication_run",
    label: "Run Replication Job Now",
    description: "Schedules a storage replication job to run as soon as possible (POST /nodes/{node}/replication/{id}/schedule_now). Run it on the job's source node, where the guest currently runs.",
    parameters: Type.Object({ node: Type.String({ description: "Source node of the job (where the guest currently runs)" }), id: Type.String({ description: "Replication job ID in the form '<vmid>-<jobnum>', e.g. '100-0'" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Scheduling replication job ${params.id} to run now...`);
      return await client.post(`/nodes/${params.node}/replication/${params.id}/schedule_now`);
    }),
  };
}

export function replicationLog(client) {
  return {
    name: "proxmox_replication_log",
    label: "Get Replication Job Log",
    description: "Gets the log for a storage replication job.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), id: Type.String({ description: "Replication job ID in the form '<vmid>-<jobnum>', e.g. '100-0'" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/replication/${params.id}/log`);
    }),
  };
}
