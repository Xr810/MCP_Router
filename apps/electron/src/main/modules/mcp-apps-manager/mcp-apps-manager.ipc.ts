import { ipcMain } from "electron";
import {
  listMcpApps,
  updateAppServerAccess,
  addApp,
  unifyAppConfig,
  deleteCustomApp,
} from "./mcp-apps-manager.service";
import type {
  CreateAppOptions,
  TokenServerAccess,
  TokenToolAccess,
} from "@mcp_router/shared";
import { requireAdminSession } from "@/main/modules/admin/admin.service";

export function setupMcpAppsHandlers(): void {
  ipcMain.handle("mcp-apps:list", async () => {
    try {
      requireAdminSession();
      return await listMcpApps();
    } catch (error) {
      console.error("Failed to list MCP apps:", error);
      return [];
    }
  });

  ipcMain.handle("mcp-apps:delete", async (_, appName: string) => {
    try {
      requireAdminSession();
      return await deleteCustomApp(appName);
    } catch (error) {
      console.error(`Failed to delete custom app ${appName}:`, error);
      return false;
    }
  });

  ipcMain.handle(
    "mcp-apps:add",
    async (_, appName: string, options?: CreateAppOptions) => {
      try {
        requireAdminSession();
        return await addApp(appName, options);
      } catch (error) {
        console.error(`Failed to add MCP config to ${appName}:`, error);
        return {
          success: false,
          message: `Error adding MCP configuration to ${appName}: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  );

  ipcMain.handle(
    "mcp-apps:update-server-access",
    async (
      _,
      appName: string,
      serverAccess: TokenServerAccess,
      toolAccess?: TokenToolAccess,
    ) => {
      try {
        requireAdminSession();
        return await updateAppServerAccess(appName, serverAccess, toolAccess);
      } catch (error) {
        console.error(`Failed to update server access for ${appName}:`, error);
        return {
          success: false,
          message: `Error updating server access for ${appName}: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  );

  ipcMain.handle("mcp-apps:unify", async (_, appName: string) => {
    try {
      requireAdminSession();
      return await unifyAppConfig(appName);
    } catch (error) {
      console.error(`Failed to unify config for ${appName}:`, error);
      return {
        success: false,
        message: `Error unifying configuration for ${appName}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });
}
