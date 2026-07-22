import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@mcp_router/ui";
import Manual from "./Manual";

const DiscoverWrapper: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to="/servers"
                className="text-muted-foreground hover:text-foreground"
              >
                {t("serverList.title")}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("discoverServers.title")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("discoverServers.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            "discoverServers.subtitle",
            "Add a local command, remote HTTP endpoint, or import an existing config.",
          )}
        </p>
      </div>

      <Manual />
    </div>
  );
};

export default DiscoverWrapper;
