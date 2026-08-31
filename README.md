# MCP Router

A fork of [MCP Router](https://github.com/mcp-router/mcp-router). Desktop app that aggregates MCP servers (Excel, PowerPoint, and others) and exposes them as a single HTTP gateway for Hermes / NemoHermes and other MCP clients.

Repo: https://github.com/meghamshb2006/mcprouter

## What it does

Operators run **MCP Router** on a machine that can reach the MCP servers (typically an Azure Windows VM with Office). Clients never open this UI. They call:

```text
POST http://HOST:3282/mcp
Authorization: Bearer <token issued in Keys>
```

The Electron window is for IT only: add servers, power them LIVE, issue keys, and grant access.

## Features

### Desktop admin lock

First launch creates a local administrator (username + password, stored as an argon2 hash in `shared-config.json`). Later launches show an unlock screen.

- **Lock** in the sidebar or Settings locks the window.
- HTTP `/mcp` **keeps running** while the UI is locked.
- Lost password: delete the `admin` object in `shared-config.json` and restart.

### MCP servers

Add local commands, remote HTTP MCP endpoints, JSON configs, or DXT packages. Power each server **LIVE** / **OFF**. Group servers into **Projects**. Tool lists are cached so you can grant permissions even when a server is stopped; execution still requires LIVE.

### Keys (Bearer tokens)

**Keys** issues one token per person or client.

- New keys start with **no MCP access**. Open **Permissions** and grant servers, then tools.
- Legacy keys without a `toolAccess` field still allow all tools on granted servers.
- Default expiry is **30 days**. When issuing a key, choose 1 day, 1 week, 30 days, 90 days, a custom number of days, or never.
- Keys issued before expiry enforcement stay valid until you re-issue them.
- Expired keys are rejected on `/mcp` (401).

**Client setup** copies native HTTP YAML (`url` + `Authorization: Bearer`). Do **not** use `@mcp_router/cli` for Azure — npm 0.2.0 ignores `--url`.

### Enterprise Gateway

By default the aggregator binds `127.0.0.1:3282`.

In **Settings → Enterprise Gateway**:

- Enable the gateway
- Listen address `0.0.0.0`, port `3282` (or your choice)
- **Client endpoint URL**, e.g. `http://HOST:3282/mcp`

Save and restart. Open NSG / Windows Firewall for that port.

Env overrides: `MCPR_HTTP_HOST`, `MCPR_HTTP_PORT`, `MCPR_GATEWAY_PUBLIC_URL`.

`GET /health` is unauthenticated. `/mcp` and `/mcp/status` require Bearer.

### Also in the app

- **Request logs** — tool calls and activity
- **Cloud Sync** — optional end-to-end encrypted workspace sync
- **Workflows / hooks** and **Skills** — available as routes; nav focuses on servers, keys, logs, and settings

## Hermes config

```yaml
mcp_servers:
  mcp-router:
    url: "http://HOST:3282/mcp"
    headers:
      Authorization: "Bearer <token from MCP Router>"
```

## Develop

```bash
pnpm install
pnpm --filter @mcp_router/electron dev
```

Do **not** run `pnpm dev` on a 4 GB Azure VM (webpack OOMs). Build the Windows installer in GitHub Actions (**Windows Azure Package**) and install the artifact on the VM.

## Docs

- Azure + Hermes runbook: [`docs/JE_AZURE_HERMES.md`](docs/JE_AZURE_HERMES.md)
- Security notes: [`docs/SECURITY.md`](docs/SECURITY.md)

## License

See [LICENSE.md](LICENSE.md). Upstream MCP Router attribution retained.
