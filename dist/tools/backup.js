import { Type } from "typebox";
import { throwIfAborted, emitProgress, safeExecute } from "../tool-runtime.js";

export function backupList(client) {
  return {
    name: "proxmox_backup_list",
    label: "List Backup Jobs",
    description: "Lists all configured backup jobs in the cluster.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, "Fetching backup jobs...");
      const jobs = await client.get("/cluster/backup");
      return jobs.map(j => ({
        id: j.id, node: j.node || "", storage: j.storage || "",
        schedule: j.schedule || "", mode: j.mode || "snapshot", enabled: j.enable !== 0,
        compress: j.compress || "", vmid: j.vmid || "all",
        "prune-backups": j["prune-backups"] || "",
      }));
    }),
  };
}

export function backupCreate(client) {
  return {
    name: "proxmox_backup_create",
    label: "Create Backup Job",
    description: "Creates a new scheduled backup job for VMs and containers.",
    parameters: Type.Object({
      id: Type.String({ description: "Backup job ID" }),
      node: Type.String({ description: "Node to run the backup on" }),
      storage: Type.String({ description: "Target storage ID" }),
      schedule: Type.String({ description: "Cron schedule (e.g., '0 2 * * *' for daily at 2am)" }),
      mode: Type.Optional(Type.String({ description: "Backup mode: snapshot (default), suspend, stop" })),
      vmid: Type.Optional(Type.String({ description: "VM/CT IDs to backup (comma-separated, omit for all)" })),
      compress: Type.Optional(Type.String({ description: "Compression: lzo, gzip, zstd" })),
      "prune-backups": Type.Optional(Type.String({ description: "Retention: 'keep-last=7', 'keep-daily=7', etc." })),
      enabled: Type.Optional(Type.Integer({ description: "Enable job: 1 or 0 (default: 1)" })),
      all: Type.Optional(Type.Integer({ description: "Back up all VMs/CTs: 1 or 0" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Creating backup job '${params.id}'...`);
      return await client.post("/cluster/backup", params);
    }),
  };
}

export function backupDelete(client) {
  return {
    name: "proxmox_backup_delete",
    label: "Delete Backup Job",
    description: "Deletes a backup job by its ID.",
    parameters: Type.Object({ id: Type.String({ description: "Backup job ID to delete" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting backup job '${params.id}'...`);
      return await client.delete(`/cluster/backup/${params.id}`);
    }),
  };
}
