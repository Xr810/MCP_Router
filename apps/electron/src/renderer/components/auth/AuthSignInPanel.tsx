import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@mcp_router/ui";
import { BrandLogo } from "@/renderer/components/brand/BrandLogo";
import { branding } from "@/branding";
import { Loader2 } from "lucide-react";

type AuthSignInPanelProps = {
  title: string;
  description: string;
  onLogin: () => void | Promise<void>;
  busy?: boolean;
  /** When set, shows a secondary “continue without signing in” action */
  onContinueWithout?: () => void;
};

/**
 * Shared sign-in panel used by /login and the remote-workspace gate.
 */
export const AuthSignInPanel: React.FC<AuthSignInPanelProps> = ({
  title,
  description,
  onLogin,
  busy = false,
  onContinueWithout,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-full items-center justify-center bg-background px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <BrandLogo className="h-16 w-auto" />

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-medium text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex w-full flex-col gap-2">
          <Button
            className="h-11 w-full bg-primary text-white hover:bg-primary/90 border-0"
            onClick={onLogin}
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("settings.loggingIn")}
              </>
            ) : (
              t("login.loginButton")
            )}
          </Button>
          {onContinueWithout ? (
            <Button
              variant="ghost"
              className="h-10 w-full text-muted-foreground hover:bg-transparent hover:text-foreground"
              onClick={onContinueWithout}
              disabled={busy}
            >
              {t("login.continueWithout")}
            </Button>
          ) : null}
        </div>

        {branding.footer ? (
          <p className="text-xs text-muted-foreground text-center">
            {branding.footer}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default AuthSignInPanel;
