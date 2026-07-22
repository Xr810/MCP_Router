import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { WordCloudItem } from "@mcp_router/shared";

interface QueryWordCloudProps {
  data: WordCloudItem[];
  loading?: boolean;
  maxWords?: number;
}

const getFontSize = (value: number, maxValue: number): string => {
  if (maxValue === 0) return "text-xs";

  const ratio = value / maxValue;
  if (ratio >= 0.8) return "text-base font-semibold";
  if (ratio >= 0.6) return "text-sm font-medium";
  if (ratio >= 0.4) return "text-sm";
  return "text-xs";
};

const getWordColor = (value: number, maxValue: number): string => {
  if (maxValue === 0) return "text-muted-foreground";

  const ratio = value / maxValue;
  if (ratio >= 0.8) return "text-[#2563eb]";
  if (ratio >= 0.6) return "text-[#2563eb]/80";
  if (ratio >= 0.4) return "text-foreground/80";
  return "text-muted-foreground";
};

const QueryWordCloud: React.FC<QueryWordCloudProps> = ({
  data,
  loading = false,
  maxWords = 30,
}) => {
  const { t } = useTranslation();

  const displayData = useMemo(() => data.slice(0, maxWords), [data, maxWords]);

  const maxValue = useMemo(() => {
    return displayData.reduce((max, item) => Math.max(max, item.value), 0);
  }, [displayData]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border p-4 h-full">
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#2563eb] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold tracking-tight mb-3">
        {t("logs.activity.wordcloud.title", "Query keywords")}
      </h3>

      {displayData.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
          {t("logs.activity.wordcloud.empty", "No queries for selected date")}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 items-center content-start min-h-24">
            {displayData.map((item, index) => (
              <span
                key={`${item.text}-${index}`}
                className={`
                  inline-block px-1.5 py-0.5 rounded-sm
                  ${getFontSize(item.value, maxValue)}
                  ${getWordColor(item.value, maxValue)}
                `}
                title={`${item.text}: ${item.value}`}
              >
                {item.text}
              </span>
            ))}
          </div>

          {data.length > maxWords ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {t(
                "logs.activity.wordcloud.showing",
                "Showing {{count}} of {{total}}",
                { count: maxWords, total: data.length },
              )}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
};

export default QueryWordCloud;
