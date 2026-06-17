const DEFAULT_TIMEOUT_MS = 30_000;
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 120_000;

export function resolveToolTimeoutMs() {
  const env = process.env.PROXMOX_TOOL_TIMEOUT_MS;
  if (env) {
    const parsed = parseInt(env, 10);
    if (!isNaN(parsed) && parsed >= MIN_TIMEOUT_MS) {
      return Math.min(parsed, MAX_TIMEOUT_MS);
    }
  }

  return DEFAULT_TIMEOUT_MS;
}
