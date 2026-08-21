/**
 * トークン関連の型定義
 */

/**
 * サーバーアクセス権限のマップ
 */
export type TokenServerAccess = Record<string, boolean>;

/**
 * Per-key tool access: serverId → toolName → allow.
 * Missing `toolAccess` on a token means legacy (all tools allowed on granted servers).
 * An empty object means deny-all tools until the admin grants them.
 */
export type TokenToolAccess = Record<string, Record<string, boolean>>;

export function cloneTokenToolAccess(
  toolAccess?: TokenToolAccess | null,
): TokenToolAccess | undefined {
  if (toolAccess == null) {
    return undefined;
  }
  const next: TokenToolAccess = {};
  for (const [serverId, tools] of Object.entries(toolAccess)) {
    next[serverId] = { ...(tools || {}) };
  }
  return next;
}

export function pruneTokenToolAccess(
  toolAccess: TokenToolAccess | undefined,
  serverAccess: TokenServerAccess,
): TokenToolAccess | undefined {
  if (toolAccess == null) {
    return undefined;
  }
  const next: TokenToolAccess = {};
  for (const [serverId, tools] of Object.entries(toolAccess)) {
    if (serverAccess[serverId] === true) {
      next[serverId] = { ...(tools || {}) };
    }
  }
  return next;
}

/**
 * トークンのインターフェース
 */
export interface Token {
  id: string; // トークンの一意のID
  clientId: string; // 関連付けられたクライアントID
  issuedAt: number; // トークン発行時のUNIXタイムスタンプ
  expiresAt?: number; // トークン失効時刻のUNIXタイムスタンプ
  serverAccess: TokenServerAccess; // サーバーごとのアクセス権（true=許可、false=拒否）
  toolAccess?: TokenToolAccess;
}

/**
 * トークン生成時のオプション
 */
export interface TokenGenerateOptions {
  clientId: string; // クライアントID
  serverAccess: TokenServerAccess; // アクセスを許可するサーバIDマップ
  toolAccess?: TokenToolAccess;
  expiresIn?: number; // トークンの有効期間（秒）、デフォルトは30日
}

/**
 * トークン検証の結果
 */
export interface TokenValidationResult {
  isValid: boolean; // トークンが存在するかどうか
  clientId?: string; // 有効な場合のクライアントID
  error?: string; // エラーメッセージ（存在しない場合）
}
