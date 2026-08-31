/**
 * Local desktop admin lock for the Electron UI.
 * Separate from optional cloud OAuth. HTTP /mcp is unaffected.
 */

export interface AdminStatus {
  configured: boolean;
  unlocked: boolean;
  username?: string;
}

export interface AdminAPI {
  getStatus(): Promise<AdminStatus>;
  setup(username: string, password: string): Promise<AdminStatus>;
  unlock(username: string, password: string): Promise<AdminStatus>;
  lock(): Promise<AdminStatus>;
  changePassword(
    currentPassword: string,
    nextPassword: string,
  ): Promise<AdminStatus>;
}
