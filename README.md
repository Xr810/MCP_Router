# MCP Router

A fork of [MCP Router](https://github.com/mcp-router/mcp-router) — desktop MCP aggregator and **Enterprise Gateway** for Hermes / NemoHermes.

## What this fork adds

- Official MCP Router branding
- HTTP enterprise gateway (`0.0.0.0` bind, Bearer tokens, client endpoint URL)
- Hermes-first Apps flow with native HTTP YAML (`url` + `Authorization`)
- Windows Azure packaging workflow for low-RAM VMs

## Docs

- End-to-end Azure + Hermes: [`docs/JE_AZURE_HERMES.md`](docs/JE_AZURE_HERMES.md)

## Repo

- https://github.com/meghamshb2006/mcprouter

## Develop

```bash
pnpm install
pnpm --filter @mcp_router/electron dev
```

## License

See [LICENSE.md](LICENSE.md). Upstream MCP Router attribution retained.
