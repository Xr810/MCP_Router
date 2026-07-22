import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/renderer/stores/workspace-store";
import { WorkspaceSwitcher } from "./workspace/WorkspaceSwitcher";
import { usePlatformAPI } from "@/renderer/platform-api";
import { JeMark } from "@/renderer/components/brand/JeMark";
import { ThemeToggle } from "@/renderer/components/ThemeToggle";

export function TitleBar() {
  const { loadWorkspaces } = useWorkspaceStore();
  const platformAPI = usePlatformAPI();
  const [platform, setPlatform] = useState<"darwin" | "win32" | "linux">(
    "darwin",
  );

  useEffect(() => {
    // ワークスペース一覧のみ読み込み（現在のワークスペースはApp.tsxで読み込まれる）
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    // プラットフォーム情報の取得
    platformAPI.packages.system.getPlatform().then(setPlatform);
  }, [platformAPI]);

  return (
    <div
      className="h-[50px] fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-background border-b border-border"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* 左側のスペース（macOSのトラフィックライト用） */}
      <div className={platform === "darwin" ? "w-20" : "w-4"} />

      {/* 中央：mark + product — matches example.com header cue */}
      <div className="flex-1 flex items-center justify-center gap-2 text-sm font-medium select-none">
        <JeMark className="h-4 w-5" />
        <span className="text-foreground font-semibold tracking-tight">
          MCP Router
        </span>
        <span className="text-muted-foreground">· MCP Router</span>
      </div>

      {/* 右側：テーマ切替 + ワークスペース */}
      <div
        className={`flex items-center gap-1 ${platform === "win32" ? "pr-[140px]" : "pr-4"}`}
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <ThemeToggle />
        <WorkspaceSwitcher />
      </div>
    </div>
  );
}
