import type { Theme } from "./ui";
import type { CloudSyncState } from "./cloud-sync";
import type { SubscriptionStatus } from "./auth";

/**
 * アプリケーション設定のインターフェース
 */
export interface AppSettings {
  /**
   * ユーザーID
   */
  userId?: string;

  /**
   * 認証トークン
   */
  authToken?: string;

  /**
   * ログイン日時
   */
  loggedInAt?: string;

  /**
   * サブスクリプションステータス
   */
  subscriptionStatus?: SubscriptionStatus | null;

  /**
   * プラン名
   */
  planName?: string | null;

  /**
   * パッケージマネージャーオーバーレイの表示回数
   */
  packageManagerOverlayDisplayCount?: number;

  /**
   * 外部アプリケーションからのMCP設定の読み込みを有効化するか
   * デフォルト: true
   */
  loadExternalMCPConfigs?: boolean;

  /**
   * アナリティクスの送信を有効化するか
   * デフォルト: true
   */
  analyticsEnabled?: boolean;

  /**
   * 自動アップデートを有効化するか
   * デフォルト: true
   */
  autoUpdateEnabled?: boolean;

  /**
   * OS起動時にアプリのメインウィンドウを表示するか
   * デフォルト: true
   */
  showWindowOnStartup?: boolean;

  /**
   * アプリケーションのテーマ設定
   * デフォルト: "system"
   */
  theme?: Theme;

  /**
   * Cloud Syncの状態
   */
  cloudSync?: CloudSyncState;

  /**
   * JE / Azure: allow remote MCP clients (Hermes) to reach the aggregator.
   * When true, HTTP server binds to mcpHttpHost (default 0.0.0.0).
   * Default: false (localhost only — Cursor/Claude unchanged).
   */
  mcpRemoteAccessEnabled?: boolean;

  /**
   * MCP HTTP bind host. Used when mcpRemoteAccessEnabled is true.
   * Override with env MCPR_HTTP_HOST.
   * Default: "0.0.0.0"
   */
  mcpHttpHost?: string;

  /**
   * MCP HTTP bind port.
   * Override with env MCPR_HTTP_PORT.
   * Default: 3282
   */
  mcpHttpPort?: number;

  /**
   * Public URL Hermes should use (e.g. https://HOST:3282/mcp).
   * Written into Hermes config when set. Does not change Cursor/Claude local configs.
   */
  mcpGatewayPublicUrl?: string;
}

/**
 * デフォルトのアプリケーション設定
 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  userId: "",
  authToken: "",
  loggedInAt: "",
  subscriptionStatus: null,
  planName: null,
  packageManagerOverlayDisplayCount: 0,
  loadExternalMCPConfigs: true,
  analyticsEnabled: false,
  autoUpdateEnabled: true,
  showWindowOnStartup: true,
  // corporate site is light-first; default the product to light
  theme: "light",
  cloudSync: {
    enabled: false,
  },
  mcpRemoteAccessEnabled: false,
  mcpHttpHost: "0.0.0.0",
  mcpHttpPort: 3282,
  mcpGatewayPublicUrl: "",
};
