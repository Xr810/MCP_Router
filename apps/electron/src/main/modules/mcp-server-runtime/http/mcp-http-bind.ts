import type { AppSettings } from "@mcp_router/shared";

export const DEFAULT_MCP_HTTP_PORT = 3282;
export const LOCAL_MCP_HTTP_HOST = "127.0.0.1";
export const REMOTE_MCP_HTTP_HOST = "0.0.0.0";
export const DEFAULT_LOCAL_MCP_URL = "http://localhost:3282/mcp";

export type McpHttpBindConfig = {
  host: string;
  port: number;
  remoteAccessEnabled: boolean;
};

/**
 * Resolve MCP HTTP bind host/port from settings + env overrides.
 * Env wins: MCPR_HTTP_HOST, MCPR_HTTP_PORT.
 */
export function resolveMcpHttpBind(
  settings: Pick<
    AppSettings,
    "mcpRemoteAccessEnabled" | "mcpHttpHost" | "mcpHttpPort"
  >,
): McpHttpBindConfig {
  const remoteAccessEnabled = settings.mcpRemoteAccessEnabled === true;

  const envHost = process.env.MCPR_HTTP_HOST?.trim();
  const envPortRaw = process.env.MCPR_HTTP_PORT?.trim();

  const host =
    envHost ||
    (remoteAccessEnabled
      ? settings.mcpHttpHost?.trim() || REMOTE_MCP_HTTP_HOST
      : LOCAL_MCP_HTTP_HOST);

  let port = settings.mcpHttpPort ?? DEFAULT_MCP_HTTP_PORT;
  if (envPortRaw) {
    const parsed = Number(envPortRaw);
    if (Number.isFinite(parsed) && parsed > 0 && parsed < 65536) {
      port = parsed;
    }
  }

  return { host, port, remoteAccessEnabled };
}

/**
 * Public MCP URL for Hermes (and remote CLI). Empty when unset.
 * Env override: MCPR_GATEWAY_PUBLIC_URL
 */
export function resolveMcpGatewayPublicUrl(
  settings: Pick<AppSettings, "mcpGatewayPublicUrl">,
): string {
  const fromEnv = process.env.MCPR_GATEWAY_PUBLIC_URL?.trim();
  if (fromEnv) {
    return normalizeMcpGatewayUrl(fromEnv);
  }
  const fromSettings = settings.mcpGatewayPublicUrl?.trim();
  if (!fromSettings) {
    return "";
  }
  return normalizeMcpGatewayUrl(fromSettings);
}

export function normalizeMcpGatewayUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  const candidate = trimmed.includes("://") ? trimmed : `http://${trimmed}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return trimmed;
  }

  if (url.pathname === "/" || url.pathname === "") {
    url.pathname = "/mcp";
  }
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString().replace(/\/$/, "");
}
