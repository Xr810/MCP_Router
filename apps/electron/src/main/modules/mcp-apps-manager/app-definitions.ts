import { ClientType } from "@mcp_router/shared";
import { AppPaths } from "./app-paths";

export type StandardAppId =
  | "codex"
  | "claude"
  | "cline"
  | "windsurf"
  | "cursor"
  | "vscode"
  | "hermes";

export type IconKey =
  | "openai"
  | "claude"
  | "cline"
  | "windsurf"
  | "cursor"
  | "vscode"
  | "hermes";

export type AppConfigKind =
  | "standard-json"
  | "vscode-json"
  | "codex"
  | "hermes-yaml";

export interface StandardAppDefinition {
  id: StandardAppId;
  name: string;
  clientType: ClientType;
  iconKey: IconKey;
  configKind: AppConfigKind;
  getConfigPath: (paths: AppPaths) => string;
}

const definitions: StandardAppDefinition[] = [
  {
    id: "codex",
    name: "Codex",
    clientType: "codex",
    iconKey: "openai",
    configKind: "codex",
    getConfigPath: (paths) => paths.codexConfig(),
  },
  {
    id: "claude",
    name: "Claude",
    clientType: "claude",
    iconKey: "claude",
    configKind: "standard-json",
    getConfigPath: (paths) => paths.claudeConfig(),
  },
  {
    id: "cline",
    name: "Cline",
    clientType: "cline",
    iconKey: "cline",
    configKind: "standard-json",
    getConfigPath: (paths) => paths.clineConfig(),
  },
  {
    id: "windsurf",
    name: "Windsurf",
    clientType: "windsurf",
    iconKey: "windsurf",
    configKind: "standard-json",
    getConfigPath: (paths) => paths.windsurfConfig(),
  },
  {
    id: "cursor",
    name: "Cursor",
    clientType: "cursor",
    iconKey: "cursor",
    configKind: "standard-json",
    getConfigPath: (paths) => paths.cursorConfig(),
  },
  {
    id: "vscode",
    name: "VSCode",
    clientType: "vscode",
    iconKey: "vscode",
    configKind: "vscode-json",
    getConfigPath: (paths) => paths.vscodeConfig(),
  },
  {
    id: "hermes",
    name: "Hermes",
    clientType: "hermes",
    iconKey: "hermes",
    configKind: "hermes-yaml",
    getConfigPath: (paths) => paths.hermesConfig(),
  },
];

export const STANDARD_APP_DEFINITIONS: readonly StandardAppDefinition[] =
  Object.freeze(definitions);

export function findStandardAppDefinition(
  name: string,
): StandardAppDefinition | undefined {
  const normalized = name.toLowerCase();
  return definitions.find(
    (definition) =>
      definition.id === normalized ||
      definition.name.toLowerCase() === normalized,
  );
}

export function getStandardAppIds(): string[] {
  return definitions.map((definition) => definition.id);
}
