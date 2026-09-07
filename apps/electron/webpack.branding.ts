import * as fs from "fs";
import * as path from "path";

/**
 * Reads branding.config.json at the repository root and resolves the
 * "@branding" imports against it, so the application name, wordmark and icon a
 * build carries come from that one file. See docs/BRANDING.md.
 *
 * Used by the webpack configs and by forge.config.ts, which runs outside the
 * bundle and so cannot go through the aliases.
 */
const CONFIG_PATH = path.resolve(__dirname, "../../branding.config.json");

export type BrandingConfig = {
  appName: string;
  windowTitle: string;
  footer: string;
  logo: string;
  mark: string;
  colors: { accent: string; foreground: string };
};

const DEFAULTS: BrandingConfig = {
  appName: "MCP Router",
  windowTitle: "MCP Router",
  footer: "",
  logo: "public/images/brand/logo.svg",
  mark: "public/images/brand/mark.svg",
  colors: { accent: "#2563eb", foreground: "#1f2937" },
};

export function readBranding(): BrandingConfig {
  try {
    const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    return {
      ...DEFAULTS,
      ...parsed,
      colors: { ...DEFAULTS.colors, ...(parsed?.colors ?? {}) },
    };
  } catch {
    // Fall back to the bundled defaults when the config is missing or invalid.
    return DEFAULTS;
  }
}

/** Filename-safe form of the application name, for installer artifacts. */
export function brandingSlug(): string {
  return (
    readBranding()
      .appName.trim()
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "MCP-Router"
  );
}

export function brandingAliases(): Record<string, string> {
  const config = readBranding();
  return {
    "@branding$": CONFIG_PATH,
    "@branding/logo": path.resolve(__dirname, config.logo),
    "@branding/mark": path.resolve(__dirname, config.mark),
  };
}

export default brandingAliases;
