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
    <div className="space-y-6">
      {/* Breadcrumbs: Servers > Add */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/servers">{t("serverList.title")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("discoverServers.title")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page title */}
      <h1 className="text-3xl font-bold">{t("discoverServers.title")}</h1>
      <Manual />
    </div>
  );
};

export default DiscoverWrapper;
