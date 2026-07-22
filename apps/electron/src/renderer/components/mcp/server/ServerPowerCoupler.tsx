import React from "react";
import { cn } from "@/renderer/utils/tailwind-utils";

export type ServerPowerStatus =
  | "running"
  | "starting"
  | "stopping"
  | "stopped"
  | "error"
  | string;

type ServerPowerCouplerProps = {
  status: ServerPowerStatus;
  disabled?: boolean;
  title?: string;
  onToggle: (nextEnabled: boolean) => void;
  className?: string;
};

/**
 * Industrial power-coupler control — mates like a connector, not a generic switch.
 * Same boolean contract as Switch.onCheckedChange; presentation only.
 */
export const ServerPowerCoupler: React.FC<ServerPowerCouplerProps> = ({
  status,
  disabled = false,
  title,
  onToggle,
  className,
}) => {
  const isLive = status === "running";
  const isBusy = status === "starting" || status === "stopping";
  const isError = status === "error";
  const checked = isLive;

  const label = isBusy
    ? status === "starting"
      ? "START"
      : "STOP"
    : isLive
      ? "LIVE"
      : isError
        ? "FAULT"
        : "OFF";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-busy={isBusy}
      disabled={disabled || isBusy}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        if (disabled || isBusy) return;
        onToggle(!checked);
      }}
      className={cn(
        "group relative inline-flex h-8 w-[4.75rem] shrink-0 items-center rounded-md",
        "border transition-all duration-300 ease-out select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isLive &&
          "border-[#2563eb]/70 bg-[linear-gradient(135deg,rgba(245,130,32,0.18),rgba(245,130,32,0.05))] shadow-[inset_0_0_0_1px_rgba(245,130,32,0.15)]",
        !isLive &&
          !isError &&
          "border-border bg-muted/40 hover:border-muted-foreground/40",
        isError && "border-destructive/60 bg-destructive/10",
        isBusy && "border-amber-500/50 bg-amber-500/10",
        className,
      )}
    >
      {/* Contact rails */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-1.5 top-1/2 h-[2px] -translate-y-1/2 rounded-full transition-colors duration-300",
          isLive ? "bg-[#2563eb]/55" : "bg-muted-foreground/25",
        )}
      />

      {/* Sliding coupler */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-[4px] border transition-all duration-300 ease-out",
          "flex items-center justify-center",
          isLive
            ? "left-[calc(100%-1.45rem)] border-[#2563eb] bg-[#2563eb] text-white shadow-[0_0_12px_rgba(245,130,32,0.45)]"
            : "left-1.5 border-border bg-background text-muted-foreground",
          isBusy && "animate-pulse border-amber-500 bg-amber-500 text-white",
          isError && !isLive && "border-destructive bg-destructive text-white",
        )}
      >
        <span
          className={cn(
            "block h-1.5 w-1.5 rounded-full",
            isLive || isBusy ? "bg-white/90" : "bg-muted-foreground/70",
          )}
        />
      </span>

      {/* Status word */}
      <span
        className={cn(
          "relative z-[1] w-full px-2 text-[10px] font-semibold tracking-[0.14em] transition-colors duration-300",
          isLive ? "pr-6 text-left text-[#1e40af] dark:text-[#2563eb]" : "pl-6 text-right",
          isError && !isLive && "text-destructive",
          isBusy && "text-amber-700 dark:text-amber-400",
          !isLive && !isError && !isBusy && "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
};

export default ServerPowerCoupler;
