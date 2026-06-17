import { Type } from "typebox";
import { throwIfAborted, emitProgress, safeExecute } from "../tool-runtime.js";

export function haStatus(client) {
  return {
    name: "proxmox_ha_status",
    label: "Get HA Status",
    description: "Gets the overall High Availability status including quorum and manager state.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get("/cluster/ha/status");
    }),
  };
}

export function haResourcesList(client) {
  return {
    name: "proxmox_ha_resources_list",
    label: "List HA Resources",
    description: "Lists all HA-managed resources with their current state.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get("/cluster/ha/resources");
    }),
  };
}

export function haResourceCreate(client) {
  return {
    name: "proxmox_ha_resource_create",
    label: "Add HA Resource",
    description: "Adds a VM or container to HA management.",
    parameters: Type.Object({
      sid: Type.String({ description: "Resource ID (e.g., 'vm:100', 'ct:200')" }),
      state: Type.Optional(Type.String({ description: "Desired state: started, stopped, disabled (default: started)" })),
      comment: Type.Optional(Type.String({ description: "Comment" })),
      max_restart: Type.Optional(Type.Integer({ description: "Max restart attempts" })),
      max_relocate: Type.Optional(Type.Integer({ description: "Max relocate attempts" })),
      group: Type.Optional(Type.String({ description: "HA group name" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Adding HA resource ${params.sid}...`);
      return await client.post("/cluster/ha/resources", params);
    }),
  };
}

export function haResourceDelete(client) {
  return {
    name: "proxmox_ha_resource_delete",
    label: "Remove HA Resource",
    description: "Removes a VM or container from HA management.",
    parameters: Type.Object({ sid: Type.String({ description: "Resource ID (e.g., 'vm:100')" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Removing HA resource ${params.sid}...`);
      return await client.delete(`/cluster/ha/resources/${params.sid}`);
    }),
  };
}

export function haGroupsList(client) {
  return {
    name: "proxmox_ha_groups_list",
    label: "List HA Groups",
    description: "Lists all configured HA groups with node preferences.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get("/cluster/ha/groups");
    }),
  };
}

export function haGroupCreate(client) {
  return {
    name: "proxmox_ha_group_create",
    label: "Create HA Group",
    description: "Creates a High Availability group with node priority ordering.",
    parameters: Type.Object({
      group: Type.String({ description: "Group identifier" }),
      nodes: Type.String({ description: "Ordered comma-separated node names (e.g., 'pve1,pve2,pve3')" }),
      nofailback: Type.Optional(Type.Integer({ description: "Prevent failback: 1 or 0" })),
      restricted: Type.Optional(Type.Integer({ description: "Restrict to nodes in group: 1 or 0" })),
      comment: Type.Optional(Type.String({ description: "Comment" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Creating HA group '${params.group}'...`);
      return await client.post("/cluster/ha/groups", params);
    }),
  };
}

export function haGroupDelete(client) {
  return {
    name: "proxmox_ha_group_delete",
    label: "Delete HA Group",
    description: "Deletes an HA group.",
    parameters: Type.Object({ group: Type.String({ description: "Group identifier to delete" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting HA group '${params.group}'...`);
      return await client.delete(`/cluster/ha/groups/${params.group}`);
    }),
  };
}
