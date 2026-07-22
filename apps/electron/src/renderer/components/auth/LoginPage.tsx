import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/renderer/stores";
import { AuthSignInPanel } from "./AuthSignInPanel";

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoggingIn, isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/settings", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <AuthSignInPanel
      title={t("login.title")}
      description={t("login.description")}
      onLogin={handleLogin}
      busy={isLoggingIn}
      onContinueWithout={() => navigate("/servers")}
    />
  );
};

export default LoginPage;
