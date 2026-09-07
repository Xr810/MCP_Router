# Security policy

## Reporting a vulnerability

Report vulnerabilities in **this fork** privately, through GitHub's
[private vulnerability reporting](https://docs.github.com/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
on this repository: **Security → Report a vulnerability**.

Please do not open a public issue for a security problem.

Include what you have: affected version, what you did, what happened, and how
severe you think it is. A proof of concept helps but is not required.

If the problem is in upstream [MCP Router](https://github.com/mcp-router/mcp-router)
rather than in this fork's additions, report it upstream — this fork cannot fix
upstream code for anyone but its own users.

This is a personal fork, maintained on a best-effort basis. There is no
guaranteed response time and no bug bounty.

## Supported versions

Only the latest release is supported. This fork's version line starts at 1.0.0
and is independent of upstream's; see `NOTICE` for the upstream baseline.

| Version | Supported |
|---|---|
| 1.0.x | Yes |
| Anything older, or upstream versions | No — report upstream |

## Scope of this fork's security work

The fork exists to put access control in front of an aggregator that upstream
designed for a single trusted user at a single desktop. Its security-relevant
behaviour:

- Bearer keys start with **no** access. Servers and tools are granted
  explicitly, never revoked after the fact.
- Keys expire — 30 days by default. Expired keys are rejected at `/mcp` and
  cannot list or call tools.
- Cached tool lists decide what you can **grant**, never what you can **run**.
  Execution still requires the server to be live.
- The desktop admin lock covers the **UI, not the service**. Locking the window
  deliberately does not stop the HTTP gateway.

Notes on the hardening work, including upstream's, are in
[`docs/security-notes.md`](docs/security-notes.md).

## Known unfixed issues inherited from upstream

These are documented rather than silently carried:

- `apps/electron/src/main/modules/workspace/workspace.ipc.ts` — the
  `workspace:get-credentials` IPC handler returns a decrypted workspace token
  to the renderer with no authorization guard. A compromised renderer could
  read workspace credentials. Upstream identified this and it is still open.

## Deployment guidance

The HTTP gateway has no transport security of its own. If you bind it beyond
`127.0.0.1`:

- Put it on a private network or VPN, or terminate TLS in front of it.
- Restrict the port to known clients at the firewall.
- Treat every issued key as a secret, give each client its own, and set an
  expiry.

See [`docs/REMOTE_DEPLOYMENT.md`](docs/REMOTE_DEPLOYMENT.md).
