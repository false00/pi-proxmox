import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function configDir() {
  return join(homedir(), ".config", "pi-proxmox");
}

function envPath() {
  return join(configDir(), ".env");
}

function parseEnvFile(path) {
  const content = readFileSync(path, "utf-8");
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    vars[key] = val;
  }
  return vars;
}

function ensureDotEnvFile(discovered) {
  if (existsSync(envPath())) return;

  try {
    if (!existsSync(configDir())) {
      mkdirSync(configDir(), { recursive: true });
    }

    const lines = [
      "# pi-proxmox configuration — auto-created on first run",
      "# Replace these placeholder values with your Proxmox connection details.",
      "",
      "# --- Connection ---",
      `PROXMOX_HOST=${discovered.host || "192.168.1.100"}`,
      `PROXMOX_PORT=${discovered.port || "8006"}`,
      `PROXMOX_VERIFY_SSL=${discovered.verifySsl || "false"}`,
      "",
      "# --- API Token (recommended) ---",
      "# Create one in the Proxmox web UI under: Datacenter > Permissions > API Tokens",
      "# Or via CLI: pveum user token add root@pam automation --privsep=0",
      "# The GUI will show you a Token ID (e.g. 'root@pam!automation') and a secret UUID.",
      `PROXMOX_TOKEN_ID=${discovered.tokenId || "root@pam!automation"}`,
      `PROXMOX_TOKEN_SECRET=${discovered.tokenSecret || "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}`,
      "",
      "# --- Password fallback (only if no API token is set) ---",
      `PROXMOX_USERNAME=${discovered.username || "root@pam"}`,
      `PROXMOX_PASSWORD=${discovered.password || ""}`,
      "",
      "# --- SSH (for proxmox_lxc_exec and proxmox_node_execute) ---",
      "# WHY: The Proxmox VE API has no native shell exec endpoint for LXC containers",
      "#      (unlike VMs which have a QEMU Guest Agent). The /node/execute endpoint is",
      "#      a batch API proxy, not a shell executor. So LXC exec and node execute",
      "#      fall back to SSH when the API can't run the command.",
      "#",
      "# To add your public key to the Proxmox host (edit the IP):",
      "#   Linux/macOS:    ssh-copy-id root@192.168.1.100",
      "#   Windows (pwsh): type $env:USERPROFILE/.ssh/id_ed25519.pub | ssh root@192.168.1.100 \"cat >> /root/.ssh/authorized_keys\"",
      "#   Windows (cmd):  type %USERPROFILE%\\.ssh\\id_ed25519.pub | ssh root@192.168.1.100 \"cat >> /root/.ssh/authorized_keys\"",
      "#",
      "# Path to SSH private key for connecting to the Proxmox host as root.",
      "# If not set, defaults to trying ~/.ssh/id_ed25519 then ~/.ssh/id_rsa.",
      `PROXMOX_SSH_KEY_PATH=${discovered.sshKeyPath || ""}`,
      "",
      "# --- Timeout ---",
      `PROXMOX_TIMEOUT_MS=${discovered.timeoutMs || "30000"}`,
    ];

    writeFileSync(envPath(), lines.join("\n"), "utf-8");
  } catch {
    // silently ignore — .env file is a convenience, not a requirement
  }
}

function buildFullToken(tokenId, tokenSecret) {
  if (!tokenId || !tokenSecret) return "";
  return `${tokenId}=${tokenSecret}`;
}

export function loadConfig(overrides = {}) {
  const envPathStr = envPath();
  const fileVars = existsSync(envPathStr) ? parseEnvFile(envPathStr) : {};

  const host =
    overrides.host ||
    fileVars.PROXMOX_HOST ||
    process.env.PROXMOX_HOST ||
    "192.168.1.100";

  const port =
    overrides.port ||
    fileVars.PROXMOX_PORT ||
    process.env.PROXMOX_PORT ||
    "8006";

  // Resolve token — prefer combined API_TOKEN, else build from TOKEN_ID + TOKEN_SECRET
  const combinedToken =
    overrides.token ||
    fileVars.PROXMOX_API_TOKEN ||
    process.env.PROXMOX_API_TOKEN ||
    "";

  const tokenId =
    overrides.tokenId ||
    fileVars.PROXMOX_TOKEN_ID ||
    process.env.PROXMOX_TOKEN_ID ||
    "";

  const tokenSecret =
    overrides.tokenSecret ||
    fileVars.PROXMOX_TOKEN_SECRET ||
    process.env.PROXMOX_TOKEN_SECRET ||
    "";

  const token = combinedToken || buildFullToken(tokenId, tokenSecret);

  const username =
    overrides.username ||
    fileVars.PROXMOX_USERNAME ||
    process.env.PROXMOX_USERNAME ||
    "root@pam";

  const password =
    overrides.password ||
    fileVars.PROXMOX_PASSWORD ||
    process.env.PROXMOX_PASSWORD ||
    "";

  const verifySsl =
    overrides.verifySsl !== undefined
      ? overrides.verifySsl
      : fileVars.PROXMOX_VERIFY_SSL || process.env.PROXMOX_VERIFY_SSL || "false";

  const sshKeyPath =
    overrides.sshKeyPath ||
    fileVars.PROXMOX_SSH_KEY_PATH ||
    process.env.PROXMOX_SSH_KEY_PATH ||
    "";

  const timeoutMs = parseInt(
    overrides.timeoutMs ||
      fileVars.PROXMOX_TIMEOUT_MS ||
      process.env.PROXMOX_TIMEOUT_MS ||
      "30000",
    10,
  );

  const resolved = {
    host,
    port,
    token,
    tokenId,
    tokenSecret,
    username,
    password,
    verifySsl,
    timeoutMs,
    sshKeyPath,
  };

  ensureDotEnvFile(resolved);

  return resolved;
}
