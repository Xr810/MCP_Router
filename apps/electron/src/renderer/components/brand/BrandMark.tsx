import React, { useEffect, useMemo, useState } from "react";
import { useThemeStore } from "@/renderer/stores";
import { cn } from "@/renderer/utils/tailwind-utils";
import { branding } from "@/branding";
import { recolorForeground } from "@/renderer/components/brand/BrandLogo";
import brandMarkSvg from "@branding/mark";

type BrandMarkProps = {
  className?: string;
  /** light = foreground mark; dark = white mark on dark UI */
  variant?: "light" | "dark" | "auto";
  title?: string;
};

/**
 * Square icon mark named by branding.config.json, for the tray and other
 * compact placements — see docs/BRANDING.md.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  className = "h-5 w-auto",
  variant = "auto",
  title = branding.appName,
}) => {
  const theme = useThemeStore((s) => s.theme);
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const isDark =
    variant === "dark" ||
    (variant === "auto" &&
      (theme === "dark" || (theme === "system" && systemDark)));

  const markup = useMemo(() => {
    const svg = isDark
      ? recolorForeground(String(brandMarkSvg))
      : String(brandMarkSvg);
    return svg.replace(
      "<svg ",
      `<svg role="img" aria-label="${title}" style="height:100%;width:auto;display:block;" `,
    );
  }, [isDark, title]);

  return (
    <span
      className={cn("inline-flex items-center shrink-0", className)}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
};

export default BrandMark;
