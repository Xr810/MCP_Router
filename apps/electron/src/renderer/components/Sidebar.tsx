import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  IconSettings,
  IconServer,
  IconActivity,
  IconKey,
  IconDownload,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useWorkspaceStore } from "@/renderer/stores";
import { usePlatformAPI } from "@/renderer/platform-api";
import { JeLogo } from "@/renderer/components/brand/JeLogo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@mcp_router/ui";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@mcp_router/ui";

const SidebarComponent: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const isRemoteWorkspace = currentWorkspace?.type === "remote";
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const platformAPI = usePlatformAPI();

  useEffect(() => {
    // Check if an update is available on mount
    platformAPI.packages.system
      .checkForUpdates()
      .then(({ updateAvailable }) => {
        setUpdateAvailable(updateAvailable);
      });

    // Listen for future update availability
    const unsubscribe = platformAPI.packages.system.onUpdateAvailable(
      (available) => {
        setUpdateAvailable(available);
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleInstallUpdate = () => {
    platformAPI.packages.system.installUpdate();
  };

  return (
    <Sidebar>
      <div className="pt-[50px]" />
      <SidebarHeader>
        <Link
          to="/servers"
          className="flex flex-col gap-1 no-underline px-2 py-2 hover:opacity-90"
        >
          <JeLogo className="h-8 w-auto max-w-[168px]" />
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            MCP Router
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {/* MCP Group */}
          <Collapsible defaultOpen className="group/collapsible-mcp">
            <SidebarGroup>
              <SidebarGroupLabel>
                <CollapsibleTrigger className="flex flex-row items-center w-full">
                  MCP
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible-mcp:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip={t("serverList.title")}
                      isActive={location.pathname === "/servers"}
                    >
                      <Link
                        to="/servers"
                        className="flex items-center gap-3 py-5 px-3 w-full"
                      >
                        <IconServer className="h-6 w-6" />
                        <span className="text-base">
                          {t("serverList.title")}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip={t("mcpApps.title")}
                      isActive={location.pathname === "/clients"}
                    >
                      <Link
                        to="/clients"
                        className="flex items-center gap-3 py-5 px-3 w-full"
                      >
                        <IconKey className="h-6 w-6" />
                        <span className="text-base">{t("mcpApps.title")}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {!isRemoteWorkspace && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip={t("serverDetails.requestLogs")}
                        isActive={location.pathname === "/logs"}
                      >
                        <Link
                          to="/logs"
                          className="flex items-center gap-3 py-5 px-3 w-full"
                        >
                          <IconActivity className="h-6 w-6" />
                          <span className="text-base">
                            {t("serverDetails.requestLogs")}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* Skills / agent paths kept as routes but hidden from nav */}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {updateAvailable && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t("updateNotification.installNow")}
              >
                <Link
                  to="#"
                  onClick={handleInstallUpdate}
                  className="flex items-center gap-3 py-5 px-3 w-full"
                >
                  <div className="relative">
                    <IconDownload className="h-6 w-6" />
                    <span className="absolute w-2 h-2 bg-red-500 rounded-full top-0 right-0"></span>
                  </div>
                  <span className="text-base">
                    {t("updateNotification.title")}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={t("common.settings")}
              isActive={location.pathname === "/settings"}
            >
              <Link
                to="/settings"
                className="flex items-center gap-3 py-5 px-3 w-full"
              >
                <IconSettings className="h-6 w-6" />
                <span className="text-base">{t("common.settings")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarComponent;
