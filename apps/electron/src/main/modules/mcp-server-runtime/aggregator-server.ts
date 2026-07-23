import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  isInitializeRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { RequestHandlers } from "./request-handlers";
import { MCPServerManager } from "../mcp-server-manager/mcp-server-manager";
import { getLogService } from "@/main/modules/mcp-logger/mcp-logger.service";
import type { ToolCatalogService } from "@/main/modules/tool-catalog/tool-catalog.service";

/** Bumped when Streamable HTTP session handling changes — exposed on /health. */
export const MCP_HTTP_BUILD = "2026-07-23-streamable-v3";

type HttpSession = {
  server: Server;
  transport: StreamableHTTPServerTransport;
};

/**
 * MCP Aggregator Server that combines multiple MCP servers into one.
 *
 * Streamable HTTP uses a session map: SDK 1.26+ forbids reusing one
 * stateless transport across requests (empty HTTP 500s for Hermes/clients).
 */
export class AggregatorServer {
  private requestHandlers: RequestHandlers;
  private httpSessions = new Map<string, HttpSession>();
  private lastHttpError: string | null = null;

  constructor(
    serverManager: MCPServerManager,
    toolCatalogService?: ToolCatalogService,
  ) {
    this.requestHandlers = new RequestHandlers(
      serverManager,
      toolCatalogService,
    );
  }

  public getHttpSessionCount(): number {
    return this.httpSessions.size;
  }

  public getLastHttpError(): string | null {
    return this.lastHttpError;
  }

  private writeJson(
    res: ServerResponse,
    status: number,
    body: Record<string, unknown>,
  ): void {
    if (res.headersSent) {
      return;
    }
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  }

  private resolveSessionId(req: IncomingMessage): string | undefined {
    const sessionHeader = req.headers["mcp-session-id"];
    if (typeof sessionHeader === "string") {
      return sessionHeader;
    }
    if (Array.isArray(sessionHeader)) {
      return sessionHeader[0];
    }
    return undefined;
  }

  /**
   * Handle one Streamable HTTP MCP POST (initialize or follow-up).
   *
   * Matches the MCP SDK Express session pattern: one Server+Transport per
   * session, JSON responses, never reuse a transport across sessions.
   */
  public async handleStreamableHttpRequest(
    req: IncomingMessage,
    res: ServerResponse,
    parsedBody: unknown,
  ): Promise<void> {
    try {
      const sessionId = this.resolveSessionId(req);

      if (sessionId && this.httpSessions.has(sessionId)) {
        const existing = this.httpSessions.get(sessionId)!;
        await existing.transport.handleRequest(req, res, parsedBody);
        return;
      }

      if (sessionId && !this.httpSessions.has(sessionId)) {
        this.writeJson(res, 404, {
          jsonrpc: "2.0",
          error: { code: -32001, message: "Session not found" },
          id: null,
        });
        return;
      }

      // No session header — only initialize may start a new session
      if (!isInitializeRequest(parsedBody)) {
        this.writeJson(res, 400, {
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message:
              "Bad Request: Mcp-Session-Id required (or send initialize first)",
          },
          id:
            parsedBody &&
            typeof parsedBody === "object" &&
            !Array.isArray(parsedBody)
              ? ((parsedBody as { id?: unknown }).id ?? null)
              : null,
        });
        return;
      }

      const server = this.createServer();
      this.wireHandlers(server);

      let transport: StreamableHTTPServerTransport;
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: (id) => {
          this.httpSessions.set(id, { server, transport });
        },
        onsessionclosed: (id) => {
          this.httpSessions.delete(id);
        },
      });

      transport.onclose = () => {
        const id = transport.sessionId;
        if (id) {
          this.httpSessions.delete(id);
        }
        void server.close().catch(() => undefined);
      };

      transport.onerror = (error) => {
        this.lastHttpError = error.message || String(error);
        console.error("[MCP StreamableHTTP transport error]", error);
      };

      await server.connect(transport);
      await transport.handleRequest(req, res, parsedBody);
    } catch (error) {
      this.lastHttpError =
        error instanceof Error ? error.message : String(error);
      console.error("[MCP StreamableHTTP POST failed]", error);
      this.writeJson(res, 500, {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: this.lastHttpError,
        },
        id: null,
      });
    }
  }

  /**
   * GET /mcp — standalone SSE stream for an existing session (Hermes/clients).
   */
  public async handleStreamableHttpGet(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    try {
      const sessionId = this.resolveSessionId(req);
      if (!sessionId || !this.httpSessions.has(sessionId)) {
        this.writeJson(res, 400, {
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Invalid or missing Mcp-Session-Id",
          },
          id: null,
        });
        return;
      }
      await this.httpSessions
        .get(sessionId)!
        .transport.handleRequest(req, res);
    } catch (error) {
      this.lastHttpError =
        error instanceof Error ? error.message : String(error);
      console.error("[MCP StreamableHTTP GET failed]", error);
      this.writeJson(res, 500, {
        jsonrpc: "2.0",
        error: { code: -32603, message: this.lastHttpError },
        id: null,
      });
    }
  }

  /**
   * DELETE /mcp — terminate a session (MCP Streamable HTTP spec).
   */
  public async handleStreamableHttpDelete(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    try {
      const sessionId = this.resolveSessionId(req);
      if (!sessionId || !this.httpSessions.has(sessionId)) {
        this.writeJson(res, 404, {
          jsonrpc: "2.0",
          error: { code: -32001, message: "Session not found" },
          id: null,
        });
        return;
      }
      await this.httpSessions
        .get(sessionId)!
        .transport.handleRequest(req, res);
    } catch (error) {
      this.lastHttpError =
        error instanceof Error ? error.message : String(error);
      console.error("[MCP StreamableHTTP DELETE failed]", error);
      this.writeJson(res, 500, {
        jsonrpc: "2.0",
        error: { code: -32603, message: this.lastHttpError },
        id: null,
      });
    }
  }

  /**
   * Connect a legacy SSE transport to a fresh wired aggregator Server.
   */
  public async connectSseTransport(
    transport: Parameters<Server["connect"]>[0],
  ): Promise<Server> {
    const server = this.createServer();
    this.wireHandlers(server);
    await server.connect(transport);
    return server;
  }

  /**
   * @deprecated Prefer handleStreamableHttpRequest — singleton transport is unsafe on SDK 1.26+.
   */
  public getTransport(): StreamableHTTPServerTransport {
    throw new Error(
      "getTransport() is no longer supported; use handleStreamableHttpRequest()",
    );
  }

  /**
   * @deprecated Prefer connectSseTransport / handleStreamableHttpRequest.
   */
  public getAggregatorServer(): Server {
    const server = this.createServer();
    this.wireHandlers(server);
    return server;
  }

  private createServer(): Server {
    const server = new Server(
      {
        name: "mcp-aggregator",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      },
    );

    server.onerror = (error) => {
      console.error("[MCP Aggregator Error]", error);
      getLogService().recordMcpRequestLog({
        timestamp: new Date().toISOString(),
        requestType: "ServerError",
        params: {},
        result: "error",
        errorMessage: error.message || "Unknown server error",
        duration: 0,
        clientId: "mcp-router-system",
      });
    };

    return server;
  }

  private wireHandlers(server: Server): void {
    server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      const token = request.params?._meta?.token as string | undefined;
      const projectId = request.params?._meta?.projectId;
      return await this.requestHandlers.handleListTools(token, projectId);
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return await this.requestHandlers.handleCallTool(request);
    });

    server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
      const token = request.params?._meta?.token as string | undefined;
      const projectId = request.params?._meta?.projectId;
      return await this.requestHandlers.handleListResources(token, projectId);
    });

    server.setRequestHandler(
      ListResourceTemplatesRequestSchema,
      async (request) => {
        const token = request.params?._meta?.token as string | undefined;
        const projectId = request.params?._meta?.projectId;
        return await this.requestHandlers.handleListResourceTemplates(
          token,
          projectId,
        );
      },
    );

    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const token = request.params?._meta?.token as string | undefined;
      const projectId = request.params?._meta?.projectId;
      return await this.requestHandlers.readResourceByUri(
        uri,
        token,
        projectId,
      );
    });

    server.setRequestHandler(ListPromptsRequestSchema, async (request) => {
      const token = request.params?._meta?.token as string | undefined;
      const projectId = request.params?._meta?.projectId;
      const allPrompts = await this.requestHandlers.getAllPromptsInternal(
        token,
        projectId,
      );
      return { prompts: allPrompts };
    });

    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const promptName = request.params.name;
      const token = request.params?._meta?.token as string | undefined;
      const projectId = request.params?._meta?.projectId;
      return await this.requestHandlers.getPromptByName(
        promptName,
        request.params.arguments,
        token,
        projectId,
      );
    });
  }

  public async shutdown(): Promise<void> {
    const sessions = [...this.httpSessions.values()];
    this.httpSessions.clear();
    for (const session of sessions) {
      try {
        await session.transport.close();
      } catch {
        /* ignore */
      }
      try {
        await session.server.close();
      } catch (err) {
        console.error("Error shutting down aggregator session:", err);
      }
    }
  }
}
