import React, { useEffect, useMemo, useState } from "react";
import { useThemeStore } from "@/renderer/stores";
import { cn } from "@/renderer/utils/tailwind-utils";
import { branding } from "@/branding";
import brandLogoSvg from "@branding/logo";

type BrandLogoProps = {
  className?: string;
  /** light = foreground wordmark; dark = white wordmark on dark UI */
  variant?: "light" | "dark" | "auto";
  title?: string;
};

/**
 * Wordmark named by branding.config.json. Replace the SVG at the configured
 * path to rebrand a deployment — see docs/BRANDING.md.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "h-8 w-auto",
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
    // The artwork draws its text in the configured foreground colour; swap it
    // for white on dark surfaces so the wordmark stays legible.
    let svg = String(brandLogoSvg);
    if (isDark) {
      svg = recolorForeground(svg);
    }
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

/** Replace the configured foreground colour (fills and strokes) with white. */
export function recolorForeground(svg: string): string {
  const fg = branding.colors.foreground;
  if (!/^#[0-9a-f]{3,8}$/i.test(fg)) return svg;
  return svg.replace(new RegExp(fg, "gi"), "#ffffff");
}

export default BrandLogo;
