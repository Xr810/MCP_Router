import { ipcMain } from "electron";
import {
  changeAdminPassword,
  getAdminStatus,
  lockAdmin,
  setupAdmin,
  unlockAdmin,
} from "./admin.service";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function setupAdminHandlers(): void {
  ipcMain.handle("admin:status", () => getAdminStatus());

  ipcMain.handle(
    "admin:setup",
    async (_event, username: string, password: string) => {
      try {
        return await setupAdmin(username, password);
      } catch (error) {
        throw new Error(toErrorMessage(error));
      }
    },
  );

  ipcMain.handle(
    "admin:unlock",
    async (_event, username: string, password: string) => {
      try {
        return await unlockAdmin(username, password);
      } catch (error) {
        throw new Error(toErrorMessage(error));
      }
    },
  );

  ipcMain.handle("admin:lock", () => lockAdmin());

  ipcMain.handle(
    "admin:change-password",
    async (_event, currentPassword: string, nextPassword: string) => {
      try {
        return await changeAdminPassword(currentPassword, nextPassword);
      } catch (error) {
        throw new Error(toErrorMessage(error));
      }
    },
  );
}
