import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "@mcp_router/ui";
import { JeLogo } from "@/renderer/components/brand/JeLogo";
import { Loader2 } from "lucide-react";
import { usePlatformAPI } from "@/renderer/platform-api";
import type { AdminStatus } from "@mcp_router/shared";
import { toast } from "sonner";

type AdminLockScreenProps = {
  mode: "setup" | "unlock";
  username?: string;
  onUnlocked: (status: AdminStatus) => void;
};

export const AdminLockScreen: React.FC<AdminLockScreenProps> = ({
  mode,
  username: initialUsername,
  onUnlocked,
}) => {
  const { t } = useTranslation();
  const platformAPI = usePlatformAPI();
  const [username, setUsername] = useState(
    initialUsername || (mode === "setup" ? "admin" : ""),
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === "setup" && password !== confirmPassword) {
      toast.error(t("admin.passwordMismatch"));
      return;
    }

    setBusy(true);
    try {
      const status =
        mode === "setup"
          ? await platformAPI.admin.setup(username, password)
          : await platformAPI.admin.unlock(username, password);
      onUnlocked(status);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("admin.authFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-white px-6 py-12">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col items-center gap-8"
      >
        <JeLogo className="h-16 w-auto" variant="light" />

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-medium text-[#1f2937]">
            {mode === "setup" ? t("admin.setupTitle") : t("admin.unlockTitle")}
          </h1>
          <p className="text-sm text-[#6b7280]">
            {mode === "setup"
              ? t("admin.setupDescription")
              : t("admin.unlockDescription")}
          </p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-username">{t("admin.username")}</Label>
            <Input
              id="admin-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="h-11"
              disabled={busy}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">{t("admin.password")}</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "setup" ? "new-password" : "current-password"
              }
              className="h-11"
              disabled={busy}
            />
          </div>
          {mode === "setup" ? (
            <div className="space-y-1.5">
              <Label htmlFor="admin-confirm">
                {t("admin.confirmPassword")}
              </Label>
              <Input
                id="admin-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="h-11"
                disabled={busy}
              />
            </div>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] border-0"
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("admin.working")}
              </>
            ) : mode === "setup" ? (
              t("admin.createAdmin")
            ) : (
              t("admin.unlock")
            )}
          </Button>

          {mode === "unlock" ? (
            <p className="text-xs text-[#6b7280] leading-relaxed">
              {t("admin.forgotPassword")}
            </p>
          ) : (
            <p className="text-xs text-[#6b7280] leading-relaxed">
              {t("admin.passwordHint")}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default AdminLockScreen;
