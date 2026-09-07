import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@mcp_router/ui";
import { toast } from "sonner";
import { cn } from "@/renderer/utils/tailwind-utils";

type CodeSnippetProps = {
  code: string;
  label?: string;
  className?: string;
  /** Wrap long lines instead of horizontal scroll */
  wrap?: boolean;
};

/**
 * Copyable code block for Client setup.
 */
export const CodeSnippet: React.FC<CodeSnippetProps> = ({
  code,
  label,
  className,
  wrap = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied");
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div
      className={cn(
        "rounded-md border border-border overflow-hidden bg-muted/15",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 h-8 border-b border-border">
        <span className="text-[11px] font-medium text-muted-foreground">
          {label || "Snippet"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-primary" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre
        className={cn(
          "px-3 py-2.5 font-mono text-[11px] leading-snug text-foreground/90",
          wrap
            ? "whitespace-pre-wrap break-all"
            : "overflow-x-auto whitespace-pre",
        )}
      >
        {code}
      </pre>
    </div>
  );
};

export default CodeSnippet;
