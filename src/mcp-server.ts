#!/usr/bin/env node

/**
 * Standalone MCP Server
 * Runs independently from the main application
 */

import type { Server } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Request, type Response } from "express";

class StandaloneMcpServer {
  private server: McpServer | null = null;
  private app: express.Express | null = null;
  private httpServer: Server | null = null;
  private readonly port = 3002;

  /**
   * Start the MCP server
   */
  start() {
    if (this.httpServer) {
      console.log("MCP server is already running");
      return;
    }

    console.log("Starting standalone MCP server...");

    // Create the MCP server
    this.server = new McpServer(
      {
        name: "Neural Kitchen",
        version: "0.1.0",
        description:
          "A MCP server providing AI coding assistants with reusable recipes and procedures for common tasks and projects. It is a collection of recipes and procedures for use in determining next steps on a task and prescriptive instructions.",
      },
      {
        instructions: `This provides a list of reusable tasks and procedures also known as cookbooks or recipes for use in determining next steps on a task and prescriptive instructions.

      The recipe, cookbook, or procedure is a list of steps to complete a task.
      The recipe, cookbook, or procedure is written in markdown format.
      The recipe, cookbook, or procedure is written in a way that is easy to understand and follow.

      When you know the name of the recipe, cookbook, or procedure you want to use, you can use the read_recipe tool to read the recipe, cookbook, or procedure.

      You should follow these recipes when there is one available, it will help you complete the task.
      `,
      },
    );

    // Register tools
    this.registerTools();

    // Create Express app
    this.app = express();
    this.app.use(express.json());

    // Register routes
    this.registerRoutes();

    // Start the HTTP server
    this.httpServer = this.app.listen(this.port, (error?: Error) => {
      if (error) {
        console.error("Failed to start MCP server:", error);
        process.exit(1);
      }
      console.log(`🚀 MCP Stateless Streamable HTTP Server listening on port ${this.port}`);
    });

    // Handle graceful shutdown
    this.setupGracefulShutdown();
  }

  /**
   * Stop the MCP server
   */
  stop() {
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
      console.log("MCP server stopped");
    }

    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  /**
   * Register MCP tools
   */
  private registerTools() {
    if (!this.server) return;

    // Hello world tool (example)
    this.server.tool("hello_world", "Hello World", {}, async () => {
      return {
        content: [
          {
            type: "text",
            text: "Hello World from Neural Kitchen MCP Server!",
          },
        ],
      };
    });

    // TODO: Add your custom tools here
    // You can import and register additional tools as needed
  }

  /**
   * Register Express routes for MCP endpoints
   */
  private registerRoutes() {
    if (!this.app || !this.server) return;

    // Health check endpoint
    this.app.get("/health", (_req: Request, res: Response) => {
      res.json({
        status: "healthy",
        server: "Neural Kitchen MCP Server",
        port: this.port,
        timestamp: new Date().toISOString(),
      });
    });

    // POST /mcp - Handle MCP requests
    this.app.post("/mcp", async (req: Request, res: Response) => {
      try {
        const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });

        res.on("close", () => {
          console.log("Request closed");
          transport.close();
          this.server?.close();
        });

        if (this.server) {
          await this.server.connect(transport);
        }
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error",
            },
            id: null,
          });
        }
      }
    });

    // GET /mcp - Not supported in stateless mode
    this.app.get("/mcp", async (_req: Request, res: Response) => {
      console.log("Received GET MCP request");
      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Method not allowed.",
          },
          id: null,
        }),
      );
    });

    // DELETE /mcp - Not needed in stateless mode
    this.app.delete("/mcp", async (_req: Request, res: Response) => {
      console.log("Received DELETE MCP request");
      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Method not allowed.",
          },
          id: null,
        }),
      );
    });
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown() {
    const shutdown = () => {
      console.log("\n🛑 Shutting down MCP server gracefully...");
      this.stop();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  /**
   * Get current MCP server status
   */
  getStatus() {
    return {
      isRunning: this.httpServer !== null,
      port: this.port,
      hasServer: this.server !== null,
    };
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const mcpServer = new StandaloneMcpServer();
  mcpServer.start();
}

export { StandaloneMcpServer };
