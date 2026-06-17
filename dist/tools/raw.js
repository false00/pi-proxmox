import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { Type } from "typebox";
import { emitProgress, safeExecute, throwIfAborted } from "../tool-runtime.js";

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "DELETE"]);

function normalizeApiPath(path) {
  if (!path || typeof path !== "string") {
    throw Object.assign(new Error("path is required"), {
      name: "ProxmoxError",
      status: 400,
      category: "validation",
      guidance: "Provide a Proxmox API path like '/version', '/cluster/resources', or 'nodes/pve1/tasks'.",
      retryable: false,
    });
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    throw Object.assign(new Error("path must be a Proxmox API path, not a full URL"), {
      name: "ProxmoxError",
      status: 400,
      category: "validation",
      guidance: "Use an API path under /api2/json, for example '/version' or '/nodes/pve1/status'.",
      retryable: false,
    });
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function parseJsonObject(input, fieldName, emptyValue = {}) {
  if (!input) return emptyValue;

  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw Object.assign(new Error(`${fieldName} must be valid JSON`), {
      name: "ProxmoxError",
      status: 400,
      category: "validation",
      guidance: `The '${fieldName}' parameter must be a valid JSON object string. Example: '{\"type\":\"vm\"}'`,
      retryable: false,
    });
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw Object.assign(new Error(`${fieldName} must be a JSON object`), {
      name: "ProxmoxError",
      status: 400,
      category: "validation",
      guidance: `The '${fieldName}' parameter must decode to a JSON object, not an array or scalar value.`,
      retryable: false,
    });
  }

  return parsed;
}

function appendFormValue(formData, key, value) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    for (const item of value) appendFormValue(formData, key, item);
    return;
  }
  formData.append(key, String(value));
}

export function apiCall(client) {
  return {
    name: "proxmox_api_call",
    label: "Call Any Proxmox API Endpoint",
    description: "Universal Proxmox REST API tool for any GET, POST, PUT, or DELETE endpoint under /api2/json. Use this when no dedicated proxmox_* tool exists for an official API path.",
    parameters: Type.Object({
      method: Type.String({ description: "HTTP method: GET, POST, PUT, or DELETE" }),
      path: Type.String({ description: "Proxmox API path under /api2/json, absolute or relative. Examples: '/version', '/cluster/resources', 'nodes/pve1/tasks'" }),
      params: Type.Optional(Type.String({ description: "Optional JSON object string for query parameters (GET) or form body fields (POST/PUT/DELETE). Example: '{\"type\":\"vm\"}'" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);

      const method = String(params.method || "").toUpperCase();
      if (!ALLOWED_METHODS.has(method)) {
        throw Object.assign(new Error(`Unsupported method '${params.method}'`), {
          name: "ProxmoxError",
          status: 400,
          category: "validation",
          guidance: "Use one of: GET, POST, PUT, DELETE.",
          retryable: false,
        });
      }

      const path = normalizeApiPath(params.path);
      const queryOrBody = parseJsonObject(params.params, "params", undefined);
      emitProgress(onUpdate, `Calling ${method} ${path}...`);
      return await client.request(method, path, queryOrBody);
    }),
  };
}

export function apiUploadFile(client) {
  return {
    name: "proxmox_api_upload_file",
    label: "Upload File to Any Proxmox API Endpoint",
    description: "Universal multipart upload tool for Proxmox upload endpoints. Reads a local file and POSTs it to any API path under /api2/json with additional multipart form fields.",
    parameters: Type.Object({
      path: Type.String({ description: "Proxmox upload API path under /api2/json, absolute or relative. Example: '/nodes/pve1/storage/local/upload'" }),
      file_path: Type.String({ description: "Local filesystem path to the file that should be uploaded" }),
      file_field: Type.Optional(Type.String({ description: "Multipart field name for the file payload (default: 'filename')" })),
      filename: Type.Optional(Type.String({ description: "Optional remote filename override. Defaults to the basename of file_path." })),
      fields: Type.Optional(Type.String({ description: "Optional JSON object string for extra multipart fields. Example: '{\"content\":\"iso\"}'" })),
    }),
    execute: safeExecute(async (params, signal, onUpdate) => {
      throwIfAborted(signal);

      const path = normalizeApiPath(params.path);
      const extraFields = parseJsonObject(params.fields, "fields", {});
      const fileField = params.file_field || "filename";
      const filename = params.filename || basename(params.file_path);

      emitProgress(onUpdate, `Reading local file ${params.file_path}...`);
      const buffer = await readFile(params.file_path);
      throwIfAborted(signal);

      const formData = new FormData();
      for (const [key, value] of Object.entries(extraFields)) {
        appendFormValue(formData, key, value);
      }
      formData.append(fileField, new Blob([buffer]), filename);

      emitProgress(onUpdate, `Uploading ${filename} to ${path}...`);
      const result = await client.upload(path, formData);

      const output = {
        path,
        file_field: fileField,
        filename,
        size: buffer.byteLength,
      };
      if (typeof result === "string") output.task = result;
      else output.result = result;
      return output;
    }),
  };
}
