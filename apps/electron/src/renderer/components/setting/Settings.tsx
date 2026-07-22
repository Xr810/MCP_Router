import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcp_router/ui";
import { Button } from "@mcp_router/ui";
import { Switch } from "@mcp_router/ui";
import { Input } from "@mcp_router/ui";
import { toast } from "sonner";
import { useAuthStore } from "../../stores";
import { IconCloud, IconLock } from "@tabler/icons-react";
import { electronPlatformAPI as platformAPI } from "../../platform-api/electron-platform-api";
import { postHogService } from "../../services/posthog-service";
import type { CloudSyncStatus } from "@mcp_router/shared";
import { cn } from "@/renderer/utils/tailwind-utils";

const fieldClass =
  "h-10 bg-background border-border focus-visible:ring-[#2563eb]/35 focus-visible:border-[#2563eb]/50";

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
    {children}
  </h2>
);

const SettingRow: React.FC<{
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, description, children, className }) => (
  <div
    className={cn(
      "flex items-center justify-between gap-6 py-3.5",
      className,
    )}
  >
    <div className="min-w-0 space-y-0.5 pr-4">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {description ? (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      ) : null}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [loadExternalMCPConfigs, setLoadExternalMCPConfigs] =
    useState<boolean>(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(false);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(true);
  const [showWindowOnStartup, setShowWindowOnStartup] = useState<boolean>(true);
  const [mcpRemoteAccessEnabled, setMcpRemoteAccessEnabled] =
    useState<boolean>(false);
  const [mcpHttpHost, setMcpHttpHost] = useState("");
  const [mcpHttpPort, setMcpHttpPort] = useState("");
  const [mcpGatewayPublicUrl, setMcpGatewayPublicUrl] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [cloudSyncStatus, setCloudSyncStatus] =
    useState<CloudSyncStatus | null>(null);
  const [isLoadingCloudSync, setIsLoadingCloudSync] = useState(false);
  const [cloudSyncPassphrase, setCloudSyncPassphrase] = useState("");
  const [isSettingPassphrase, setIsSettingPassphrase] = useState(false);

  const [gatewayRestartNeeded, setGatewayRestartNeeded] = useState(false);

  const {
    isAuthenticated,
    userInfo,
    isLoggingIn,
    logout,
    checkAuthStatus,
    subscribeToAuthChanges,
  } = useAuthStore();

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const getCurrentLanguage = () => {
    const currentLang = i18n.language;
    if (currentLang.startsWith("en")) return "en";
    if (currentLang.startsWith("ja")) return "ja";
    if (currentLang.startsWith("zh")) return "zh";
    return "en";
  };

  useEffect(() => {
    checkAuthStatus();
    const unsubscribe = subscribeToAuthChanges();
    return () => {
      unsubscribe();
    };
  }, [checkAuthStatus, subscribeToAuthChanges]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await platformAPI.settings.get();
        setLoadExternalMCPConfigs(settings.loadExternalMCPConfigs ?? true);
        setAnalyticsEnabled(settings.analyticsEnabled ?? false);
        setAutoUpdateEnabled(settings.autoUpdateEnabled ?? true);
        setShowWindowOnStartup(settings.showWindowOnStartup ?? true);
        setMcpRemoteAccessEnabled(settings.mcpRemoteAccessEnabled ?? false);
        setMcpHttpHost(settings.mcpHttpHost || "");
        setMcpHttpPort(
          settings.mcpHttpPort != null ? String(settings.mcpHttpPort) : "",
        );
        setMcpGatewayPublicUrl(settings.mcpGatewayPublicUrl || "");
      } catch {
        console.log("Failed to load settings, using defaults");
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const loadCloudSyncStatus = async () => {
      try {
        setIsLoadingCloudSync(true);
        const status = await platformAPI.cloudSync.getStatus();
        setCloudSyncStatus(status);
      } catch (error) {
        console.error("Failed to load cloud sync status:", error);
      } finally {
        setIsLoadingCloudSync(false);
      }
    };
    loadCloudSyncStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void checkAuthStatus(true);
    }
  }, [isAuthenticated, checkAuthStatus]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleExternalMCPConfigsToggle = async (checked: boolean) => {
    setLoadExternalMCPConfigs(checked);
    setIsSavingSettings(true);
    try {
      const currentSettings = await platformAPI.settings.get();
      await platformAPI.settings.save({
        ...currentSettings,
        loadExternalMCPConfigs: checked,
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      setLoadExternalMCPConfigs(!checked);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAnalyticsToggle = async (checked: boolean) => {
    setAnalyticsEnabled(checked);
    setIsSavingSettings(true);
    try {
      const currentSettings = await platformAPI.settings.get();
      await platformAPI.settings.save({
        ...currentSettings,
        analyticsEnabled: checked,
      });
      postHogService.updateConfig({
        analyticsEnabled: checked,
        userId: currentSettings.userId,
      });
    } catch (error) {
      console.error("Failed to save analytics settings:", error);
      setAnalyticsEnabled(!checked);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAutoUpdateToggle = async (checked: boolean) => {
    setAutoUpdateEnabled(checked);
    setIsSavingSettings(true);
    try {
      const currentSettings = await platformAPI.settings.get();
      await platformAPI.settings.save({
        ...currentSettings,
        autoUpdateEnabled: checked,
      });
    } catch (error) {
      console.error("Failed to save auto update settings:", error);
      setAutoUpdateEnabled(!checked);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleStartupVisibilityToggle = async (checked: boolean) => {
    setShowWindowOnStartup(checked);
    setIsSavingSettings(true);
    try {
      const currentSettings = await platformAPI.settings.get();
      await platformAPI.settings.save({
        ...currentSettings,
        showWindowOnStartup: checked,
      });
    } catch (error) {
      console.error("Failed to save startup visibility settings:", error);
      setShowWindowOnStartup(!checked);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveRemoteMcpSettings = async () => {
    setIsSavingSettings(true);
    try {
      const parsedPort = Number(mcpHttpPort);
      const port =
        Number.isFinite(parsedPort) && parsedPort > 0 && parsedPort < 65536
          ? parsedPort
          : 3282;
      const currentSettings = await platformAPI.settings.get();
      await platformAPI.settings.save({
        ...currentSettings,
        mcpRemoteAccessEnabled,
        mcpHttpHost: mcpHttpHost.trim() || "0.0.0.0",
        mcpHttpPort: port,
        mcpGatewayPublicUrl: mcpGatewayPublicUrl.trim(),
      });
      setMcpHttpPort(String(port));
      setGatewayRestartNeeded(true);
      toast.success(t("settings.remoteMcpRestartRequired"));
    } catch (error) {
      console.error("Failed to save gateway settings:", error);
      toast.error(
        t("settings.remoteMcpSaveFailed", "Failed to save gateway settings"),
      );
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRestartApp = async () => {
    try {
      await platformAPI.packages.system.restartApp();
    } catch (error) {
      console.error("Failed to restart app:", error);
      toast.error(t("settings.restartFailed", "Failed to restart the app"));
    }
  };

  const handleCloudSyncToggle = async (checked: boolean) => {
    if (!cloudSyncStatus) return;
    try {
      const newStatus = await platformAPI.cloudSync.setEnabled(checked);
      setCloudSyncStatus(newStatus);
    } catch (error) {
      console.error("Failed to toggle cloud sync:", error);
    }
  };

  const handleSetPassphraseAndEnable = async () => {
    if (!cloudSyncPassphrase.trim()) return;
    try {
      setIsSettingPassphrase(true);
      await platformAPI.cloudSync.setPassphrase(cloudSyncPassphrase);
      const newStatus = await platformAPI.cloudSync.setEnabled(true);
      setCloudSyncStatus(newStatus);
      setCloudSyncPassphrase("");
    } catch (error) {
      console.error("Failed to set passphrase:", error);
      toast.error(t("settings.passphraseError"));
    } finally {
      setIsSettingPassphrase(false);
    }
  };

  const isSubscribed =
    userInfo?.subscriptionStatus && userInfo.subscriptionStatus !== "canceled";

  const planNameLabel =
    userInfo?.planName && userInfo.planName.trim().length > 0
      ? userInfo.planName
      : t("settings.planNameUnknown");

  return (
    <div className="flex flex-col h-full w-full gap-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("common.settings")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("settings.pageDescription")}
        </p>
      </div>

      {isAuthenticated && (
        <section className="space-y-3">
          <SectionLabel>{t("settings.account")}</SectionLabel>
          <div className="border-t border-border">
            <div className="flex items-center justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {userInfo?.name || userInfo?.userId}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isSubscribed ? planNameLabel : t("settings.notSubscribed")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingIn}
                className="h-9"
              >
                {isLoggingIn ? t("settings.loggingOut") : t("settings.logout")}
              </Button>
            </div>

            <div className="border-t border-border py-3.5 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <IconCloud className="h-4 w-4 text-[#2563eb] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {t("settings.cloudSync")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.cloudSyncDescription")}
                    </p>
                  </div>
                </div>
                {!isSubscribed ? (
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {t("settings.proOnly")}
                  </span>
                ) : (
                  cloudSyncStatus?.hasPassphrase && (
                    <Switch
                      checked={cloudSyncStatus?.enabled ?? false}
                      onCheckedChange={handleCloudSyncToggle}
                      disabled={
                        isLoadingCloudSync ||
                        !cloudSyncStatus?.encryptionAvailable
                      }
                    />
                  )
                )}
              </div>

              {isSubscribed && cloudSyncStatus && (
                <>
                  {cloudSyncStatus.hasPassphrase ? (
                    <div className="space-y-1 pl-7">
                      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                        <IconLock className="h-3.5 w-3.5" />
                        {t("settings.passphraseSet")}
                      </div>
                      {cloudSyncStatus.enabled &&
                        cloudSyncStatus.lastSyncedAt && (
                          <p className="text-xs text-muted-foreground">
                            {t("settings.lastSynced")}:{" "}
                            {new Date(
                              cloudSyncStatus.lastSyncedAt,
                            ).toLocaleString()}
                          </p>
                        )}
                      {cloudSyncStatus.lastError && (
                        <p className="text-xs text-destructive">
                          {cloudSyncStatus.lastError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 pl-7">
                      <p className="text-xs text-muted-foreground">
                        {t("settings.setPassphraseDescription")}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {t("settings.passphraseWarning")}
                      </p>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value={cloudSyncPassphrase}
                          onChange={(e) =>
                            setCloudSyncPassphrase(e.target.value)
                          }
                          className={cn("flex-1", fieldClass)}
                        />
                        <Button
                          size="sm"
                          onClick={handleSetPassphraseAndEnable}
                          disabled={
                            isSettingPassphrase || !cloudSyncPassphrase.trim()
                          }
                          className="h-10 bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-0"
                        >
                          {isSettingPassphrase
                            ? t("common.saving")
                            : t("settings.enableCloudSync")}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Enterprise Gateway */}
      <section className="space-y-3 w-full">
        <div className="flex items-center justify-between gap-4">
          <SectionLabel>{t("settings.remoteMcpAccess")}</SectionLabel>
          <Switch
            checked={mcpRemoteAccessEnabled}
            onCheckedChange={setMcpRemoteAccessEnabled}
            disabled={isSavingSettings}
            aria-label={t("settings.remoteMcpAccessEnabled")}
          />
        </div>

        <div
          className={cn(
            "border-t border-border pt-4 space-y-4 transition-opacity",
            !mcpRemoteAccessEnabled && "opacity-45",
          )}
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("settings.mcpHttpHost")}
              </label>
              <Input
                value={mcpHttpHost}
                onChange={(e) => setMcpHttpHost(e.target.value)}
                disabled={isSavingSettings || !mcpRemoteAccessEnabled}
                autoComplete="off"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("settings.mcpHttpPort")}
              </label>
              <Input
                type="number"
                value={mcpHttpPort}
                onChange={(e) => setMcpHttpPort(e.target.value)}
                disabled={isSavingSettings || !mcpRemoteAccessEnabled}
                autoComplete="off"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t("settings.mcpGatewayPublicUrl")}
            </label>
            <Input
              value={mcpGatewayPublicUrl}
              onChange={(e) => setMcpGatewayPublicUrl(e.target.value)}
              disabled={isSavingSettings}
              autoComplete="off"
              className={fieldClass}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              onClick={handleSaveRemoteMcpSettings}
              disabled={isSavingSettings}
              className="h-10 px-5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-0"
            >
              {isSavingSettings ? t("common.saving") : t("common.save")}
            </Button>
            {gatewayRestartNeeded ? (
              <Button
                variant="outline"
                onClick={handleRestartApp}
                disabled={isSavingSettings}
                className="h-10"
              >
                {t("settings.restartNow")}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Application */}
      <section className="space-y-3 w-full">
        <SectionLabel>{t("settings.application")}</SectionLabel>
        <div className="border-t border-border divide-y divide-border">
          <SettingRow label={t("common.language")}>
            <Select
              value={getCurrentLanguage()}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="w-[9.5rem] h-10">
                <SelectValue placeholder={t("common.language")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow
            label={t("settings.autoUpdate")}
            description={t("settings.autoUpdateDescription")}
          >
            <Switch
              checked={autoUpdateEnabled}
              onCheckedChange={handleAutoUpdateToggle}
              disabled={isSavingSettings}
            />
          </SettingRow>

          <SettingRow
            label={t("settings.showWindowOnStartup")}
            description={t("settings.showWindowOnStartupDescription")}
          >
            <Switch
              checked={showWindowOnStartup}
              onCheckedChange={handleStartupVisibilityToggle}
              disabled={isSavingSettings}
            />
          </SettingRow>

          <SettingRow
            label={t("settings.loadExternalMCPConfigs")}
            description={t("settings.loadExternalMCPConfigsDescription")}
          >
            <Switch
              checked={loadExternalMCPConfigs}
              onCheckedChange={handleExternalMCPConfigsToggle}
              disabled={isSavingSettings}
            />
          </SettingRow>

          <SettingRow
            label={t("settings.analytics")}
            description={t("settings.analyticsDescription")}
          >
            <Switch
              checked={analyticsEnabled}
              onCheckedChange={handleAnalyticsToggle}
              disabled={isSavingSettings}
            />
          </SettingRow>
        </div>
      </section>
    </div>
  );
};

export default Settings;
