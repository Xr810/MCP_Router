# Remote deployment

How to run the aggregator on a remote VM and let clients on other machines reach
it over HTTP with a Bearer key. `HOST` below is a placeholder for your own
hostname or address.

## Architecture

```text
MCP client (agent runtime, Cursor, Claude Desktop)
  HTTP POST + Authorization: Bearer <key>
       │
       ▼
  http://HOST:3282/mcp
       │
       ▼
MCP Router (Electron, on the VM)
  Aggregates the configured MCP servers (Excel, PowerPoint, …)
```

- Keys are issued in the app, under **Keys**.
- New keys start with **no MCP access**. Open **Permissions** on the key and
  grant servers, then tools. This can be changed later.
- New keys expire in **30 days** by default. At issue time you can choose 1 day,
  1 week, 30 days, 90 days, a custom number of days, or never.
- Keys issued before expiry enforcement stay valid, with no expiry, until they
  are re-issued.
- Expired keys are rejected on `/mcp` (401) and cannot list or call tools.
- The Electron window requires a local desktop administrator. Locking the UI
  does not stop the HTTP gateway.
- Remote clients use **native HTTP MCP** (`url` + `headers.Authorization`).
  Do not use `@mcp_router/cli` for the remote path — npm 0.2.0 ignores `--url`.
- Local clients on the same machine can still use localhost.

## Deploy on a small VM (4 GB) — recommended

Do **not** run `pnpm dev` on a 4 GB VM: the webpack build runs out of memory.
Get a packaged build instead and run that on the VM.

### 1) Get a build

**Preferred — a release.** Download the Windows installer from the repository's
**Releases** page. Releases are permanent, need no login, and carry `LICENSE.md`
and `NOTICE` as attachments.

Releases are cut by pushing a tag, which runs
`.github/workflows/release.yml` and drafts a release with builds for macOS and
Windows:

```bash
git tag v0.6.3
git push origin v0.6.3
```

The release is drafted, not published — review the assets, then publish it by
hand.

**Fallback — a CI artifact.** For an unreleased commit, the **Windows Azure
Package** workflow (`.github/workflows/windows-azure-package.yml`) builds on
every push to `main`, or on demand via **Actions → Windows Azure Package → Run
workflow**. It produces the artifact `mcp-router-windows-x64`.

Two limits make this the fallback rather than the default: Actions artifacts
require a signed-in GitHub account to download, and this one is deleted after
14 days (`retention-days: 14`).

Either way the build happens on a GitHub-hosted runner, which has more RAM
than a small VM.

### 2) Copy it onto the VM

For a release asset, download it directly on the VM, or copy it across and
extract. For a CI artifact, with the GitHub CLI:

```powershell
gh run download --repo OWNER/REPO -n mcp-router-windows-x64 -D C:\Users\USER\mcp-router-build
```

### 3) Install and run

- Prefer the Squirrel Setup `.exe` if present → install → launch **MCP Router**
- Electron needs an interactive desktop session (RDP) while the gateway runs

## Enable the gateway

1. Open **Settings → Enterprise Gateway**.
2. Enable the gateway.
3. Listen address `0.0.0.0`, service port `3282` (or your choice).
4. Set the **Client endpoint URL**, e.g. `http://HOST:3282/mcp`. Use `https://`
   only if TLS is terminated in front of the app.
5. **Save**, then **Restart now**.
6. Add your MCP servers and power them **LIVE**.
7. Open **Keys**, issue a named key per person or client, and pick an expiry.
8. On that key's row, open **Permissions**: enable the servers, then the tools
   that key may call. Tool names come from the last LIVE `tools/list` and are
   cached, so a server does not need to be LIVE for you to grant against it.
   Execution still requires it to be LIVE.
9. Copy the key, or the Client setup snippet, onto the client machine.

> **Add MCP config** writes the client config on the machine running the app.
> To configure a client on a different machine, use **Client setup** and paste
> the snippet there instead.

## Networking

- Firewall: allow inbound TCP on the MCP port (default **3282**) from your
  clients only.
- Prefer a private network or VPN. If the port is public, treat the key as a
  secret and rotate it.

## Environment overrides

| Variable | Purpose |
|---|---|
| `MCPR_HTTP_HOST` | Bind host (overrides settings) |
| `MCPR_HTTP_PORT` | Bind port |
| `MCPR_GATEWAY_PUBLIC_URL` | Public URL written into client config |

## Desktop admin lock

First launch asks you to create a local administrator (default username
`admin`). Later launches show an unlock screen. Use **Lock** in the sidebar or
in Settings when leaving the session.

- The password is stored as an argon2 hash in `shared-config.json`
  (`admin.passwordHash`). It is never sent to the renderer.
- If the password is lost, delete the `admin` object in `shared-config.json`
  and restart; the setup screen appears again.
- `/mcp` keeps serving while the window is locked.

## Smoke checks

```powershell
# Liveness (no auth)
Invoke-RestMethod http://127.0.0.1:3282/health

# Authenticated status
$headers = @{ Authorization = "Bearer $env:MCPR_TOKEN" }
Invoke-RestMethod http://127.0.0.1:3282/mcp/status -Headers $headers

# From another host
Invoke-RestMethod http://HOST:3282/health
```

Or run `scripts/smoke-gateway.ps1`.

## Client config shape

A client using native HTTP MCP should end up with something equivalent to:

```yaml
mcp_servers:
  mcp-router:
    url: "http://HOST:3282/mcp"
    headers:
      Authorization: "Bearer <key issued in the Keys panel>"
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Health works on the VM but not remotely | Open the firewall; confirm the gateway is enabled and the app restarted |
| Client sees no tools | Open **Permissions** and grant servers + tools; confirm the server is LIVE; check the key has not expired |
| Key not found | Issue a fresh key after a reinstall |
| Electron won't start | Needs an interactive desktop session |
| Connection refused | Still bound to `127.0.0.1` — enable the gateway, set `0.0.0.0`, restart |
