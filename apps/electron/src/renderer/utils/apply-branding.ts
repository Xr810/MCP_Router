import { branding, hexToHslTriple } from "@/branding";

const STYLE_ELEMENT_ID = "branding-theme";

/** Foreground in dark mode is near-white regardless of the configured colour. */
const DARK_FOREGROUND = "0 0% 98%";

const FOREGROUND_TOKENS = [
  "--foreground",
  "--card-foreground",
  "--popover-foreground",
  "--secondary-foreground",
  "--sidebar-foreground",
];

const ACCENT_TOKENS = [
  "--primary",
  "--ring",
  "--sidebar-primary",
  "--sidebar-ring",
  "--chart-1",
];

/** Hue of an "H S% L%" triple, used to tint surfaces with the accent. */
function parseHue(triple: string): number | null {
  const m = /^(-?\d+(?:\.\d+)?) \d+(?:\.\d+)?% \d+(?:\.\d+)?%$/.exec(triple);
  if (!m) return null;
  return Math.round(Number(m[1]));
}

function declarations(tokens: string[], value: string): string {
  return tokens.map((token) => `${token}: ${value};`).join(" ");
}

/**
 * Build the CSS that makes the Tailwind theme follow branding.config.json.
 *
 * Emitted as a stylesheet rather than inline styles: the dark theme is a
 * `.dark` class on the same root element, and an inline style would win
 * against it and leave dark mode with dark text.
 */
export function buildBrandingCss(
  accentHex: string = branding.colors.accent,
  foregroundHex: string = branding.colors.foreground,
): string {
  const accent = hexToHslTriple(accentHex);
  const foreground = hexToHslTriple(foregroundHex);

  const light: string[] = [];
  const dark: string[] = [];

  if (accent) {
    light.push(declarations(ACCENT_TOKENS, accent));
    dark.push(declarations(ACCENT_TOKENS, accent));

    // Tinted surfaces keep the accent's hue so the theme reads as one family.
    const h = parseHue(accent);
    if (h !== null) {
      light.push(
        `--accent: ${h} 100% 96%; --accent-foreground: ${h} 80% 28%;` +
          ` --sidebar-accent: ${h} 100% 95%; --sidebar-accent-foreground: ${h} 80% 28%;`,
      );
      dark.push(
        `--accent: ${h} 45% 16%; --accent-foreground: ${h} 100% 82%;` +
          ` --sidebar-accent: ${h} 45% 16%; --sidebar-accent-foreground: ${h} 100% 82%;`,
      );
    }
  }

  if (foreground) {
    light.push(declarations(FOREGROUND_TOKENS, foreground));
    // Restated so the light rule below cannot leak into dark mode.
    dark.push(declarations(FOREGROUND_TOKENS, DARK_FOREGROUND));
  }

  if (light.length === 0 && dark.length === 0) return "";

  return `:root { ${light.join(" ")} }\n.dark { ${dark.join(" ")} }\n`;
}

/**
 * Write the configured brand colours onto the document as CSS custom
 * properties, so the whole Tailwind theme follows from branding.config.json.
 * base.css ships the same values statically; this makes them configurable.
 */
export function applyBranding(doc: Document = document): void {
  const css = buildBrandingCss();
  if (!css) return;

  let style = doc.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    doc.head.appendChild(style);
  }
  style.textContent = css;

  doc.title = branding.windowTitle;
}

export default applyBranding;
