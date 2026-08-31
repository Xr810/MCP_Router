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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mcp_router/ui";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@mcp_router/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcp_router/ui";
import { ChevronDown } from "lucide-react";
import {
  McpApp,
  McpAppsManagerResult,
  MCPTool,
  TokenServerAccess,
  TokenToolAccess,
  cloneTokenToolAccess,
  TOKEN_TTL_SECONDS,
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
  const [expiryPreset, setExpiryPreset] = useState<string>("30d");
  const [customExpiryDays, setCustomExpiryDays] = useState<string>("14");
  const [servers, setServers] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<McpApp | null>(null);
  const [selectedServerAccess, setSelectedServerAccess] =
    useState<TokenServerAccess>({});
  const [selectedToolAccess, setSelectedToolAccess] = useState<TokenToolAccess>(
    {},
  );
  const [legacyToolAccess, setLegacyToolAccess] = useState(false);
  const [serverTools, setServerTools] = useState<Record<string, MCPTool[]>>({});
  const [serverToolStatus, setServerToolStatus] = useState<
    Record<string, "loading" | "ready" | "not-running" | "error">
  >({});
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

  const selectedServerAccessRef = useRef(selectedServerAccess);
  selectedServerAccessRef.current = selectedServerAccess;
  const selectedToolAccessRef = useRef(selectedToolAccess);
  selectedToolAccessRef.current = selectedToolAccess;

  const mergeKnownTools = (
    server: any,
    listed: MCPTool[] | undefined,
  ): MCPTool[] => {
    const byName = new Map<string, MCPTool>();
    const add = (tool: MCPTool | undefined) => {
      if (!tool?.name || byName.has(tool.name)) {
        return;
      }
      byName.set(tool.name, {
        name: tool.name,
        description: tool.description,
        enabled: tool.enabled !== false,
      });
    };

    (listed || []).forEach(add);
    (server.cachedTools || []).forEach(add);
    (server.tools || []).forEach(add);
    Object.entries(selectedToolAccessRef.current[server.id] || {}).forEach(
      ([name, allowed]) => {
        if (allowed) {
          add({ name, enabled: true });
        }
      },
    );

    return [...byName.values()];
  };

  useEffect(() => {
    if (!isAccessControlDialogOpen || servers.length === 0) {
      return;
    }

    let cancelled = false;

    const loadTools = async () => {
      const nextTools: Record<string, MCPTool[]> = {};
      const nextStatus: Record<
        string,
        "loading" | "ready" | "not-running" | "error"
      > = {};

      servers.forEach((server) => {
        nextStatus[server.id] = "loading";
      });
      setServerToolStatus({ ...nextStatus });

      await Promise.all(
        servers.map(async (server) => {
          try {
            const tools = await platformAPI.servers.listTools(server.id);
            if (cancelled) {
              return;
            }
            nextTools[server.id] = mergeKnownTools(server, tools);
            nextStatus[server.id] = "ready";
          } catch (error) {
            if (cancelled) {
              return;
            }
            const rawMessage =
              error instanceof Error ? error.message : String(error);
            const fallback = mergeKnownTools(server, undefined);
            if (fallback.length > 0) {
              nextTools[server.id] = fallback;
              nextStatus[server.id] = "ready";
              return;
            }
            nextStatus[server.id] = /must be running/i.test(rawMessage)
              ? "not-running"
              : "error";
          }
        }),
      );

      if (cancelled) {
        return;
      }

      setServerTools(nextTools);
      setServerToolStatus({ ...nextStatus });

      if (legacyToolAccess) {
        const currentServerAccess = selectedServerAccessRef.current;
        setSelectedToolAccess((prev) => {
          const next = { ...prev };
          Object.entries(nextTools).forEach(([serverId, tools]) => {
            if (currentServerAccess[serverId] !== true) {
              return;
            }
            next[serverId] = { ...(next[serverId] || {}) };
            tools.forEach((tool) => {
              if (next[serverId][tool.name] === undefined) {
                next[serverId][tool.name] = tool.enabled !== false;
              }
            });
          });
          return next;
        });
      }
    };

    void loadTools();

    return () => {
      cancelled = true;
    };
  }, [isAccessControlDialogOpen, servers, legacyToolAccess]);

  // アクセス制御ダイアログを開く
  const openAccessControlDialog = (app: McpApp) => {
    setSelectedApp(app);

    const appServerAccess = app.serverAccess || {};
    setSelectedServerAccess({ ...appServerAccess });
    setSelectedToolAccess(cloneTokenToolAccess(app.toolAccess) || {});
    setLegacyToolAccess(app.toolAccess == null);
    setServerTools({});
    setServerToolStatus({});

    setIsAccessControlDialogOpen(true);
  };

  const clearToolsForServers = (
    prev: TokenToolAccess,
    serverIds: string[],
  ): TokenToolAccess => {
    const next = { ...prev };
    serverIds.forEach((serverId) => {
      delete next[serverId];
    });
    return next;
  };

  const handleServerCheckboxChange = (serverId: string, checked: boolean) => {
    setSelectedServerAccess((prev) => ({
      ...prev,
      [serverId]: checked,
    }));
    if (!checked) {
      setSelectedToolAccess((prev) => clearToolsForServers(prev, [serverId]));
    }
  };

  const handleProjectCheckboxChange = (projectId: string, checked: boolean) => {
    const targetProjectId = projectId || UNASSIGNED_PROJECT_ID;
    const affectedIds = servers
      .filter((server) => {
        const serverProjectId =
          server.projectId === null || server.projectId === undefined
            ? UNASSIGNED_PROJECT_ID
            : server.projectId;
        return serverProjectId === targetProjectId;
      })
      .map((server) => server.id);

    setSelectedServerAccess((prev) => {
      const next = { ...prev };
      affectedIds.forEach((id) => {
        next[id] = !!checked;
      });
      return next;
    });

    if (!checked) {
      setSelectedToolAccess((prev) => clearToolsForServers(prev, affectedIds));
    }
  };

  const handleToolCheckboxChange = (
    serverId: string,
    toolName: string,
    checked: boolean,
  ) => {
    setSelectedToolAccess((prev) => ({
      ...prev,
      [serverId]: {
        ...(prev[serverId] || {}),
        [toolName]: checked,
      },
    }));
  };

  const handleServerToolsCheckboxChange = (
    serverId: string,
    tools: MCPTool[],
    checked: boolean,
  ) => {
    setSelectedToolAccess((prev) => {
      const nextTools = { ...(prev[serverId] || {}) };
      tools.forEach((tool) => {
        if (tool.enabled === false) {
          return;
        }
        nextTools[tool.name] = checked;
      });
      return {
        ...prev,
        [serverId]: nextTools,
      };
    });
  };

  const saveAccessControl = async () => {
    if (!selectedApp) return;

    try {
      const serverResult = await platformAPI.apps.updateServerAccess(
        selectedApp.name,
        selectedServerAccess,
        selectedToolAccess,
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

  const resolveExpiresIn = (): number | null | undefined => {
    switch (expiryPreset) {
      case "1d":
        return TOKEN_TTL_SECONDS.oneDay;
      case "7d":
        return TOKEN_TTL_SECONDS.oneWeek;
      case "30d":
        return TOKEN_TTL_SECONDS.thirtyDays;
      case "90d":
        return TOKEN_TTL_SECONDS.ninetyDays;
      case "never":
        return null;
      case "custom": {
        const days = Number(customExpiryDays);
        if (!Number.isInteger(days) || days < 1) {
          return undefined;
        }
        return days * TOKEN_TTL_SECONDS.oneDay;
      }
      default:
        return TOKEN_TTL_SECONDS.thirtyDays;
    }
  };

  const formatExpiry = (expiresAt?: number) => {
    if (typeof expiresAt !== "number") {
      return t("mcpApps.neverExpires");
    }
    const now = Math.floor(Date.now() / 1000);
    if (expiresAt <= now) {
      return t("mcpApps.expired");
    }
    return new Date(expiresAt * 1000).toLocaleString();
  };

  // カスタムアプリの追加処理
  const handleAddCustomApp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customAppName.trim()) {
      toast.error(t("mcpApps.enterValidName"));
      return;
    }

    const expiresIn = resolveExpiresIn();
    if (expiresIn === undefined) {
      toast.error(t("mcpApps.invalidCustomExpiry"));
      return;
    }

    try {
      const result = await platformAPI.apps.create(customAppName, {
        expiresIn,
      });

      if (result.success && result.app) {
        setApps((prevApps) => [...prevApps, result.app!]);
        toast.success(t("mcpApps.keyIssued"));
        setCustomAppName("");
        openAccessControlDialog(result.app);
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
          openAccessControlDialog(result.app);
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

  const issuedKeys = apps.filter((app) => !!app.token);
  const localApps = apps.filter((app) => !app.token && !app.isCustom);

  const maskToken = (token: string) => {
    if (token.length <= 12) {
      return token;
    }
    return `${token.slice(0, 10)}…${token.slice(-4)}`;
  };

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success(t("mcpApps.tokenCopied"));
    } catch {
      toast.error(t("mcpApps.tokenCopyFailed"));
    }
  };

  const describeAccess = (app: McpApp) => {
    const granted = servers.filter(
      (server) => app.serverAccess?.[server.id] === true,
    );
    if (granted.length === 0) {
      return t("mcpApps.noAccess");
    }
    const toolCount = granted.reduce((count, server) => {
      const tools = app.toolAccess?.[server.id] || {};
      return count + Object.values(tools).filter(Boolean).length;
    }, 0);
    if (app.toolAccess == null) {
      return t("mcpApps.accessSummaryLegacy", { servers: granted.length });
    }
    return t("mcpApps.accessSummary", {
      servers: granted.length,
      tools: toolCount,
    });
  };

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
          <div className="w-[160px]">
            <Select value={expiryPreset} onValueChange={setExpiryPreset}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("mcpApps.expiry")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">{t("mcpApps.expiry1d")}</SelectItem>
                <SelectItem value="7d">{t("mcpApps.expiry7d")}</SelectItem>
                <SelectItem value="30d">{t("mcpApps.expiry30d")}</SelectItem>
                <SelectItem value="90d">{t("mcpApps.expiry90d")}</SelectItem>
                <SelectItem value="custom">
                  {t("mcpApps.expiryCustom")}
                </SelectItem>
                <SelectItem value="never">
                  {t("mcpApps.expiryNever")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {expiryPreset === "custom" ? (
            <div className="w-[110px]">
              <Input
                type="number"
                min={1}
                value={customExpiryDays}
                onChange={(e) => setCustomExpiryDays(e.target.value)}
                placeholder={t("mcpApps.expiryDays")}
                className="h-10"
              />
            </div>
          ) : null}
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
        <>
          <section className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-base font-semibold tracking-tight">
                {t("mcpApps.keyList")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("mcpApps.keyListDescription")}
              </p>
            </div>
            {issuedKeys.length === 0 ? (
              <div className="px-4 py-10 text-sm text-muted-foreground text-center">
                {t("mcpApps.noKeys")}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("mcpApps.columnName")}</TableHead>
                    <TableHead>{t("mcpApps.columnToken")}</TableHead>
                    <TableHead>{t("mcpApps.columnAccess")}</TableHead>
                    <TableHead>{t("mcpApps.columnExpiry")}</TableHead>
                    <TableHead className="text-right">
                      {t("mcpApps.columnActions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...issuedKeys]
                    .sort((a, b) => {
                      const rank = (name: string) =>
                        name.toLowerCase() === "hermes" ? 0 : 1;
                      return (
                        rank(a.name) - rank(b.name) ||
                        a.name.localeCompare(b.name)
                      );
                    })
                    .map((app) => (
                      <TableRow key={app.name}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2 min-w-0">
                            {app.icon ? (
                              <div
                                className="w-5 h-5 shrink-0"
                                dangerouslySetInnerHTML={{
                                  __html: app.icon.replace(
                                    /<svg/g,
                                    '<svg style="width: 100%; height: 100%; max-width: 20px; max-height: 20px;"',
                                  ),
                                }}
                              />
                            ) : null}
                            <span className="truncate">{app.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            className="max-w-[220px] text-left rounded-md border border-border bg-muted/20 px-2 py-1 font-mono text-[11px] text-muted-foreground truncate hover:text-foreground hover:border-[#2563eb]/40"
                            title={t("mcpApps.copyToken")}
                            onClick={() => copyToken(app.token!)}
                          >
                            {maskToken(app.token!)}
                          </button>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {describeAccess(app)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatExpiry(app.expiresAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAccessControlDialog(app)}
                            >
                              {t("mcpApps.serverAccess")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openHowToUseModal(app)}
                            >
                              {t("mcpApps.howToUse")}
                            </Button>
                            {app.isCustom ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openDeleteDialog(app)}
                              >
                                {t("mcpApps.delete")}
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </section>

          {localApps.length > 0 ? (
            <Collapsible className="rounded-lg border border-border bg-card">
              <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    {t("mcpApps.localApps")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("mcpApps.localAppsDescription")}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 p-4 pt-0">
                  {localApps.map((app) => (
                    <div
                      key={app.name}
                      className="rounded-lg border border-border bg-background overflow-hidden flex flex-col"
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
                          <h3 className="text-sm font-semibold tracking-tight truncate">
                            {app.name}
                          </h3>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {getStatusBadge(app)}
                        </div>
                      </div>
                      <div className="px-4 pb-3 flex-1">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {app.installed
                            ? t("mcpApps.notConfigured")
                            : t("mcpApps.installRequired")}
                        </p>
                      </div>
                      <div className="px-4 py-3 border-t border-border bg-muted/15 flex gap-2 justify-end">
                        <Button
                          onClick={() => handleAddConfig(app.name)}
                          size="sm"
                          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-0"
                          disabled={!app.installed}
                        >
                          {app.installed
                            ? t("mcpApps.addMcpConfig")
                            : t("mcpApps.notAvailable")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </>
      )}

      {/* アクセス制御ダイアログ（サーバーアクセスとトークンスコープを統合） */}
      <Dialog
        open={isAccessControlDialogOpen}
        onOpenChange={setIsAccessControlDialogOpen}
      >
        <DialogContent className="max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {t("mcpApps.serverAccess")} - {selectedApp?.name}
            </DialogTitle>
          </DialogHeader>

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
                      <div className="space-y-3 pl-6">
                        {section.servers.map((server) => {
                          const serverEnabled =
                            selectedServerAccess[server.id] === true;
                          const tools = serverTools[server.id] || [];
                          const grantableTools = tools.filter(
                            (tool) => tool.enabled !== false,
                          );
                          const selectedToolCount = grantableTools.filter(
                            (tool) =>
                              selectedToolAccess[server.id]?.[tool.name] ===
                              true,
                          ).length;
                          const allToolsSelected =
                            grantableTools.length > 0 &&
                            selectedToolCount === grantableTools.length;
                          const toolStatus =
                            serverToolStatus[server.id] || "loading";
                          const usingCachedTools =
                            toolStatus === "ready" &&
                            server.status !== "running";

                          return (
                            <div key={server.id} className="space-y-1">
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  id={`server-${server.id}`}
                                  checked={serverEnabled}
                                  onCheckedChange={(checked) =>
                                    handleServerCheckboxChange(
                                      server.id,
                                      !!checked,
                                    )
                                  }
                                />
                                <Label htmlFor={`server-${server.id}`}>
                                  {server.name}
                                </Label>
                              </div>
                              {serverEnabled && (
                                <div className="space-y-1 pl-6">
                                  {toolStatus === "loading" && (
                                    <p className="text-xs text-muted-foreground">
                                      {t("mcpApps.loadingTools")}
                                    </p>
                                  )}
                                  {toolStatus === "not-running" && (
                                    <p className="text-xs text-muted-foreground">
                                      {t("mcpApps.toolsNeedServerRunning")}
                                    </p>
                                  )}
                                  {toolStatus === "error" && (
                                    <p className="text-xs text-muted-foreground">
                                      {t("mcpApps.toolsLoadFailed")}
                                    </p>
                                  )}
                                  {toolStatus === "ready" &&
                                    grantableTools.length === 0 && (
                                      <p className="text-xs text-muted-foreground">
                                        {t("mcpApps.noTools")}
                                      </p>
                                    )}
                                  {toolStatus === "ready" &&
                                    grantableTools.length > 0 && (
                                      <>
                                        {usingCachedTools && (
                                          <p className="text-xs text-muted-foreground">
                                            {t("mcpApps.toolsFromCache")}
                                          </p>
                                        )}
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`tools-all-${server.id}`}
                                            checked={allToolsSelected}
                                            onCheckedChange={(checked) =>
                                              handleServerToolsCheckboxChange(
                                                server.id,
                                                grantableTools,
                                                !!checked,
                                              )
                                            }
                                          />
                                          <Label
                                            htmlFor={`tools-all-${server.id}`}
                                            className="text-xs text-muted-foreground"
                                          >
                                            {t("mcpApps.allTools")} (
                                            {selectedToolCount}/
                                            {grantableTools.length})
                                          </Label>
                                        </div>
                                        {grantableTools.map((tool) => (
                                          <div
                                            key={tool.name}
                                            className="flex items-center space-x-2"
                                          >
                                            <Checkbox
                                              id={`tool-${server.id}-${tool.name}`}
                                              checked={
                                                selectedToolAccess[server.id]?.[
                                                  tool.name
                                                ] === true
                                              }
                                              onCheckedChange={(checked) =>
                                                handleToolCheckboxChange(
                                                  server.id,
                                                  tool.name,
                                                  !!checked,
                                                )
                                              }
                                            />
                                            <Label
                                              htmlFor={`tool-${server.id}-${tool.name}`}
                                              className="text-xs font-normal"
                                            >
                                              {tool.name}
                                            </Label>
                                          </div>
                                        ))}
                                      </>
                                    )}
                                </div>
                              )}
                            </div>
                          );
                        })}
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
