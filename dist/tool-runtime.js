import { resolveToolTimeoutMs } from "./tool-settings.js";

export function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted", "AbortError");
  }
}

export function validationError(message, guidance) {
  return Object.assign(new Error(message), {
    name: "ProxmoxError",
    status: 400,
    category: "validation",
    guidance,
    retryable: false,
  });
}

export function emitProgress(onUpdate, msg) {
  if (typeof onUpdate === "function") {
    try {
      onUpdate({
        content: [{ type: "text", text: msg }],
        details: { status: msg },
      });
    } catch {
      // noop
    }
  }
}

export function normalizeExecuteCommands(commands) {
  return commands.map((command, index) => {
    if (!command || typeof command !== "object") {
      throw Object.assign(new Error(`commands[${index}] must be an object with method and path`), {
        name: "ProxmoxError",
        status: 400,
        category: "validation",
        guidance: "Each command must be an object with 'method' (GET/POST/PUT/DELETE) and 'path' (string).",
        retryable: false,
      });
    }

    const normalized = { ...command };
    if (normalized.args === undefined && normalized.body !== undefined) {
      normalized.args = normalized.body;
    }
    delete normalized.body;
    return normalized;
  });
}

const EXECUTE_ROOT_ONLY_GUIDANCE =
  "/nodes/{node}/execute is root-only in Proxmox (the API viewer lists it as \"Root only\"), so no role or ACL on an API token satisfies it. " +
  "With the recommended least-privilege setup this tool fails closed; run the individual requests with dedicated tools or proxmox_api_call instead. " +
  "The optional root@pam password fallback (PROXMOX_USERNAME/PROXMOX_PASSWORD) is discouraged; see docs/PERMISSIONS.md.";

export async function execOnNode(client, node, commands, onUpdate) {
  const endpoint = `/nodes/${node}/execute`;
  const normalizedCommands = normalizeExecuteCommands(commands);
  const body = { commands: JSON.stringify(normalizedCommands) };
  try {
    return await client.post(endpoint, body);
  } catch (err) {
    if (err.message?.includes("Permission check failed") && client.password) {
      emitProgress(onUpdate, "API token lacks /execute permission — falling back to password-based ticket auth...");
      return await client.postWithTicketAuth(endpoint, body);
    }
    if (err.message?.includes("Permission check failed") && !err.guidance) {
      err.guidance = EXECUTE_ROOT_ONLY_GUIDANCE;
    }
    throw err;
  }
}

async function runWithToolTimeout(fn, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return await fn();
  }

  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(fn),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(Object.assign(new Error(`Tool timed out after ${timeoutMs}ms`), {
            name: "ProxmoxError",
            status: 408,
            category: "timeout",
            retryable: true,
          }));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function toToolError(err) {
  const message = err?.message || String(err);
  const status = err?.status;
  const endpoint = err?.endpoint;
  const method = err?.method;

  const isValidation = status === 400;
  const isAuth = status === 401 || status === 403;
  const isNotFound = status === 404;
  const isServerError = typeof status === "number" && status >= 500;
  const isTimeout = err?.category === "timeout" || message.includes("timed out") || message.includes("aborted");
  const isNetwork = message.includes("fetch") || message.includes("connect") || message.includes("ENOTFOUND") || message.includes("ECONN");

  const category = err?.category || (isValidation ? "validation"
    : isAuth ? "authentication"
    : isNotFound ? "not_found"
    : isTimeout ? "timeout"
    : isNetwork ? "network"
    : isServerError ? "server_error"
    : "unknown");

  const defaultGuidance = {
    validation: "Check parameter types and values.",
    authentication: "Verify PROXMOX_TOKEN_ID/PROXMOX_TOKEN_SECRET (or PROXMOX_API_TOKEN) in ~/.config/pi-proxmox/.env. For permission errors, grant the missing privilege to both the API token and its user on the narrowest path that covers the resource (a privilege-separated token gets the intersection of both); see docs/PERMISSIONS.md. Do not switch to a root or full-privilege token.",
    not_found: "The requested resource does not exist. Check IDs and paths.",
    timeout: "The request or tool timed out. The node may be busy or unreachable. Increase PROXMOX_TIMEOUT_MS or PROXMOX_TOOL_TIMEOUT_MS if needed.",
    network: "Cannot connect to the Proxmox host. Verify PROXMOX_HOST and network connectivity.",
    server_error: "The Proxmox node encountered an error. Check node status.",
    unknown: `Unexpected error: ${message}`,
  };

  const retryable = typeof err?.retryable === "boolean"
    ? err.retryable
    : isTimeout || isServerError || isNetwork;

  const errorResponse = {
    error: message,
    category,
    guidance: err?.guidance || defaultGuidance[category] || defaultGuidance.unknown,
    retryable,
  };
  if (endpoint) errorResponse.endpoint = endpoint;
  if (method) errorResponse.method = method;
  if (status) errorResponse.httpStatus = status;

  const wrapped = new Error(JSON.stringify(errorResponse, null, 2));
  wrapped.name = err?.name || "ProxmoxToolError";
  wrapped.category = category;
  wrapped.retryable = retryable;
  wrapped.details = errorResponse;
  wrapped.cause = err;
  if (endpoint) wrapped.endpoint = endpoint;
  if (method) wrapped.method = method;
  if (status) wrapped.status = status;
  return wrapped;
}

export function safeExecute(fn) {
  return async (_toolCallId, params, signal, onUpdate, _ctx) => {
    try {
      throwIfAborted(signal);
      const raw = await runWithToolTimeout(() => fn(params, signal, onUpdate), resolveToolTimeoutMs());
      const hasExtras = raw && typeof raw === "object" && !Array.isArray(raw) && "_data" in raw;
      const result = hasExtras ? raw._data : raw;
      const notes = hasExtras && Array.isArray(raw._notes) ? raw._notes : [];
      const content = [{ type: "text", text: JSON.stringify(result, null, 2) }];
      for (const note of notes) {
        content.push({ type: "text", text: note });
      }
      return { content };
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      throw toToolError(err);
    }
  };
}
