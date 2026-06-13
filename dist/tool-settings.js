const DEFAULT_TIMEOUT_MS = 30_000;
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 120_000;

let cachedTimeout = undefined;

export function resolveToolTimeoutMs() {
  if (cachedTimeout !== undefined) return cachedTimeout;

  const env = process.env.PROXMOX_TOOL_TIMEOUT_MS;
  if (env) {
    const parsed = parseInt(env, 10);
    if (!isNaN(parsed) && parsed >= MIN_TIMEOUT_MS) {
      cachedTimeout = Math.min(parsed, MAX_TIMEOUT_MS);
      return cachedTimeout;
    }
  }

  cachedTimeout = DEFAULT_TIMEOUT_MS;
  return cachedTimeout;
}
