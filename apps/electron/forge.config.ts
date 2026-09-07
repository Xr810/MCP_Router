import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

import { mainConfig } from "./webpack.main.config";
import { readBranding, brandingSlug } from "./webpack.branding";
import { rendererConfig } from "./webpack.renderer.config";
import { MakerDMG } from "@electron-forge/maker-dmg";
import * as path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });


const branding = readBranding();
const makerName = brandingSlug();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("./package.json");

const isMac = process.platform === "darwin";
const hasSignIdentity = !!process.env.PUBLIC_IDENTIFIER;
const hasNotarizeCreds = !!(
  process.env.APPLE_API_KEY &&
  process.env.APPLE_API_KEY_ID &&
  process.env.APPLE_API_ISSUER
);

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: "./public/images/icon/icon",
    // The Sustainable Use License requires that anyone who receives a copy of
    // the software also receives the terms, and that modified copies carry a
    // notice saying so. Ship both next to the binary.
    extraResource: ["../../LICENSE.md", "../../NOTICE"],
    // Support both Intel and Apple Silicon architectures - use target arch from env
    arch: (process.env.npm_config_target_arch as any) || process.arch,
    // Only sign/notarize on macOS when credentials are available (CI-safe)
    osxSign: isMac && hasSignIdentity
      ? {
          identity: process.env.PUBLIC_IDENTIFIER,
        }
      : undefined,
    osxNotarize: isMac && hasNotarizeCreds
      ? {
          appleApiKey: process.env.APPLE_API_KEY || "",
          appleApiKeyId: process.env.APPLE_API_KEY_ID || "",
          appleApiIssuer: process.env.APPLE_API_ISSUER || "",
        }
      : undefined,
  },
  rebuildConfig: {
    // Force rebuild native modules for the target architecture
    arch: (process.env.npm_config_target_arch as any) || process.arch,
  },
  makers: [
    new MakerSquirrel({
      name: makerName,
      authors: branding.appName,
      description: `${branding.appName} — centralized MCP gateway for Cursor, Claude, agent runtimes, and other MCP clients.`,
      setupIcon: "./public/images/icon/icon.ico",
    }),
    new MakerDMG(
      {
        // Versioned, so DMGs from different releases do not collide in a
        // downloads folder.
        name: `${makerName}-${version}`,
        format: "ULFO",
        icon: "./public/images/icon/icon.icns",
      },
      ["darwin"],
    ),
    new MakerZIP(),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./src/index.html",
            js: "./src/renderer.tsx",
            name: "main_window",
            preload: {
              js: "./src/preload.ts",
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        authToken: process.env.GITHUB_TOKEN,
        repository: {
          owner: "Xr810",
          name: "MCP_Router",
        },
        prerelease: true,
        draft: true,
      },
    },
  ],
};

export default config;
