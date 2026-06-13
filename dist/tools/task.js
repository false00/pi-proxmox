import { Type } from "@sinclair/typebox";
import { throwIfAborted, emitProgress, safeExecute } from "../tool-runtime.js";

export function taskList(client) {
  return {
    name: "proxmox_task_list",
    label: "List Tasks",
    description: "Lists recent and running tasks on a specific node.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      start: Type.Optional(Type.Integer({ description: "Optional offset into the task list (pagination)" })),
      limit: Type.Optional(Type.Integer({ description: "Max entries to return (default: 20)" })),
      errors: Type.Optional(Type.Integer({ description: "Show only failed tasks: 1 or 0" })),
      statusfilter: Type.Optional(Type.String({ description: "Filter by status: running, stopped, error" })),
      vmid: Type.Optional(Type.Integer({ description: "Filter by VM/CT ID" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Fetching tasks on ${params.node}...`);
      const { node: nodeName, ...query } = params;
      const tasks = await client.get(`/nodes/${nodeName}/tasks`, query);
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
    description: "Gets the log output for a task by its UPID with optional pagination.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      upid: Type.String({ description: "Task UPID identifier" }),
      start: Type.Optional(Type.Integer({ description: "Optional offset into the log (pagination)" })),
      limit: Type.Optional(Type.Integer({ description: "Max log lines to return (default: 100)" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const { node: nodeName, upid, ...query } = params;
      return await client.get(`/nodes/${nodeName}/tasks/${upid}/log`, query);
    }),
  };
}
