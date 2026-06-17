export interface PiToolDefinition {
  name: string;
  label?: string;
  description?: string;
  parameters?: unknown;
  execute?: (...args: any[]) => any;
}

export interface PiExtensionAPI {
  registerTool(tool: PiToolDefinition): void;
}

declare function proxmoxExtension(pi: PiExtensionAPI): Promise<void>;

export default proxmoxExtension;
