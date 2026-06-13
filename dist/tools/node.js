import { Type } from "@sinclair/typebox";
import { throwIfAborted, emitProgress, safeExecute } from "../tool-runtime.js";

export function nodeList(client) {
  return {
    name: "proxmox_node_list",
    label: "List Nodes",
    description: "Lists all physical nodes in the Proxmox cluster with their status, CPU, memory, and uptime.",
    parameters: Type.Object({}),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, "Fetching cluster nodes...");
      const nodes = await client.get("/nodes");
      return nodes.map(n => ({
        node: n.node, status: n.status,
        cpu: n.cpu ?? 0, maxcpu: n.maxcpu ?? 0,
        mem: n.mem ?? 0, maxmem: n.maxmem ?? 0,
        disk: n.disk ?? 0, maxdisk: n.maxdisk ?? 0,
        uptime: n.uptime ?? 0,
      }));
    }),
  };
}

export function nodeStatus(client) {
  return {
    name: "proxmox_node_status",
    label: "Get Node Status",
    description: "Gets detailed real-time status and resource usage for a specific Proxmox node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/status`);
    }),
  };
}

export function nodeServices(client) {
  return {
    name: "proxmox_node_services",
    label: "List Node Services",
    description: "Lists all Proxmox-related services and their status on a specific node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const services = await client.get(`/nodes/${params.node}/services`);
      return services.map(s => ({ name: s.name, state: s.state, flags: s.flags || "", desc: s.desc || "" }));
    }),
  };
}

export function nodeServiceRestart(client) {
  return {
    name: "proxmox_node_service_restart",
    label: "Restart Node Service",
    description: "Restarts a systemd service on a Proxmox node (e.g., pveproxy, pvestatd, pvedaemon).",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), service: Type.String({ description: "Service name (e.g., 'pveproxy', 'pvestatd')" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Restarting ${params.service} on ${params.node}...`);
      return await client.post(`/nodes/${params.node}/services/${params.service}/restart`);
    }),
  };
}

export function nodeJournal(client) {
  return {
    name: "proxmox_node_journal",
    label: "Read Node Journal",
    description: "Reads systemd journal entries from a Proxmox node, filtered by time range and optional service.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      since: Type.Optional(Type.String({ description: "Time range (e.g., '-1h', '-30m', '-1d')" })),
      service: Type.Optional(Type.String({ description: "Filter by service name" })),
      limit: Type.Optional(Type.Integer({ description: "Max log entries (default: 50)" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      const query = {};
      if (params.since) query.since = params.since;
      if (params.service) query.service = params.service;
      if (params.limit) query.limit = params.limit;
      return await client.get(`/nodes/${params.node}/journal`, query);
    }),
  };
}

export function nodeDns(client) {
  return {
    name: "proxmox_node_dns",
    label: "Get Node DNS Config",
    description: "Gets the DNS configuration for a Proxmox node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/dns`);
    }),
  };
}

export function nodeTime(client) {
  return {
    name: "proxmox_node_time",
    label: "Get Node Time Config",
    description: "Gets the current system time and timezone for a Proxmox node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/time`);
    }),
  };
}

export function nodeExecute(client) {
  return {
    name: "proxmox_node_execute",
    label: "Execute Command on Node",
    description: "Executes an arbitrary command on the Proxmox host node. Tries the API first (via /execute endpoint), then falls back to SSH. API-only execution requires PROXMOX_PASSWORD for ticket auth fallback. SSH requires your public key in /root/.ssh/authorized_keys. Set PROXMOX_SSH_KEY_PATH for a custom SSH key path.",
    parameters: Type.Object({
      node: Type.String({ description: "Proxmox node name" }),
      command: Type.String({ description: "Command to execute on the node (e.g., 'cat /etc/hostname')" }),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Executing command on node ${params.node}...`);
      const endpoint = `/nodes/${params.node}/execute`;
      try {
        return await client.post(endpoint, { command: params.command });
      } catch (err) {
        if (err.message?.includes("Permission check failed") && client.password) {
          emitProgress(onUpdate, "API token lacks /execute permission — falling back to password-based ticket auth...");
          try {
            return await client.postWithTicketAuth(endpoint, { command: params.command });
          } catch (ticketErr) {
            emitProgress(onUpdate, "Ticket auth also failed — attempting SSH fallback...");
          }
        } else {
          emitProgress(onUpdate, "API rejected the command parameter — attempting SSH fallback...");
        }
        return await client.execViaSSH(client.host, 22, params.command);
      }
    }),
  };
}

export function nodeConfig(client) {
  return {
    name: "proxmox_node_config",
    label: "Get Node Configuration",
    description: "Gets the configuration file for a Proxmox node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/config`);
    }),
  };
}

export function nodeReboot(client) {
  return {
    name: "proxmox_node_reboot",
    label: "Reboot Node",
    description: "Reboots a Proxmox node. Use with caution.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Rebooting node ${params.node}...`);
      return await client.post(`/nodes/${params.node}/reboot`);
    }),
  };
}

export function nodeStop(client) {
  return {
    name: "proxmox_node_stop",
    label: "Stop Node",
    description: "Stops (powers off) a Proxmox node. Use with extreme caution.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Stopping node ${params.node}...`);
      return await client.post(`/nodes/${params.node}/stop`);
    }),
  };
}

export function nodeAptUpdate(client) {
  return {
    name: "proxmox_node_apt_update",
    label: "Update APT Package Index",
    description: "Refreshes the APT package index on a Proxmox node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Refreshing APT index on ${params.node}...`);
      return await client.post(`/nodes/${params.node}/apt/update`);
    }),
  };
}

export function nodeSubscription(client) {
  return {
    name: "proxmox_node_subscription",
    label: "Get Node Subscription Status",
    description: "Gets the subscription status for a Proxmox node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/subscription`);
    }),
  };
}

export function nodeHardware(client) {
  return {
    name: "proxmox_node_hardware",
    label: "List Node Hardware",
    description: "Lists hardware devices (CPU, memory, PCI, USB) on a Proxmox node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/hardware`);
    }),
  };
}

export function nodeNetworkList(client) {
  return {
    name: "proxmox_node_network_list",
    label: "List Node Network Interfaces",
    description: "Lists all network interfaces configured on a Proxmox node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/network`);
    }),
  };
}

export function nodeServiceStatus(client) {
  return {
    name: "proxmox_node_service_status",
    label: "Get Node Service Details",
    description: "Gets detailed status for a specific service on a Proxmox node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), service: Type.String({ description: "Service name (e.g., 'pveproxy', 'pvestatd')" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      return await client.get(`/nodes/${params.node}/services/${params.service}`);
    }),
  };
}

export function nodeServiceStart(client) {
  return {
    name: "proxmox_node_service_start",
    label: "Start Node Service",
    description: "Starts a systemd service on a Proxmox node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), service: Type.String({ description: "Service name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Starting ${params.service} on ${params.node}...`);
      return await client.post(`/nodes/${params.node}/services/${params.service}/start`);
    }),
  };
}

export function nodeServiceStop(client) {
  return {
    name: "proxmox_node_service_stop",
    label: "Stop Node Service",
    description: "Stops a systemd service on a Proxmox node.",
    parameters: Type.Object({ node: Type.String({ description: "Proxmox node name" }), service: Type.String({ description: "Service name" }) }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);
      emitProgress(onUpdate, `Stopping ${params.service} on ${params.node}...`);
      return await client.post(`/nodes/${params.node}/services/${params.service}/stop`);
    }),
  };
}
