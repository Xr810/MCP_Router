import brandingConfig, { type BrandingConfig } from "@branding";

/**
 * Branding is read once from branding.config.json (repository root) and used
 * for the application name, window title, wordmark and theme colours.
 * See docs/BRANDING.md.
 */
const DEFAULTS: BrandingConfig = {
  appName: "MCP Router",
  windowTitle: "MCP Router",
  footer: "",
  logo: "public/images/brand/logo.svg",
  mark: "public/images/brand/mark.svg",
  colors: {
    accent: "#2563eb",
    foreground: "#1f2937",
  },
};

export const branding: BrandingConfig = {
  ...DEFAULTS,
  ...brandingConfig,
  colors: { ...DEFAULTS.colors, ...(brandingConfig?.colors ?? {}) },
};

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * "#2563eb" -> "221 83% 53%", the space-separated triple Tailwind's CSS
 * custom properties expect. Returns null for anything that is not a hex colour.
 */
export function hexToHslTriple(hex: string): string | null {
  const match = HEX.exec(hex.trim());
  if (!match) return null;

  let digits = match[1];
  if (digits.length === 3) {
    digits = digits
      .split("")
      .map((d) => d + d)
      .join("");
  }

  const r = parseInt(digits.slice(0, 2), 16) / 255;
  const g = parseInt(digits.slice(2, 4), 16) / 255;
  const b = parseInt(digits.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) h = (g - b) / delta + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default branding;
