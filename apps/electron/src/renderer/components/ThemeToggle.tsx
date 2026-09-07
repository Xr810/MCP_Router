import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@mcp_router/ui";
import { useThemeStore } from "@/renderer/stores";
import type { Theme } from "@mcp_router/shared";

type ThemeToggleProps = {
  className?: string;
  /** compact icon button for title bar; expanded for settings */
  variant?: "icon" | "switch-row";
};

function resolveEffectiveDark(theme: Theme, systemDark: boolean): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return systemDark;
}

/**
 * Toggle light ↔ dark. From light/system-light → dark; from dark/system-dark → light.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  variant = "icon",
}) => {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const isDark = resolveEffectiveDark(theme, systemDark);

  const toggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  if (variant === "switch-row") {
    return (
      <div className={className ?? "flex items-center justify-between gap-4"}>
        <div className="space-y-0.5 min-w-0">
          <label className="text-sm font-medium text-foreground">
            {t("settings.theme")}
          </label>
          <p className="text-xs text-muted-foreground">
            {theme === "system"
              ? t("settings.themeSystem")
              : isDark
                ? t("settings.themeDark")
                : t("settings.themeLight")}
          </p>
        </div>
        <div
          className="inline-flex h-10 items-center rounded-md border border-border bg-muted/30 p-0.5 shrink-0"
          role="group"
          aria-label={t("settings.theme")}
        >
          {(
            [
              ["light", t("settings.themeLight"), Sun],
              ["dark", t("settings.themeDark"), Moon],
              ["system", t("settings.themeSystem"), null],
            ] as const
          ).map(([value, label, Icon]) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTheme(value)}
              className={
                theme === value
                  ? "h-9 gap-1.5 rounded-[5px] bg-background text-primary shadow-sm"
                  : "h-9 gap-1.5 rounded-[5px] text-muted-foreground"
              }
            >
              {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
              {label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={className ?? "h-8 w-8 p-0"}
      title={isDark ? t("settings.themeLight") : t("settings.themeDark")}
      aria-label={t("settings.theme")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};

export default ThemeToggle;
