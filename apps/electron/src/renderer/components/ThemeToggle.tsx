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
      <div className={className}>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">{t("settings.theme")}</label>
            <p className="text-xs text-muted-foreground">
              {isDark
                ? t("settings.themeDark")
                : t("settings.themeLight")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggle}
            className="gap-2 min-w-[7.5rem]"
            aria-label={t("settings.theme")}
          >
            {isDark ? (
              <>
                <Moon className="h-4 w-4" />
                {t("settings.themeDark")}
              </>
            ) : (
              <>
                <Sun className="h-4 w-4" />
                {t("settings.themeLight")}
              </>
            )}
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          {(
            [
              ["light", t("settings.themeLight")],
              ["dark", t("settings.themeDark")],
              ["system", t("settings.themeSystem")],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={theme === value ? "default" : "outline"}
              onClick={() => setTheme(value)}
              className="flex-1"
            >
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
      title={
        isDark ? t("settings.themeLight") : t("settings.themeDark")
      }
      aria-label={t("settings.theme")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
};

export default ThemeToggle;
