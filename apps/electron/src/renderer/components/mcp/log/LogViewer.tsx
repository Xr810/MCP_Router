import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@mcp_router/ui";
import { useWorkspaceStore } from "../../../stores";
import { useActivityData } from "./hooks/useActivityData";
import ActivityHeatmap from "./components/ActivityHeatmap";
import QueryWordCloud from "./components/QueryWordCloud";
import ActivityLog from "./components/ActivityLog";

interface LogViewerProps {
  heatmapDays?: number;
}

const getTodayString = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const LogViewer: React.FC<LogViewerProps> = ({ heatmapDays = 30 }) => {
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspaceStore();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const { heatmapData, wordCloudData, activityItems, loading } = useActivityData(
    {
      heatmapDays,
      selectedDate,
      refreshTrigger,
    },
  );

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (currentWorkspace) {
      handleRefresh();
    }
  }, [currentWorkspace?.id, handleRefresh]);

  return (
    <div className="p-4 flex flex-col h-full gap-4 min-h-0">
      <div className="flex justify-between items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {t("serverDetails.requestLogs", "Request Logs")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tool calls and discoveries persisted in this workspace
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleRefresh}
        >
          {t("logs.viewer.refresh", "Refresh")}
        </Button>
      </div>

      <ActivityHeatmap
        data={heatmapData}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        loading={loading}
        days={heatmapDays}
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        <div className="lg:col-span-1 min-h-0">
          <QueryWordCloud data={wordCloudData} loading={loading} />
        </div>
        <div className="lg:col-span-2 min-h-0">
          <ActivityLog items={activityItems} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
