import { Type } from "typebox";
import { throwIfAborted, emitProgress, safeExecute, validationError } from "../tool-runtime.js";

const LEVEL = "Scope: 'cluster' (default), a node name, 'vm/<vmid>', or 'lxc/<vmid>'";
const GUEST_OR_CLUSTER_LEVEL = "Scope: 'cluster' (default), 'vm/<vmid>', or 'lxc/<vmid>'; Proxmox has no node-level aliases or IPSets";
const NODE = "Node the guest runs on (required for 'vm/<vmid>' and 'lxc/<vmid>')";

function resolveFwPath(level, node, { allowNodeLevel = true } = {}) {
  if (!level || level === "cluster") return "/cluster/firewall";

  const guest = /^(vm|lxc)\/(\d+)$/.exec(level);
  if (guest) {
    if (!node) {
      throw validationError(`node is required for firewall level '${level}'`, "Pass the node the guest runs on, for example node='pve1'.");
    }
    return `/nodes/${node}/${guest[1] === "vm" ? "qemu" : "lxc"}/${guest[2]}/firewall`;
  }

  if (level.includes("/")) {
    throw validationError(`Unsupported firewall level '${level}'`, "Use 'cluster', a node name, 'vm/<vmid>', or 'lxc/<vmid>'.");
  }
  if (!allowNodeLevel) {
    throw validationError(`Proxmox has no node-level firewall aliases or IPSets (level '${level}')`, "Use level 'cluster', 'vm/<vmid>', or 'lxc/<vmid>'.");
  }
  return `/nodes/${level}/firewall`;
}

export function firewallRules(client) {
  return {
    name: "proxmox_firewall_rules",
    label: "List Firewall Rules",
    description: "Lists firewall rules at the cluster, node, VM, or container level.",
    parameters: Type.Object({
      level: Type.Optional(Type.String({ description: LEVEL })),
      node: Type.Optional(Type.String({ description: NODE })),
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
    description: "Adds a firewall rule at the cluster, node, VM, or container level. Proxmox inserts the new rule at the top of the list (position 0) and creates it disabled unless enable=1.",
    parameters: Type.Object({
      action: Type.String({ description: "Action: ACCEPT, DROP, REJECT, or the security group name when type is 'group'" }),
      type: Type.String({ description: "Rule type: in, out, forward, or group" }),
      source: Type.Optional(Type.String({ description: "Source IP/CIDR" })),
      dest: Type.Optional(Type.String({ description: "Destination IP/CIDR" })),
      dport: Type.Optional(Type.String({ description: "Destination port(s)" })),
      sport: Type.Optional(Type.String({ description: "Source port(s)" })),
      proto: Type.Optional(Type.String({ description: "Protocol: tcp, udp, icmp" })),
      iface: Type.Optional(Type.String({ description: "Network interface" })),
      enable: Type.Optional(Type.Integer({ description: "Enable the rule: 1 or 0 (Proxmox creates it disabled when omitted)" })),
      comment: Type.Optional(Type.String({ description: "Rule description" })),
      level: Type.Optional(Type.String({ description: LEVEL })),
      node: Type.Optional(Type.String({ description: NODE })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const { level, node, action, type, source, dest, dport, sport, proto, iface, enable, comment } = params;
      const path = `${resolveFwPath(level, node)}/rules`;
      emitProgress(onUpdate, "Adding firewall rule...");
      const body = { action, type };
      if (source) body.source = source;
      if (dest) body.dest = dest;
      if (dport) body.dport = dport;
      if (sport) body.sport = sport;
      if (proto) body.proto = proto;
      if (iface) body.iface = iface;
      if (enable !== undefined) body.enable = enable;
      if (comment) body.comment = comment;
      return await client.post(path, body);
    }),
  };
}

export function firewallOptions(client) {
  return {
    name: "proxmox_firewall_options",
    label: "Get Firewall Options",
    description: "Gets firewall options at the cluster, node, VM, or container level.",
    parameters: Type.Object({
      level: Type.Optional(Type.String({ description: LEVEL })),
      node: Type.Optional(Type.String({ description: NODE })),
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
    description: "Deletes the firewall rule at a position at the cluster, node, VM, or container level.",
    parameters: Type.Object({
      pos: Type.String({ description: "Position of the rule to delete (0 is the first rule)" }),
      level: Type.Optional(Type.String({ description: LEVEL })),
      node: Type.Optional(Type.String({ description: NODE })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const path = `${resolveFwPath(params.level, params.node)}/rules/${params.pos}`;
      emitProgress(onUpdate, `Deleting firewall rule at position ${params.pos}...`);
      return await client.delete(path);
    }),
  };
}

export function firewallAliases(client) {
  return {
    name: "proxmox_firewall_aliases",
    label: "List Firewall Aliases",
    description: "Lists firewall aliases at the cluster, VM, or container level.",
    parameters: Type.Object({
      level: Type.Optional(Type.String({ description: GUEST_OR_CLUSTER_LEVEL })),
      node: Type.Optional(Type.String({ description: NODE })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`${resolveFwPath(params.level, params.node, { allowNodeLevel: false })}/aliases`);
    }),
  };
}

export function firewallAliasCreate(client) {
  return {
    name: "proxmox_firewall_alias_create",
    label: "Create Firewall Alias",
    description: "Creates a firewall alias (a named IP or CIDR) at the cluster, VM, or container level.",
    parameters: Type.Object({
      name: Type.String({ description: "Alias name" }),
      cidr: Type.String({ description: "IP or CIDR (e.g., '192.168.1.0/24')" }),
      comment: Type.Optional(Type.String({ description: "Comment" })),
      level: Type.Optional(Type.String({ description: GUEST_OR_CLUSTER_LEVEL })),
      node: Type.Optional(Type.String({ description: NODE })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const { level, node, ...body } = params;
      const path = `${resolveFwPath(level, node, { allowNodeLevel: false })}/aliases`;
      emitProgress(onUpdate, `Creating alias '${params.name}'...`);
      return await client.post(path, body);
    }),
  };
}

export function firewallAliasDelete(client) {
  return {
    name: "proxmox_firewall_alias_delete",
    label: "Delete Firewall Alias",
    description: "Deletes a firewall alias at the cluster, VM, or container level.",
    parameters: Type.Object({
      name: Type.String({ description: "Alias name to delete" }),
      level: Type.Optional(Type.String({ description: GUEST_OR_CLUSTER_LEVEL })),
      node: Type.Optional(Type.String({ description: NODE })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const path = `${resolveFwPath(params.level, params.node, { allowNodeLevel: false })}/aliases/${params.name}`;
      emitProgress(onUpdate, `Deleting alias '${params.name}'...`);
      return await client.delete(path);
    }),
  };
}

export function firewallIpsetList(client) {
  return {
    name: "proxmox_firewall_ipset_list",
    label: "List IPSets",
    description: "Lists IPSets at the cluster, VM, or container level.",
    parameters: Type.Object({
      level: Type.Optional(Type.String({ description: GUEST_OR_CLUSTER_LEVEL })),
      node: Type.Optional(Type.String({ description: NODE })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`${resolveFwPath(params.level, params.node, { allowNodeLevel: false })}/ipset`);
    }),
  };
}

export function firewallIpsetCreate(client) {
  return {
    name: "proxmox_firewall_ipset_create",
    label: "Create IPSet",
    description: "Creates an IPSet at the cluster, VM, or container level.",
    parameters: Type.Object({
      name: Type.String({ description: "IPSet name" }),
      comment: Type.Optional(Type.String({ description: "Comment" })),
      level: Type.Optional(Type.String({ description: GUEST_OR_CLUSTER_LEVEL })),
      node: Type.Optional(Type.String({ description: NODE })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const { level, node, ...body } = params;
      const path = `${resolveFwPath(level, node, { allowNodeLevel: false })}/ipset`;
      emitProgress(onUpdate, `Creating IPSet '${params.name}'...`);
      return await client.post(path, body);
    }),
  };
}

export function firewallIpsetDelete(client) {
  return {
    name: "proxmox_firewall_ipset_delete",
    label: "Delete IPSet",
    description: "Deletes an IPSet at the cluster, VM, or container level.",
    parameters: Type.Object({
      name: Type.String({ description: "IPSet name to delete" }),
      level: Type.Optional(Type.String({ description: GUEST_OR_CLUSTER_LEVEL })),
      node: Type.Optional(Type.String({ description: NODE })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const path = `${resolveFwPath(params.level, params.node, { allowNodeLevel: false })}/ipset/${params.name}`;
      emitProgress(onUpdate, `Deleting IPSet '${params.name}'...`);
      return await client.delete(path);
    }),
  };
}

export function firewallOptionsUpdate(client) {
  return {
    name: "proxmox_firewall_options_update",
    label: "Update Firewall Options",
    description: "Updates firewall options at the cluster, node, VM, or container level. Each level accepts a different set of options; Proxmox rejects options that do not apply to the chosen level.",
    parameters: Type.Object({
      enable: Type.Optional(Type.Integer({ description: "Enable the firewall: 1 or 0 (all levels)" })),
      policy_in: Type.Optional(Type.String({ description: "Default inbound policy: ACCEPT, DROP, REJECT (cluster, VM, container)" })),
      policy_out: Type.Optional(Type.String({ description: "Default outbound policy: ACCEPT, DROP, REJECT (cluster, VM, container)" })),
      log_level_in: Type.Optional(Type.String({ description: "Log level for inbound traffic (node, VM, container)" })),
      log_level_out: Type.Optional(Type.String({ description: "Log level for outbound traffic (node, VM, container)" })),
      dhcp: Type.Optional(Type.Integer({ description: "Allow DHCP: 1 or 0 (VM, container)" })),
      ndp: Type.Optional(Type.Integer({ description: "Allow NDP: 1 or 0 (node, VM, container)" })),
      level: Type.Optional(Type.String({ description: LEVEL })),
      node: Type.Optional(Type.String({ description: NODE })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const { level, node, ...body } = params;
      const path = `${resolveFwPath(level, node)}/options`;
      emitProgress(onUpdate, "Updating firewall options...");
      return await client.put(path, body);
    }),
  };
}
