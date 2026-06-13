import { Type } from "@sinclair/typebox";
import { throwIfAborted, emitProgress, safeExecute } from "../tool-runtime.js";

function resolveFwPath(level, node) {
  if (!level || level === "cluster") return "/cluster/firewall";
  if (level.startsWith("vm/")) return `/nodes/${node}/qemu/${level.split("/")[1]}/firewall`;
  if (level.startsWith("lxc/")) return `/nodes/${node}/lxc/${level.split("/")[1]}/firewall`;
  return `/nodes/${level}/firewall`;
}

export function firewallRules(client) {
  return {
    name: "proxmox_firewall_rules",
    label: "List Firewall Rules",
    description: "Lists firewall rules at the cluster, node, VM, or container level.",
    parameters: Type.Object({
      level: Type.Optional(Type.String({ description: "Scope: 'cluster' (default), node name, or 'vm/<vmid>', 'lxc/<vmid>" })),
      node: Type.Optional(Type.String({ description: "Node name (required for vm/ct level)" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`${resolveFwPath(params.level, params.node)}/rules`);
    }),
  };
}

export function firewallRuleAdd(client) {
  return {
    name: "proxmox_firewall_rule_add",
    label: "Add Firewall Rule",
    description: "Adds a firewall rule at the specified level (cluster, node, vm/<id>, lxc/<id>).",
    parameters: Type.Object({
      action: Type.String({ description: "Action: ACCEPT, DROP, REJECT" }),
      type: Type.Optional(Type.String({ description: "Rule direction: in, out" })),
      source: Type.Optional(Type.String({ description: "Source IP/CIDR" })),
      dest: Type.Optional(Type.String({ description: "Destination IP/CIDR" })),
      dport: Type.Optional(Type.String({ description: "Destination port(s)" })),
      sport: Type.Optional(Type.String({ description: "Source port(s)" })),
      proto: Type.Optional(Type.String({ description: "Protocol: tcp, udp, icmp" })),
      iface: Type.Optional(Type.String({ description: "Network interface" })),
      enable: Type.Optional(Type.Integer({ description: "Enable rule: 1 or 0" })),
      comment: Type.Optional(Type.String({ description: "Rule description" })),
      level: Type.Optional(Type.String({ description: "Scope: 'cluster' (default), node name, 'vm/<vmid>', 'lxc/<vmid>'" })),
      node: Type.Optional(Type.String({ description: "Node name (required for vm/ct level)" })),
      pos: Type.Optional(Type.String({ description: "Rule position (for updating/deleting specific rules)" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, "Adding firewall rule...");
      const { level, node, action, type, source, dest, dport, sport, proto, iface, enable, comment } = params;
      const body = { action };
      if (type) body.type = type;
      if (source) body.source = source;
      if (dest) body.dest = dest;
      if (dport) body.dport = dport;
      if (sport) body.sport = sport;
      if (proto) body.proto = proto;
      if (iface) body.iface = iface;
      if (enable !== undefined) body.enable = enable;
      if (comment) body.comment = comment;
      return await client.post(`${resolveFwPath(level, node)}/rules`, body);
    }),
  };
}

export function firewallOptions(client) {
  return {
    name: "proxmox_firewall_options",
    label: "Get Firewall Options",
    description: "Gets firewall options at the cluster, node, VM, or container level.",
    parameters: Type.Object({
      level: Type.Optional(Type.String({ description: "Scope: 'cluster' (default), node name, or 'vm/<vmid>', 'lxc/<vmid>'" })),
      node: Type.Optional(Type.String({ description: "Node name (required for vm/ct level)" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`${resolveFwPath(params.level, params.node)}/options`);
    }),
  };
}

export function firewallRulesDelete(client) {
  return {
    name: "proxmox_firewall_rules_delete",
    label: "Delete Firewall Rule",
    description: "Deletes a firewall rule at the specified position and level.",
    parameters: Type.Object({
      pos: Type.String({ description: "Rule position to delete" }),
      level: Type.Optional(Type.String({ description: "Scope: 'cluster' (default), node name, 'vm/<vmid>', 'lxc/<vmid>'" })),
      node: Type.Optional(Type.String({ description: "Node name (required for vm/ct level)" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting firewall rule at position ${params.pos}...`);
      return await client.delete(`${resolveFwPath(params.level, params.node)}/rules/${params.pos}`);
    }),
  };
}

export function firewallAliases(client) {
  return {
    name: "proxmox_firewall_aliases",
    label: "List Firewall Aliases",
    description: "Lists firewall aliases at the specified level.",
    parameters: Type.Object({
      level: Type.Optional(Type.String({ description: "Scope: 'cluster' (default), node name, or 'vm/<vmid>', 'lxc/<vmid>'" })),
      node: Type.Optional(Type.String({ description: "Node name" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`${resolveFwPath(params.level, params.node)}/aliases`);
    }),
  };
}

export function firewallAliasCreate(client) {
  return {
    name: "proxmox_firewall_alias_create",
    label: "Create Firewall Alias",
    description: "Creates a firewall alias (IP/CIDR name) at the specified level.",
    parameters: Type.Object({
      name: Type.String({ description: "Alias name" }),
      cidr: Type.String({ description: "IP or CIDR (e.g., '192.168.1.0/24')" }),
      comment: Type.Optional(Type.String({ description: "Comment" })),
      level: Type.Optional(Type.String({ description: "Scope: 'cluster' (default), node name, 'vm/<vmid>', 'lxc/<vmid>'" })),
      node: Type.Optional(Type.String({ description: "Node name" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const { level, node, ...body } = params;
      emitProgress(onUpdate, `Creating alias '${params.name}'...`);
      return await client.post(`${resolveFwPath(level, node)}/aliases`, body);
    }),
  };
}

export function firewallAliasDelete(client) {
  return {
    name: "proxmox_firewall_alias_delete",
    label: "Delete Firewall Alias",
    description: "Deletes a firewall alias at the specified level.",
    parameters: Type.Object({
      name: Type.String({ description: "Alias name to delete" }),
      level: Type.Optional(Type.String({ description: "Scope" })),
      node: Type.Optional(Type.String({ description: "Node name" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting alias '${params.name}'...`);
      return await client.delete(`${resolveFwPath(params.level, params.node)}/aliases/${params.name}`);
    }),
  };
}

export function firewallIpsetList(client) {
  return {
    name: "proxmox_firewall_ipset_list",
    label: "List IPSets",
    description: "Lists all IPSets at the specified firewall level.",
    parameters: Type.Object({
      level: Type.Optional(Type.String({ description: "Scope: 'cluster' (default), node name" })),
      node: Type.Optional(Type.String({ description: "Node name" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`${resolveFwPath(params.level, params.node)}/ipset`);
    }),
  };
}

export function firewallIpsetCreate(client) {
  return {
    name: "proxmox_firewall_ipset_create",
    label: "Create IPSet",
    description: "Creates an IPSet at the specified level.",
    parameters: Type.Object({
      name: Type.String({ description: "IPSet name" }),
      comment: Type.Optional(Type.String({ description: "Comment" })),
      level: Type.Optional(Type.String({ description: "Scope: 'cluster' (default), node name" })),
      node: Type.Optional(Type.String({ description: "Node name" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const { level, node, ...body } = params;
      emitProgress(onUpdate, `Creating IPSet '${params.name}'...`);
      return await client.post(`${resolveFwPath(level, node)}/ipset`, body);
    }),
  };
}

export function firewallIpsetDelete(client) {
  return {
    name: "proxmox_firewall_ipset_delete",
    label: "Delete IPSet",
    description: "Deletes an IPSet at the specified level.",
    parameters: Type.Object({
      name: Type.String({ description: "IPSet name to delete" }),
      level: Type.Optional(Type.String({ description: "Scope" })),
      node: Type.Optional(Type.String({ description: "Node name" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Deleting IPSet '${params.name}'...`);
      return await client.delete(`${resolveFwPath(params.level, params.node)}/ipset/${params.name}`);
    }),
  };
}

export function firewallOptionsUpdate(client) {
  return {
    name: "proxmox_firewall_options_update",
    label: "Update Firewall Options",
    description: "Updates firewall options (enable, policy, logging) at the specified level.",
    parameters: Type.Object({
      enable: Type.Optional(Type.Integer({ description: "Enable firewall: 1 or 0" })),
      policy_in: Type.Optional(Type.String({ description: "Default inbound policy: ACCEPT, DROP, REJECT" })),
      policy_out: Type.Optional(Type.String({ description: "Default outbound policy: ACCEPT, DROP, REJECT" })),
      log_level_in: Type.Optional(Type.String({ description: "Log level for inbound" })),
      log_level_out: Type.Optional(Type.String({ description: "Log level for outbound" })),
      dhcp: Type.Optional(Type.Integer({ description: "Allow DHCP: 1 or 0" })),
      ndp: Type.Optional(Type.Integer({ description: "Allow NDP: 1 or 0" })),
      level: Type.Optional(Type.String({ description: "Scope: 'cluster' (default), node name, 'vm/<vmid>', 'lxc/<vmid>'" })),
      node: Type.Optional(Type.String({ description: "Node name" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const { level, node, ...body } = params;
      emitProgress(onUpdate, "Updating firewall options...");
      return await client.put(`${resolveFwPath(level, node)}/options`, body);
    }),
  };
}
