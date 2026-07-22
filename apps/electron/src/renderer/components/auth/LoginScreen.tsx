import React from "react";
import { useTranslation } from "react-i18next";
import { AuthSignInPanel } from "./AuthSignInPanel";

interface LoginScreenProps {
  onLogin: () => void | Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [busy, setBusy] = React.useState(false);

  const handleLogin = async () => {
    try {
      setBusy(true);
      await onLogin();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthSignInPanel
      title={t("login.requiredTitle")}
      description={t("login.requiredDescription")}
      onLogin={handleLogin}
      busy={busy}
    />
  );
};

export default LoginScreen;
