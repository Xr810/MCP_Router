const { describe, it, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const os = require("node:os");

process.env.TS_NODE_PROJECT = path.join(__dirname, "../tsconfig.json");

const originalLoad = Module._load;
Module._load = function loadWithElectronStub(request, parent, isMain) {
  if (request === "electron") {
    return {
      app: {
        getPath: () => path.join(os.tmpdir(), "mcp-router-token-test"),
      },
    };
  }
  if (request === "@mcp_router/shared") {
    return {
      DEFAULT_TOKEN_TTL_SECONDS: 30 * 24 * 60 * 60,
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

require("ts-node/register/transpile-only");

const {
  McpAppsManagerRepository,
} = require("../src/main/modules/mcp-apps-manager/mcp-apps-manager.repository.ts");
const {
  TokenManager,
} = require("../src/main/modules/mcp-apps-manager/token-manager.ts");

describe("TokenManager", () => {
  let tokens;

  beforeEach(() => {
    tokens = new Map();
    McpAppsManagerRepository.getInstance = () => ({
      getToken: (id) => tokens.get(id) || null,
      getTokensByClientId: (clientId) =>
        Array.from(tokens.values()).filter(
          (token) => token.clientId === clientId,
        ),
      deleteClientTokens: (clientId) => {
        let count = 0;
        for (const [id, token] of tokens.entries()) {
          if (token.clientId === clientId) {
            tokens.delete(id);
            count += 1;
          }
        }
        return count;
      },
      saveToken: (token) => {
        tokens.set(token.id, token);
      },
      deleteToken: (id) => tokens.delete(id),
      listTokens: () => Array.from(tokens.values()),
      updateTokenServerAccess: (id, serverAccess, toolAccess) => {
        const token = tokens.get(id);
        if (!token) return false;
        token.serverAccess = serverAccess || {};
        if (toolAccess !== undefined) {
          token.toolAccess = toolAccess;
        }
        return true;
      },
    });
  });

  after(() => {
    Module._load = originalLoad;
  });

  it("keeps legacy tokens without expiresAt valid after the TTL feature is introduced", () => {
    const issuedAtMoreThanThirtyDaysAgo =
      Math.floor(Date.now() / 1000) - 31 * 24 * 60 * 60;
    tokens.set("mcpr_legacy", {
      id: "mcpr_legacy",
      clientId: "codex",
      issuedAt: issuedAtMoreThanThirtyDaysAgo,
      serverAccess: {},
    });

    const validation = new TokenManager().validateToken("mcpr_legacy");

    assert.deepEqual(validation, {
      isValid: true,
      clientId: "codex",
    });
  });

  it("rejects tokens whose expiresAt has passed", () => {
    tokens.set("mcpr_expired", {
      id: "mcpr_expired",
      clientId: "codex",
      issuedAt: Math.floor(Date.now() / 1000) - 60,
      expiresAt: Math.floor(Date.now() / 1000) - 1,
      serverAccess: { excel: true },
    });

    const manager = new TokenManager();
    const validation = manager.validateToken("mcpr_expired");

    assert.equal(validation.isValid, false);
    assert.equal(validation.error, "Token expired");
    assert.equal(manager.hasServerAccess("mcpr_expired", "excel"), false);
    assert.equal(manager.hasToolAccess("mcpr_expired", "excel", "read"), false);
  });

  it("sets expiresAt on newly generated tokens", () => {
    const before = Math.floor(Date.now() / 1000);

    const token = new TokenManager().generateToken({
      clientId: "codex",
      serverAccess: {},
    });

    assert.equal(token.clientId, "codex");
    assert.match(token.id, /^mcpr_[A-Za-z0-9_-]+$/);
    assert.equal(typeof token.expiresAt, "number");
    assert.ok(token.expiresAt >= before + 30 * 24 * 60 * 60);
    assert.deepEqual(token.toolAccess, {});
  });

  it("omits expiresAt when expiresIn is null", () => {
    const token = new TokenManager().generateToken({
      clientId: "forever",
      serverAccess: {},
      expiresIn: null,
    });

    assert.equal(token.expiresAt, undefined);
    assert.equal(new TokenManager().validateToken(token.id).isValid, true);
  });

  it("denies tools on new keys until an admin grants them", () => {
    const token = new TokenManager().generateToken({
      clientId: "alice",
      serverAccess: { excel: true },
    });

    const manager = new TokenManager();
    assert.equal(manager.hasServerAccess(token.id, "excel"), true);
    assert.equal(manager.hasToolAccess(token.id, "excel", "read"), false);

    manager.updateTokenServerAccess(
      token.id,
      { excel: true },
      { excel: { read: true } },
    );
    assert.equal(manager.hasToolAccess(token.id, "excel", "read"), true);
    assert.equal(manager.hasToolAccess(token.id, "excel", "write"), false);
  });

  it("keeps legacy tokens without toolAccess able to call tools on granted servers", () => {
    tokens.set("mcpr_legacy_tools", {
      id: "mcpr_legacy_tools",
      clientId: "hermes",
      issuedAt: Math.floor(Date.now() / 1000),
      serverAccess: { excel: true },
    });

    const manager = new TokenManager();
    assert.equal(
      manager.hasToolAccess("mcpr_legacy_tools", "excel", "read"),
      true,
    );
    assert.equal(
      manager.hasToolAccess("mcpr_legacy_tools", "ppt", "read"),
      false,
    );
  });
});
