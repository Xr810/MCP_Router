# Branding

The default build ships unbranded. One config file changes the application's name, icon,
wordmark and accent colour across the title bar, the window title, the tray, and the
installer metadata.

## `branding.config.json`

At the repository root:

```json
{
  "appName": "MCP Router",
  "windowTitle": "MCP Router",
  "footer": "",
  "logo": "public/images/brand/logo.svg",
  "mark": "public/images/brand/mark.svg",
  "colors": {
    "accent": "#2563eb",
    "foreground": "#1f2937"
  }
}
```

| Field | Used by |
|---|---|
| `appName` | Electron app name, tray tooltip, installer name and description |
| `windowTitle` | `<title>` in the renderer |
| `footer` | Optional line in the sign-in and lock screens; empty hides it |
| `logo` | Wordmark in the title bar. Wide SVG, roughly 4:1 |
| `mark` | Square icon for the tray and compact placements |
| `colors.accent` | `--primary` — buttons, active states, focus rings |
| `colors.foreground` | `--foreground` — body text in light mode |

## Applying your own

1. Put your SVGs at the two paths above, replacing the defaults.
2. Edit `branding.config.json`.
3. Restart `pnpm dev`, or rebuild the installer.

Colours are read at startup, converted to HSL and written onto the document root as CSS
custom properties, so the whole Tailwind theme follows from those two values. Dark mode
derives from the same accent.

## What is deliberately not configurable

The application's own identity as a fork of MCP Router — the upstream attribution in
`README.md` and `LICENSE.md` — is not part of the branding layer and should not be removed
when rebranding a deployment.

## A caution

Only ship marks you have the right to use. A company logo copied from its website is that
company's trademark; it does not belong in a public repository, and neither does a
deployment configuration that names an internal host.
