import { Type } from "@sinclair/typebox";
import { throwIfAborted, emitProgress, safeExecute } from "../tool-runtime.js";

export function taskList(client) {
  return {
    name: "proxmox_task_list",
    label: "List Tasks",
    description: "Lists recent and running tasks on a specific node.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      limit: Type.Optional(Type.Integer({ description: "Max entries to return (default: 20)" })),
      errors: Type.Optional(Type.Integer({ description: "Show only failed tasks: 1 or 0" })),
      statusfilter: Type.Optional(Type.String({ description: "Filter by status: running, stopped, error" })),
      vmid: Type.Optional(Type.Integer({ description: "Filter by VM/CT ID" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Fetching tasks on ${params.node}...`);
      const query = {};
      if (params.limit) query.limit = params.limit;
      if (params.errors) query.errors = params.errors;
      if (params.statusfilter) query.statusfilter = params.statusfilter;
      if (params.vmid) query.vmid = params.vmid;
      const tasks = await client.get(`/nodes/${params.node}/tasks`, query);
      return tasks.map(t => ({
        upid: t.upid, type: t.type || "", status: t.status || "",
        starttime: t.starttime ?? 0, endtime: t.endtime ?? 0,
        user: t.user || "", node: t.node || "", id: t.id || "",
      }));
    }),
  };
}

export function taskStatus(client) {
  return {
    name: "proxmox_task_status",
    label: "Get Task Status",
    description: "Gets the current status of a task by its UPID.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), upid: Type.String({ description: "Task UPID identifier" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/tasks/${params.upid}/status`);
    }),
  };
}

export function taskLog(client) {
  return {
    name: "proxmox_task_log",
    label: "Get Task Log",
    description: "Gets the full log output for a task by its UPID.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), upid: Type.String({ description: "Task UPID identifier" }), limit: Type.Optional(Type.Integer({ description: "Max log lines to return (default: 100)" })) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const query = params.limit ? { limit: params.limit } : undefined;
      return await client.get(`/nodes/${params.node}/tasks/${params.upid}/log`, query);
    }),
  };
}
