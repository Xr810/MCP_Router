import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogIn, UserRound } from "lucide-react";
import { Button } from "@mcp_router/ui";
import { useAuthStore } from "@/renderer/stores";

/**
 * Title-bar account control.
 * Signed out → /login. Signed in → /settings (account session).
 */
export function AccountControl() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, userInfo } = useAuthStore();

  const label = isAuthenticated
    ? userInfo?.name?.split(" ")[0] ||
      t("settings.account", { defaultValue: "Account" })
    : t("settings.login", { defaultValue: "Sign in" });

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-2 px-2.5 text-sm font-medium"
      onClick={() => navigate(isAuthenticated ? "/settings" : "/login")}
      title={
        isAuthenticated
          ? t("settings.account", { defaultValue: "Account" })
          : t("settings.login", { defaultValue: "Sign in" })
      }
    >
      {isAuthenticated ? (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
          {(label[0] || "A").toUpperCase()}
        </span>
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted/40">
          <LogIn className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      )}
      <span className="max-w-[7rem] truncate">{label}</span>
      {isAuthenticated ? (
        <UserRound className="h-3.5 w-3.5 opacity-50" />
      ) : null}
    </Button>
  );
}

export default AccountControl;
