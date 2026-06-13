import { spawnSync } from "child_process";
import { homedir } from "os";
import { join } from "path";
import { loadConfig } from "./config.js";
import { resolveToolTimeoutMs } from "./tool-settings.js";
import { Agent } from "undici";

export class ProxmoxError extends Error {
  constructor(message, { status, endpoint, method, retryable = false } = {}) {
    super(message);
    this.name = "ProxmoxError";
    this.status = status;
    this.endpoint = endpoint;
    this.method = method;
    this.retryable = retryable;
  }
}

export class ProxmoxClient {
  constructor(options = {}) {
    const cfg = loadConfig(options);
    this.host = cfg.host;
    this.port = cfg.port;
    this.token = cfg.token;
    this.username = cfg.username;
    this.password = cfg.password;
    this.verifySsl = cfg.verifySsl === "true" || cfg.verifySsl === true;
    this.timeoutMs = cfg.timeoutMs;
    this.sshKeyPath = cfg.sshKeyPath;
    this.ticket = null;
    this.csrfToken = null;
    this._dispatcher = this.verifySsl ? undefined : new Agent({ connect: { rejectUnauthorized: false } });
    this._permCache = null;
  }

  get baseUrl() {
    return `https://${this.host}:${this.port}/api2/json`;
  }

  async #fetch(method, path, body = undefined) {
    const url = `${this.baseUrl}${path}`;
    const headers = {};

    if (this.token) {
      headers["Authorization"] = `PVEAPIToken=${this.token}`;
    } else if (this.ticket) {
      headers["Cookie"] = `PVEAuthCookie=${this.ticket}`;
      if (this.csrfToken && method !== "GET") {
        headers["CSRFPreventionToken"] = this.csrfToken;
      }
    }

    if (body && typeof body === "object") {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const params = body
        ? new URLSearchParams(
            Object.entries(body).filter(([, v]) => v !== undefined && v !== null),
          ).toString()
        : undefined;

      let fetchUrl = url;
      let fetchBody = undefined;

      if (method === "GET" && params) {
        fetchUrl = `${url}?${params}`;
      } else if (method !== "GET" && params) {
        fetchBody = params;
      }

      const response = await fetch(fetchUrl, {
        method,
        headers,
        body: fetchBody,
        signal: controller.signal,
        dispatcher: this._dispatcher,
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { data: text };
      }

      if (!response.ok) {
        const msg = data?.errors?.message || data?.message || response.statusText;
        throw new ProxmoxError(msg, {
          status: response.status,
          endpoint: path,
          method,
          retryable: response.status >= 500,
        });
      }

      return data.data !== undefined ? data.data : data;
    } finally {
      clearTimeout(timer);
    }
  }

  async authenticate() {
    if (this.token) return;
    if (this.ticket) return;

    if (this.password) {
      const data = await this.#fetch("POST", "/access/ticket", {
        username: this.username,
        password: this.password,
      });
      this.ticket = data.ticket;
      this.csrfToken = data.CSRFPreventionToken;
    } else {
      throw new ProxmoxError(
        "No authentication method available. Set PROXMOX_API_TOKEN or PROXMOX_PASSWORD in ~/.config/pi-proxmox/.env",
      );
    }
  }

  async request(method, path, body = undefined) {
    await this.authenticate();
    return this.#fetch(method, path, body);
  }

  get(path, params = undefined) {
    return this.request("GET", path, params);
  }

  post(path, body = {}) {
    return this.request("POST", path, body);
  }

  put(path, body = {}) {
    return this.request("PUT", path, body);
  }

  delete(path, body = undefined) {
    return this.request("DELETE", path, body);
  }

  async postWithTicketAuth(path, body = {}) {
    if (!this.password) {
      throw new ProxmoxError(
        "/execute endpoint requires root@pam identity. API tokens cannot satisfy this. " +
        "Set PROXMOX_PASSWORD in ~/.config/pi-proxmox/.env so the tool can fall back to password-based ticket auth.",
      );
    }
    const savedToken = this.token;
    const savedTicket = this.ticket;
    const savedCsrf = this.csrfToken;
    this.token = null;
    this.ticket = null;
    this.csrfToken = null;
    try {
      await this.authenticate();
      return await this.#fetch("POST", path, body);
    } finally {
      this.token = savedToken;
      this.ticket = savedTicket;
      this.csrfToken = savedCsrf;
    }
  }

  resolveSSHKeyPaths() {
    const home = homedir();
    const defaults = [
      join(home, ".ssh", "id_ed25519"),
      join(home, ".ssh", "id_rsa"),
    ];
    if (this.sshKeyPath) {
      const normalized = this.sshKeyPath.replace(/^~/, home);
      return [normalized, ...defaults.filter(p => p !== normalized)];
    }
    return defaults;
  }

  execViaSSH(host, port, command) {
    const keyPaths = this.resolveSSHKeyPaths();
    const errors = [];

    for (const keyPath of keyPaths) {
      const result = spawnSync("ssh", [
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "-p", String(port),
        "-i", keyPath,
        `root@${host}`,
        command,
      ], { encoding: "utf-8", timeout: this.timeoutMs });

      if (result.status === 0) {
        return result.stdout.trim();
      }
      if (result.error) {
        errors.push(`${keyPath}: ${result.error.message}`);
      } else {
        errors.push(`${keyPath}: ${result.stderr.trim() || `exit code ${result.status}`}`);
      }
    }

    throw new ProxmoxError(
      `SSH execution failed.\nTried keys: ${keyPaths.join(", ")}\n` +
      `Errors:\n${errors.join("\n")}\n\n` +
      `Ensure the Proxmox host (${host}) has SSH running and your public key is in /root/.ssh/authorized_keys. ` +
      `Set PROXMOX_SSH_KEY_PATH in ~/.config/pi-proxmox/.env if your key is at a non-standard path.`
    );
  }

  async _probePermissions() {
    const perms = { canListVMs: true, canListLXCs: true };
    try {
      const nodes = await this.get("/nodes");
      if (nodes?.length > 0) {
        const nodeName = nodes[0].node;
        try {
          await this.get(`/nodes/${nodeName}/status`);
        } catch { perms.canListVMs = false; perms.canListLXCs = false; }
      }
      try {
        await this.get("/cluster/status");
      } catch { perms.canListVMs = false; perms.canListLXCs = false; }
    } catch {}
    return perms;
  }
}

export function createClient(options = {}) {
  return new ProxmoxClient(options);
}
