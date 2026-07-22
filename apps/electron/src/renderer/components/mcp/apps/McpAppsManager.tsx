import React, { useEffect, useState, useRef } from "react";
import { Button } from "@mcp_router/ui";
import { usePlatformAPI } from "@/renderer/platform-api";
import { Badge } from "@mcp_router/ui";
import { useTranslation } from "react-i18next";
import { Input } from "@mcp_router/ui";
import { Checkbox } from "@mcp_router/ui";
import { Label } from "@mcp_router/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@mcp_router/ui";
import HowToUse, { HowToUseHandle } from "./HowToUse";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@mcp_router/ui";

import {
  McpApp,
  McpAppsManagerResult,
  TokenServerAccess,
} from "@mcp_router/shared";
import {
  UNASSIGNED_PROJECT_ID,
  useProjectStore,
} from "@/renderer/stores/project-store";

const McpAppsManager: React.FC = () => {
  const { t } = useTranslation();
  const platformAPI = usePlatformAPI();
  const [apps, setApps] = useState<McpApp[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [customAppName, setCustomAppName] = useState<string>("");
  const [servers, setServers] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<McpApp | null>(null);
  const [selectedServerAccess, setSelectedServerAccess] =
    useState<TokenServerAccess>({});
  const [isAccessControlDialogOpen, setIsAccessControlDialogOpen] =
    useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [appToDelete, setAppToDelete] = useState<McpApp | null>(null);
  const { projects, list: listProjects } = useProjectStore();

  // Add ref for HowToUse component
  const howToUseRef = useRef<HowToUseHandle>(null);

  useEffect(() => {
    loadApps();
    loadServers();
  }, []);

  useEffect(() => {
    listProjects();
  }, [listProjects]);

  // アクセス制御ダイアログを開く
  const openAccessControlDialog = (app: McpApp) => {
    setSelectedApp(app);

    // アプリのサーバーアクセスを設定
    const appServerAccess = app.serverAccess || {};
    setSelectedServerAccess({ ...appServerAccess });

    setIsAccessControlDialogOpen(true);
  };

  // サーバーチェックボックスの変更
  const handleServerCheckboxChange = (serverId: string, checked: boolean) => {
    setSelectedServerAccess((prev) => ({
      ...prev,
      [serverId]: checked,
    }));
  };

  const handleProjectCheckboxChange = (projectId: string, checked: boolean) => {
    setSelectedServerAccess((prev) => {
      const next = { ...prev };
      const targetProjectId = projectId || UNASSIGNED_PROJECT_ID;
      const value = !!checked;

      servers.forEach((server) => {
        const serverProjectId =
          server.projectId === null || server.projectId === undefined
            ? UNASSIGNED_PROJECT_ID
            : server.projectId;

        if (serverProjectId === targetProjectId) {
          next[server.id] = value;
        }
      });

      return next;
    });
  };

  // アクセス設定の保存
  const saveAccessControl = async () => {
    if (!selectedApp) return;

    try {
      // サーバーアクセスの更新
      const serverResult = await platformAPI.apps.updateServerAccess(
        selectedApp.name,
        selectedServerAccess,
      );

      if (!serverResult.success) {
        toast.error(serverResult.message);
        return;
      }

      // サーバー結果を更新
      if (serverResult.app) {
        setApps((prevApps) =>
          prevApps.map((app) =>
            app.name === selectedApp.name
              ? { ...serverResult.app!, isCustom: app.isCustom }
              : app,
          ),
        );
      }

      toast.success(t("mcpApps.accessControlSaved"));
    } catch (error: any) {
      console.error(
        `Failed to update access control for ${selectedApp.name}:`,
        error,
      );
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsAccessControlDialogOpen(false);
    }
  };

  // サーバ一覧の読み込み
  const loadServers = async () => {
    try {
      const serverList = await platformAPI.servers.list();
      setServers(serverList);
    } catch (error) {
      console.error("Failed to load MCP servers:", error);
    }
  };

  const loadApps = async () => {
    setLoading(true);
    try {
      const appsList = await platformAPI.apps.list();
      setApps(appsList);
    } catch (error) {
      console.error("Failed to load MCP apps:", error);
      toast.error("Error loading apps");
    } finally {
      setLoading(false);
    }
  };

  // カスタムアプリの追加処理
  const handleAddCustomApp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customAppName.trim()) {
      toast.error(t("mcpApps.enterValidName"));
      return;
    }

    try {
      const result = await platformAPI.apps.create(customAppName);

      if (result.success && result.app) {
        // アプリリストに追加
        setApps((prevApps) => [...prevApps, result.app!]);
        toast.success(result.message);
        setCustomAppName(""); // 入力欄をクリア
        if (result.app.token) {
          openHowToUseModal(result.app);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error("Failed to add custom app:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleAddConfig = async (appName: string) => {
    try {
      const result: McpAppsManagerResult =
        await platformAPI.apps.create(appName);

      if (result.success && result.app) {
        // Update the app in the list
        setApps((prevApps) =>
          prevApps.map((app) => (app.name === appName ? result.app! : app)),
        );
        toast.success(result.message);
        if (result.app.token) {
          openHowToUseModal(result.app);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error(`Failed to add MCP config to ${appName}:`, error);
      toast.error(
        `Error adding MCP configuration to ${appName}: ${error.message}`,
      );
    }
  };

  const getStatusBadge = (app: McpApp) => {
    if (!app.installed) {
      return <Badge variant="outline">{t("mcpApps.notInstalled")}</Badge>;
    }
    if (app.hasOtherServers) {
      return (
        <Badge variant="destructive">{t("mcpApps.multipleConfigs")}</Badge>
      );
    }
    return <Badge variant="secondary">{t("mcpApps.installed")}</Badge>;
  };

  // アプリの設定を統一（他のMCPサーバ設定を削除）
  const handleUnifyConfig = async (appName: string) => {
    try {
      const result: McpAppsManagerResult =
        await platformAPI.apps.unifyConfig(appName);

      if (result.success && result.app) {
        // アプリリストを更新
        setApps((prevApps) =>
          prevApps.map((app) => (app.name === appName ? result.app! : app)),
        );
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error(`Failed to unify config for ${appName}:`, error);
      toast.error(
        `Error unifying configuration for ${appName}: ${error.message}`,
      );
    }
  };

  // Function to open HowToUse modal with the token from the selected app
  const openHowToUseModal = (app: McpApp) => {
    setSelectedApp(app);
    // Wait for token prop to flush onto HowToUse before opening
    queueMicrotask(() => {
      howToUseRef.current?.showDialog();
    });
  };

  // カスタムアプリ削除ダイアログを開く
  const openDeleteDialog = (app: McpApp) => {
    setAppToDelete(app);
    setIsDeleteDialogOpen(true);
  };

  // カスタムアプリ削除実行
  const handleDeleteApp = async () => {
    if (!appToDelete) return;

    try {
      const success = await platformAPI.apps.delete(appToDelete.name);

      if (success) {
        // アプリリストから削除
        setApps((prevApps) =>
          prevApps.filter((app) => app.name !== appToDelete.name),
        );
        toast.success(t("mcpApps.deleteSuccess"));
      } else {
        toast.error(t("mcpApps.deleteFailed"));
      }
    } catch (error: any) {
      console.error(`Failed to delete app ${appToDelete.name}:`, error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsDeleteDialogOpen(false);
      setAppToDelete(null);
    }
  };

  const projectSections = (() => {
    if (!servers || servers.length === 0) return [];

    const projectMap = new Map<string, { id: string; name: string }>();
    projects.forEach((p) => projectMap.set(p.id, { id: p.id, name: p.name }));

    const grouped: Record<
      string,
      { projectId: string; name: string; servers: any[] }
    > = {};

    servers.forEach((server) => {
      const projectId =
        server.projectId === null || server.projectId === undefined
          ? UNASSIGNED_PROJECT_ID
          : server.projectId;

      if (!grouped[projectId]) {
        const project = projectMap.get(projectId);
        grouped[projectId] = {
          projectId,
          name:
            project?.name ||
            (projectId === UNASSIGNED_PROJECT_ID
              ? t("projects.unassigned")
              : projectId),
          servers: [],
        };
      }

      grouped[projectId].servers.push(server);
    });

    return Object.values(grouped).sort((a, b) => {
      if (a.projectId === UNASSIGNED_PROJECT_ID) return -1;
      if (b.projectId === UNASSIGNED_PROJECT_ID) return 1;
      return a.name.localeCompare(b.name);
    });
  })();

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("mcpApps.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("mcpApps.description")}
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="space-y-1 mb-4">
          <h2 className="text-base font-semibold tracking-tight">
            {t("mcpApps.addCustomApp")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("mcpApps.customAppDescription")}
          </p>
        </div>
        <form onSubmit={handleAddCustomApp} className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
              id="customAppName"
              value={customAppName}
              onChange={(e) => setCustomAppName(e.target.value)}
              placeholder={t("mcpApps.enterAppName")}
              className="h-10"
            />
          </div>
          <Button
            type="submit"
            className="h-10 bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-0"
          >
            {t("mcpApps.addCustomApp")}
          </Button>
        </form>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {[...apps]
            .sort((a, b) => {
              const rank = (name: string) =>
                name.toLowerCase() === "hermes" ? 0 : 1;
              return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name);
            })
            .map((app) => {
            return (
              <div
                key={app.name}
                className={
                  app.name.toLowerCase() === "hermes"
                    ? "rounded-lg border border-[#2563eb]/40 bg-card overflow-hidden flex flex-col ring-1 ring-[#2563eb]/15"
                    : "rounded-lg border border-border bg-card overflow-hidden flex flex-col"
                }
              >
                <div className="p-4 pb-3 flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {app.icon && (
                      <div
                        className="w-6 h-6 flex items-center justify-center shrink-0"
                        dangerouslySetInnerHTML={{
                          __html: app.icon.replace(
                            /<svg/g,
                            '<svg style="width: 100%; height: 100%; max-width: 24px; max-height: 24px;"',
                          ),
                        }}
                      />
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold tracking-tight truncate">
                        {app.name}
                      </h3>
                      {app.name.toLowerCase() === "hermes" ? (
                        <p className="text-[11px] text-[#2563eb] font-medium tracking-wide uppercase">
                          Recommended for JE
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">{getStatusBadge(app)}</div>
                </div>
                <div className="px-4 pb-3 flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {app.configured
                      ? t("mcpApps.configured")
                      : app.installed
                        ? t("mcpApps.notConfigured")
                        : t("mcpApps.installRequired")}
                  </p>
                  {app.token ? (
                    <button
                      type="button"
                      className="w-full text-left rounded-md border border-border bg-muted/20 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground truncate hover:text-foreground hover:border-[#2563eb]/40"
                      title={t("mcpApps.copyToken", "Copy token")}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(app.token!);
                          toast.success(
                            t("mcpApps.tokenCopied", "Token copied"),
                          );
                        } catch {
                          toast.error(t("mcpApps.tokenCopyFailed", "Could not copy token"));
                        }
                      }}
                    >
                      {app.token}
                    </button>
                  ) : null}
                </div>
                <div className="px-4 py-3 border-t border-border bg-muted/15 flex gap-2 justify-between flex-wrap">
                  <div className="flex gap-2 flex-wrap">
                    {app.token && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openHowToUseModal(app)}
                      >
                        {t("mcpApps.howToUse")}
                      </Button>
                    )}
                    {app.isCustom && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(app)}
                      >
                        {t("mcpApps.delete")}
                      </Button>
                    )}
                  </div>
                  <div>
                    {!app.configured && !app.token ? (
                      <Button
                        onClick={() => handleAddConfig(app.name)}
                        className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-0"
                      >
                        {app.installed
                          ? t("mcpApps.addMcpConfig")
                          : t("mcpApps.notAvailable")}
                      </Button>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {!app.configured && (
                          <Button
                            onClick={() => handleAddConfig(app.name)}
                            size="sm"
                            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-0"
                          >
                            {t("mcpApps.addMcpConfig")}
                          </Button>
                        )}
                        {app.hasOtherServers && (
                          <Button
                            onClick={() => handleUnifyConfig(app.name)}
                            variant="outline"
                            size="sm"
                          >
                            {t("mcpApps.unify")}
                          </Button>
                        )}
                        {app.token && (
                          <Button
                            onClick={() => openAccessControlDialog(app)}
                            variant="outline"
                            size="sm"
                          >
                            {t("mcpApps.serverAccess")}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* アクセス制御ダイアログ（サーバーアクセスとトークンスコープを統合） */}
      <Dialog
        open={isAccessControlDialogOpen}
        onOpenChange={setIsAccessControlDialogOpen}
      >
        <DialogContent className="max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {t("mcpApps.serverAccess")} - {selectedApp?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Replaced Tabs with direct content */}
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {t("mcpApps.selectServers")}
            </p>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4 pr-2">
                {projectSections.map((section) => {
                  const totalServers = section.servers.length;
                  const selectedCount = section.servers.filter(
                    (server) => selectedServerAccess[server.id] === true,
                  ).length;
                  const allSelected =
                    totalServers > 0 && selectedCount === totalServers;

                  return (
                    <div
                      key={section.projectId}
                      className="space-y-2 border-b last:border-b-0 pb-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`project-${section.projectId}`}
                            checked={allSelected}
                            onCheckedChange={(checked) =>
                              handleProjectCheckboxChange(
                                section.projectId,
                                !!checked,
                              )
                            }
                          />
                          <Label htmlFor={`project-${section.projectId}`}>
                            {section.name}
                          </Label>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {selectedCount}/{totalServers}
                        </span>
                      </div>
                      <div className="space-y-1 pl-6">
                        {section.servers.map((server) => (
                          <div
                            key={server.id}
                            className="flex items-center space-x-3"
                          >
                            <Checkbox
                              id={`server-${server.id}`}
                              checked={selectedServerAccess[server.id] === true}
                              onCheckedChange={(checked) =>
                                handleServerCheckboxChange(server.id, !!checked)
                              }
                            />
                            <Label htmlFor={`server-${server.id}`}>
                              {server.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsAccessControlDialogOpen(false)}
              variant="outline"
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={saveAccessControl}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("mcpApps.confirmDelete")} - {appToDelete?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {t("mcpApps.deleteWarning")}
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              variant="outline"
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleDeleteApp} variant="destructive">
              {t("mcpApps.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="hidden">
        <HowToUse ref={howToUseRef} token={selectedApp?.token} />
      </div>
    </div>
  );
};

export default McpAppsManager;
