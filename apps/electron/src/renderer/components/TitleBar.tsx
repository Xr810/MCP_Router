import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { Button } from "@mcp_router/ui";
import { useWorkspaceStore } from "@/renderer/stores/workspace-store";
import { usePlatformAPI } from "@/renderer/platform-api";
import { BrandLogo } from "@/renderer/components/brand/BrandLogo";
import { branding } from "@/branding";
import { ThemeToggle } from "@/renderer/components/ThemeToggle";
import { AccountControl } from "@/renderer/components/workspace/AccountControl";

export function TitleBar() {
  const { loadWorkspaces } = useWorkspaceStore();
  const platformAPI = usePlatformAPI();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<"darwin" | "win32" | "linux">(
    "darwin",
  );

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    platformAPI.packages.system.getPlatform().then(setPlatform);
  }, [platformAPI]);

  return (
    <div
      className="h-[50px] fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-background border-b border-border"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className={platform === "darwin" ? "w-20" : "w-4"} />

      {/* Wordmark from branding.config.json */}
      <div className="flex-1 flex items-center justify-center min-w-0 px-2">
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo className="h-5 max-w-[11rem] sm:max-w-[14rem]" />
          <span className="hidden sm:inline text-[11px] uppercase tracking-[0.18em] text-muted-foreground border-l border-border pl-3 shrink-0">
            {branding.appName}
          </span>
        </div>
      </div>

      <div
        className={`flex items-center gap-0.5 ${platform === "win32" ? "pr-[140px]" : "pr-3"}`}
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigate("/settings")}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <AccountControl />
      </div>
    </div>
  );
}
