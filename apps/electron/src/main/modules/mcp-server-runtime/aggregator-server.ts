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
} from "@modelcontextprotocol/sdk/types.js";
import { RequestHandlers } from "./request-handlers";
import { MCPServerManager } from "../mcp-server-manager/mcp-server-manager";
import { getLogService } from "@/main/modules/mcp-logger/mcp-logger.service";
import type { ToolCatalogService } from "@/main/modules/tool-catalog/tool-catalog.service";

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

  constructor(
    serverManager: MCPServerManager,
    toolCatalogService?: ToolCatalogService,
  ) {
    this.requestHandlers = new RequestHandlers(
      serverManager,
      toolCatalogService,
    );
  }

  /**
   * Handle one Streamable HTTP MCP request (initialize or follow-up).
   */
  public async handleStreamableHttpRequest(
    req: IncomingMessage,
    res: ServerResponse,
    parsedBody: unknown,
  ): Promise<void> {
    const sessionHeader = req.headers["mcp-session-id"];
    const sessionId =
      typeof sessionHeader === "string"
        ? sessionHeader
        : Array.isArray(sessionHeader)
          ? sessionHeader[0]
          : undefined;

    if (sessionId) {
      const existing = this.httpSessions.get(sessionId);
      if (!existing) {
        if (!res.headersSent) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32001,
                message: "Session not found",
              },
              id: null,
            }),
          );
        }
        return;
      }
      await existing.transport.handleRequest(req, res, parsedBody);
      return;
    }

    // New session (typically initialize) — fresh Server + Transport per session
    const server = this.createServer();
    this.wireHandlers(server);

    let assignedSessionId: string | undefined;
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => {
        assignedSessionId = randomUUID();
        return assignedSessionId;
      },
      onsessioninitialized: async (id) => {
        this.httpSessions.set(id, { server, transport });
      },
    });

    transport.onclose = () => {
      if (assignedSessionId) {
        this.httpSessions.delete(assignedSessionId);
      }
      void server.close().catch(() => undefined);
    };

    await server.connect(transport);
    await transport.handleRequest(req, res, parsedBody);
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
