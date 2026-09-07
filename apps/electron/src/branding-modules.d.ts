/**
 * Ambient declarations for the branding layer.
 *
 * "@branding" resolves to branding.config.json at the repository root, and
 * "@branding/logo" / "@branding/mark" to the SVG paths named inside it. The
 * mapping lives in webpack.main.config.ts and webpack.renderer.config.ts, so
 * pointing the config at different artwork is enough to rebrand a build.
 */

declare module "@branding" {
  export type BrandingConfig = {
    appName: string;
    windowTitle: string;
    footer: string;
    logo: string;
    mark: string;
    colors: {
      accent: string;
      foreground: string;
    };
  };
  const config: BrandingConfig;
  export default config;
}

declare module "@branding/logo" {
  const content: string;
  export default content;
}

declare module "@branding/mark" {
  const content: string;
  export default content;
}
