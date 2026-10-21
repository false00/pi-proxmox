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

export function dotEnvTemplate(discovered) {
  // Keep fallback credentials that were explicitly supplied; otherwise leave the discouraged fallback commented out.
  const passwordFallback = discovered.password
    ? [`PROXMOX_USERNAME=${discovered.username || "root@pam"}`, `PROXMOX_PASSWORD=${discovered.password}`]
    : ["# PROXMOX_USERNAME=", "# PROXMOX_PASSWORD="];

  return [
    "# pi-proxmox configuration — auto-created on first run",
    "# Replace these placeholder values with your Proxmox connection details.",
    "# Least-privilege setup guide: https://github.com/false00/pi-proxmox/blob/master/docs/PERMISSIONS.md",
    "",
    "# --- Connection ---",
    `PROXMOX_HOST=${discovered.host || "192.168.1.100"}`,
    `PROXMOX_PORT=${discovered.port || "8006"}`,
    `PROXMOX_VERIFY_SSL=${discovered.verifySsl || "false"}`,
    "",
    "# --- API Token (recommended) ---",
    "# Use a dedicated non-root user and a token with privilege separation enabled (the default):",
    "#   pveum user add pi-proxmox@pve",
    "#   pveum user token add pi-proxmox@pve automation --privsep 1",
    "# Grant roles to BOTH the user and the token (the token gets the intersection of both),",
    "# on the narrowest path that works, for example read-only on a resource pool:",
    "#   pveum acl modify /pool/<pool> --roles PVEAuditor --users pi-proxmox@pve",
    "#   pveum acl modify /pool/<pool> --roles PVEAuditor --tokens 'pi-proxmox@pve!automation'",
    `PROXMOX_TOKEN_ID=${discovered.tokenId || "pi-proxmox@pve!automation"}`,
    `PROXMOX_TOKEN_SECRET=${discovered.tokenSecret || "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}`,
    "",
    "# --- Password fallback (optional, discouraged; leave unset) ---",
    "# Used for every request if no API token is set, and to retry proxmox_node_execute.",
    "# /nodes/{node}/execute is root-only, so that retry only works with root@pam credentials",
    "# (the node's Linux root password). Left unset, proxmox_node_execute fails closed.",
    "# PROXMOX_USERNAME defaults to root@pam when unset.",
    ...passwordFallback,
    "",
    "# --- Timeout ---",
    `PROXMOX_TIMEOUT_MS=${discovered.timeoutMs || "30000"}`,
  ].join("\n");
}

function ensureDotEnvFile(discovered) {
  if (existsSync(envPath())) return;

  try {
    if (!existsSync(configDir())) {
      mkdirSync(configDir(), { recursive: true });
    }

    writeFileSync(envPath(), dotEnvTemplate(discovered), "utf-8");
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
  };

  ensureDotEnvFile(resolved);

  return resolved;
}
