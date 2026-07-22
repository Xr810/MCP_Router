import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@mcp_router/ui";
import { Button } from "@mcp_router/ui";
import { CodeSnippet } from "@/renderer/components/common/CodeSnippet";
import { usePlatformAPI } from "@/renderer/platform-api";
import { Link } from "react-router-dom";

interface HowToUseProps {
  token?: string;
}

export interface HowToUseHandle {
  showDialog: () => void;
}

const LOCAL_FALLBACK = "http://127.0.0.1:3282/mcp";

const HowToUse = forwardRef<HowToUseHandle, HowToUseProps>(({ token }, ref) => {
  const { t } = useTranslation();
  const platformAPI = usePlatformAPI();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [gatewayUrl, setGatewayUrl] = useState(LOCAL_FALLBACK);
  const [usingFallback, setUsingFallback] = useState(true);

  useImperativeHandle(ref, () => ({
    showDialog: () => setIsDialogOpen(true),
  }));

  useEffect(() => {
    let cancelled = false;
    platformAPI.settings
      .get()
      .then((settings) => {
        if (cancelled) return;
        const url = settings.mcpGatewayPublicUrl?.trim();
        if (url) {
          setGatewayUrl(url);
          setUsingFallback(false);
        } else {
          const port = settings.mcpHttpPort || 3282;
          setGatewayUrl(`http://127.0.0.1:${port}/mcp`);
          setUsingFallback(true);
        }
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [platformAPI]);

  const tokenValue = token || "<MCPR_TOKEN>";
  const hermesYaml = `mcp_servers:
  mcp-router:
    url: "${gatewayUrl}"
    headers:
      Authorization: "Bearer ${tokenValue}"`;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[calc(100vh-2rem)] gap-0 p-0 overflow-hidden grid-rows-[auto_1fr_auto]">
        <DialogHeader className="px-4 pt-4 pb-3 pr-10 border-b border-border space-y-1 text-left">
          <DialogTitle className="text-base font-semibold tracking-tight">
            {t("mcpApps.howToUse")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Paste into{" "}
            <span className="font-mono">~/.hermes/config.yaml</span>
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 py-3 space-y-3 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-1.5 text-xs items-start">
            <span className="text-muted-foreground pt-0.5">Endpoint</span>
            <code className="font-mono text-foreground break-all leading-snug">
              {gatewayUrl}
            </code>
            {usingFallback ? (
              <>
                <span />
                <span className="text-muted-foreground leading-snug">
                  Using localhost — set Client endpoint URL in{" "}
                  <Link
                    to="/settings"
                    className="text-[#2563eb] hover:underline font-medium"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Settings
                  </Link>
                </span>
              </>
            ) : null}
          </div>

          <CodeSnippet code={hermesYaml} label="config.yaml" wrap />
        </div>

        <DialogFooter className="px-4 py-3 border-t border-border sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setIsDialogOpen(false)}
          >
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

HowToUse.displayName = "HowToUse";

export default HowToUse;
