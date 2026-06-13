import { Type } from "@sinclair/typebox";
import { throwIfAborted, emitProgress, safeExecute } from "../tool-runtime.js";

export function userList(client) {
  return {
    name: "proxmox_user_list",
    label: "List Users",
    description: "Lists all Proxmox users.",
    parameters: Type.Object({ full: Type.Optional(Type.Integer({ description: "Include group/keys info: 1 or 0" })) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const query = params.full ? { full: params.full } : undefined;
      return await client.get("/access/users", query);
    }),
  };
}

export function userCreate(client) {
  return {
    name: "proxmox_user_create",
    label: "Create User",
    description: "Creates a new Proxmox user.",
    parameters: Type.Object({
      userid: Type.String({ description: "User ID with realm (e.g., 'john@pve')" }),
      password: Type.Optional(Type.String({ description: "Password (omit for token-only)" })),
      comment: Type.Optional(Type.String({ description: "User comment" })),
      email: Type.Optional(Type.String({ description: "Email address" })),
      enable: Type.Optional(Type.Integer({ description: "Enable user: 1 or 0" })),
      expire: Type.Optional(Type.Integer({ description: "Expiration timestamp" })),
      firstname: Type.Optional(Type.String({ description: "First name" })),
      lastname: Type.Optional(Type.String({ description: "Last name" })),
      groups: Type.Optional(Type.String({ description: "Comma-separated group IDs" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Creating user '${params.userid}'...`);
      return await client.post("/access/users", params);
    }),
  };
}

export function userDetail(client) {
  return {
    name: "proxmox_user_detail",
    label: "Get User Details",
    description: "Gets details for a specific Proxmox user.",
    parameters: Type.Object({ userid: Type.String({ description: "User ID (e.g., 'root@pam', 'john@pve')" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/access/users/${params.userid}`);
    }),
  };
}

export function userDelete(client) {
  return {
    name: "proxmox_user_delete",
    label: "Delete User",
    description: "Deletes a Proxmox user.",
    parameters: Type.Object({ userid: Type.String({ description: "User ID to delete" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting user '${params.userid}'...`);
      return await client.delete(`/access/users/${params.userid}`);
    }),
  };
}

export function groupList(client) {
  return {
    name: "proxmox_group_list",
    label: "List Groups",
    description: "Lists all Proxmox groups.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get("/access/groups");
    }),
  };
}

export function groupCreate(client) {
  return {
    name: "proxmox_group_create",
    label: "Create Group",
    description: "Creates a new Proxmox group.",
    parameters: Type.Object({ groupid: Type.String({ description: "Group identifier" }), comment: Type.Optional(Type.String({ description: "Comment" })), members: Type.Optional(Type.String({ description: "Comma-separated user IDs" })) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Creating group '${params.groupid}'...`);
      return await client.post("/access/groups", params);
    }),
  };
}

export function groupDelete(client) {
  return {
    name: "proxmox_group_delete",
    label: "Delete Group",
    description: "Deletes a Proxmox group.",
    parameters: Type.Object({ groupid: Type.String({ description: "Group identifier to delete" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting group '${params.groupid}'...`);
      return await client.delete(`/access/groups/${params.groupid}`);
    }),
  };
}

export function roleList(client) {
  return {
    name: "proxmox_role_list",
    label: "List Roles",
    description: "Lists all Proxmox roles with their privileges.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get("/access/roles");
    }),
  };
}

export function roleCreate(client) {
  return {
    name: "proxmox_role_create",
    label: "Create Role",
    description: "Creates a new Proxmox role with a set of privileges.",
    parameters: Type.Object({ roleid: Type.String({ description: "Role identifier" }), privs: Type.String({ description: "Comma-separated privileges (e.g., 'VM.Audit,VM.Config')" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Creating role '${params.roleid}'...`);
      return await client.post("/access/roles", params);
    }),
  };
}

export function roleDelete(client) {
  return {
    name: "proxmox_role_delete",
    label: "Delete Role",
    description: "Deletes a Proxmox role.",
    parameters: Type.Object({ roleid: Type.String({ description: "Role identifier to delete" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting role '${params.roleid}'...`);
      return await client.delete(`/access/roles/${params.roleid}`);
    }),
  };
}

export function aclList(client) {
  return {
    name: "proxmox_acl_list",
    label: "List ACL Entries",
    description: "Lists all ACL entries with path, user/group, and role assignments.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get("/access/acl");
    }),
  };
}

export function aclUpdate(client) {
  return {
    name: "proxmox_acl_update",
    label: "Update ACL",
    description: "Adds or removes an ACL entry for a path, user/group, and role.",
    parameters: Type.Object({
      path: Type.String({ description: "Resource path (e.g., '/', '/vms/100', '/storage/local')" }),
      roles: Type.String({ description: "Comma-separated role IDs" }),
      users: Type.Optional(Type.String({ description: "Comma-separated user IDs" })),
      groups: Type.Optional(Type.String({ description: "Comma-separated group IDs" })),
      propagate: Type.Optional(Type.Integer({ description: "Propagate to child paths: 1 or 0" })),
      delete: Type.Optional(Type.Integer({ description: "Remove entry instead of adding: 1 or 0" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, "Updating ACL...");
      return await client.put("/access/acl", params);
    }),
  };
}

export function tokenList(client) {
  return {
    name: "proxmox_token_list",
    label: "List API Tokens",
    description: "Lists all API tokens for a specific user.",
    parameters: Type.Object({ userid: Type.String({ description: "User ID (e.g., 'root@pam')" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/access/users/${params.userid}/token`);
    }),
  };
}

export function tokenCreate(client) {
  return {
    name: "proxmox_token_create",
    label: "Create API Token",
    description: "Creates a new API token for a user. The token secret is returned once.",
    parameters: Type.Object({ userid: Type.String({ description: "User ID (e.g., 'root@pam')" }), tokenid: Type.String({ description: "Token name (e.g., 'automation')" }), comment: Type.Optional(Type.String({ description: "Token description" })) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Creating token '${params.tokenid}' for ${params.userid}...`);
      return await client.post(`/access/users/${params.userid}/token`, params);
    }),
  };
}

export function tokenDelete(client) {
  return {
    name: "proxmox_token_delete",
    label: "Delete API Token",
    description: "Deletes an API token for a user.",
    parameters: Type.Object({ userid: Type.String({ description: "User ID" }), tokenid: Type.String({ description: "Token ID to delete (e.g., 'automation')" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting token '${params.tokenid}' for ${params.userid}...`);
      return await client.delete(`/access/users/${params.userid}/token/${params.tokenid}`);
    }),
  };
}

export function domainList(client) {
  return {
    name: "proxmox_domain_list",
    label: "List Auth Domains",
    description: "Lists all configured authentication domains/realms.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get("/access/domains");
    }),
  };
}
