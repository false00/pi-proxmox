export function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted", "AbortError");
  }
}

export function emitProgress(onUpdate, msg) {
  if (typeof onUpdate === "function") {
    try {
      onUpdate({ type: "progress", message: msg });
    } catch { /* noop */ }
  }
}

export async function execOnNode(client, node, command, onUpdate) {
  const endpoint = `/nodes/${node}/execute`;
  try {
    return await client.post(endpoint, { command });
  } catch (err) {
    if (err.message?.includes("Permission check failed") && client.password) {
      emitProgress(onUpdate, "API token lacks /execute permission — falling back to password-based ticket auth...");
      try {
        return await client.postWithTicketAuth(endpoint, { command });
      } catch (ticketErr) {
        emitProgress(onUpdate, "Ticket auth also failed — attempting SSH fallback...");
      }
    } else {
      emitProgress(onUpdate, "API rejected the command parameter — attempting SSH fallback...");
    }
    return await client.execViaSSH(client.host, 22, command);
  }
}

export function safeExecute(fn) {
  return async (_toolCallId, params, signal, onUpdate, _ctx) => {
    try {
      throwIfAborted(signal);
      const raw = await fn(params, signal, onUpdate);
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

      const message = err?.message || String(err);
      const status = err?.status;
      const isValidation = status === 400;
      const isAuth = status === 401 || status === 403;
      const isNotFound = status === 404;
      const isServerError = status >= 500;
      const isTimeout = message.includes("timed out") || message.includes("aborted");
      const isNetwork = message.includes("fetch") || message.includes("connect") || message.includes("ENOTFOUND") || message.includes("ECONN");

      const category = isValidation ? "validation"
        : isAuth ? "authentication"
        : isNotFound ? "not_found"
        : isTimeout ? "timeout"
        : isNetwork ? "network"
        : isServerError ? "server_error"
        : "unknown";

      const guidance = {
        validation: "Check parameter types and values.",
        authentication: "Verify PROXMOX_TOKEN_ID and PROXMOX_TOKEN_SECRET in ~/.config/pi-proxmox/.env",
        not_found: "The requested resource does not exist. Check IDs and paths.",
        timeout: "The request timed out. The node may be busy or unreachable.",
        network: "Cannot connect to the Proxmox host. Verify PROXMOX_HOST and network connectivity.",
        server_error: "The Proxmox node encountered an error. Check node status.",
        unknown: `Unexpected error: ${message}`,
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: message,
            category,
            guidance: guidance[category] || guidance.unknown,
            retryable: isTimeout || isServerError || isNetwork,
          }, null, 2),
        }],
      };
    }
  };
}
