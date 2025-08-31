#!/usr/bin/env node

/**
 * Standalone MCP Server
 * Runs independently from the main application
 */

import "dotenv/config";
import type { Server } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type Request, type Response } from "express";
import { z } from "zod";
import { Prompts } from "./lib/data/prompts.js";
import { Recipes } from "./lib/data/recipes.js";
import { logger } from "./lib/logger.js";
import { SearchService } from "./lib/services/search.js";

class StandaloneMcpServer {
  private server: McpServer | null = null;
  private app: express.Express | null = null;
  private httpServer: Server | null = null;
  private readonly port = 3002;

  /**
   * Start the MCP server
   */
  async start() {
    if (this.httpServer) {
      logger.mcp.warn({ port: this.port }, "MCP server start requested but already running");
      return;
    }

    logger.mcp.info({ port: this.port }, "Starting standalone MCP server");
    const startupTimer = logger.createTimer("mcp", "server_startup");

    try {
      // Get prompts from database with fallback to constants
      logger.mcp.debug("Loading MCP server configuration from database");
      const [description, instructions] = await Promise.all([
        Prompts.getByKey("MCP_SERVER_DESCRIPTION"),
        Prompts.getByKey("MCP_SERVER_INSTRUCTIONS"),
      ]);

      // Create the MCP server
      logger.mcp.debug({
        name: "Neural Kitchen",
        version: "0.1.0",
        hasDescription: !!description,
        hasInstructions: !!instructions,
      }, "Creating MCP server instance");

      this.server = new McpServer(
        {
          name: "Neural Kitchen",
          version: "0.1.0",
          description,
        },
        {
          instructions,
        },
      );

      // Register tools
      logger.mcp.debug("Registering MCP tools");
      this.registerTools();

      // Create Express app
      logger.mcp.debug("Setting up Express application");
      this.app = express();
      this.app.use(express.json());

      // Register routes
      logger.mcp.debug("Registering HTTP routes");
      this.registerRoutes();

      // Start the HTTP server
      this.httpServer = this.app.listen(this.port, (error?: Error) => {
        if (error) {
          logger.mcp.error({ error: error.message, port: this.port }, "Failed to start MCP server");
          startupTimer.end({ success: false, error: error.message });
          process.exit(1);
        }

        logger.mcp.info({ port: this.port }, "MCP server started successfully");
        startupTimer.end({ success: true, port: this.port });
      });

      // Handle graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.mcp.error({
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      }, "Error during MCP server startup");
      startupTimer.end({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  stop() {
    logger.mcp.info({ port: this.port }, "Stopping MCP server");
    const shutdownTimer = logger.createTimer("mcp", "server_shutdown");

    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
      logger.mcp.debug("HTTP server closed");
    }

    if (this.server) {
      this.server.close();
      this.server = null;
      logger.mcp.debug("MCP server instance closed");
    }

    shutdownTimer.end({ success: true });
    logger.mcp.info("MCP server stopped successfully");
  }

  /**
   * Register MCP tools
   */
  private registerTools() {
    if (!this.server) return;

    // Get a single recipe by ID or shortId (full content)
    this.server.registerTool(
      "get_recipe",
      {
        title: "Get a single recipe by ID or shortId with full content",
        description: "Get a single recipe by ID or shortId with full content",
        inputSchema: {
          identifier: z.string().describe("Recipe ID or shortId to retrieve"),
          projects: z.array(z.string()).describe("Projects to search for recipes, (optional)").optional(),
        },
      },
      async (args, extra) => {
        const requestId = logger.generateRequestId();
        const timer = logger.createTimer("mcp", "get_recipe_tool");

        logger.mcp.info({
          requestId,
          tool: "get_recipe",
          identifier: args.identifier,
          projects: args.projects || null,
          sessionId: extra?.sessionId || null,
        }, "Tool execution started");

        try {
          const { identifier, projects } = args;

          // Try to get recipe by ID first, then by shortId
          let recipe = await Recipes.read(identifier);
          if (!recipe) {
            recipe = await Recipes.readByShortId(identifier);
          }

          if (!recipe || !recipe.currentVersion) {
            logger.mcp.warn({ requestId, identifier, tool: "get_recipe" }, "Recipe not found");
            timer.end({ success: false, reason: "recipe_not_found", identifier });

            return {
              content: [
                {
                  type: "text",
                  text: `Recipe not found: ${identifier}`,
                },
              ],
            };
          }

          // Check if recipe belongs to specified projects (if projects filter is provided)
          let projectWarning = "";
          if (projects && projects.length > 0) {
            const recipeProjectShortIds = recipe.currentVersion.projects?.map((p) => p.shortId) || [];
            const hasMatchingProject = projects.some((projectShortId) =>
              recipeProjectShortIds.includes(projectShortId),
            );

            if (!hasMatchingProject) {
              const projectNames = recipe.currentVersion.projects?.map((p) => p.title).join(", ") || "none";
              projectWarning = `\n\n*Note: This recipe is not associated with the specified projects. Recipe projects: ${projectNames}*`;
            }
          }

          // Return full recipe content
          logger.mcp.info({
            requestId,
            tool: "get_recipe",
            recipeId: recipe.id,
            shortId: recipe.shortId,
            title: recipe.currentVersion.title,
            hasProjectFilter: !!(projects && projects.length > 0),
            projectCount: recipe.currentVersion.projects?.length || 0,
          }, "Recipe retrieved successfully");

          timer.end({
            success: true,
            recipeId: recipe.id,
            shortId: recipe.shortId,
            title: recipe.currentVersion.title,
          });

          return {
            content: [
              {
                type: "text",
                text: `# ${recipe.currentVersion.title}\n\n${recipe.currentVersion.content}${projectWarning}`,
              },
            ],
          };
        } catch (error) {
          logger.mcp.error({
            requestId,
            tool: "get_recipe",
            identifier: args.identifier,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
          }, "Error in get_recipe tool");

          timer.end({ success: false, error: error instanceof Error ? error.message : "Unknown error" });

          return {
            content: [
              {
                type: "text",
                text: `Error retrieving recipe: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
          };
        }
      },
    );

    // Search recipes using the same logic as the UI
    this.server.registerTool(
      "search_recipes",
      {
        title: "Search Recipes",
        description: "Search recipes using semantic and text search with AI summaries",
        inputSchema: {
          query: z.string().describe("Search query to find relevant recipes"),
          projects: z.array(z.string()).describe("Projects to search for recipes, (optional)").optional(),
        },
      },
      async (args) => {
        const requestId = logger.generateRequestId();
        const timer = logger.createTimer("mcp", "search_recipes_tool");

        logger.mcp.info({
          requestId,
          tool: "search_recipes",
          query: args.query,
          projects: args.projects || null,
        }, "Tool execution started");

        try {
          const limit = 10;
          const { query, projects } = args;

          // Use hybrid search (vector + text fallback)
          const results = await SearchService.hybridSearch(query, limit, projects);

          if (results.length === 0) {
            logger.mcp.info({
              requestId,
              tool: "search_recipes",
              query,
              resultsCount: 0,
            }, "Search completed with no results");

            timer.end({ success: true, query, resultsCount: 0 });

            return {
              content: [
                {
                  type: "text",
                  text: `No recipes found for query: "${query}"`,
                },
              ],
            };
          }

          // Format results for AI consumption
          const formattedResults = results
            .map((result, index) => {
              const summary = result.summary || "No summary available";
              return `${index + 1}. **${result.title}** (ID: ${result.shortid})
   Summary: ${summary}
   
   *This is a short summary. Use get_recipe with ID "${result.shortid}" to get the full content.*`;
            })
            .join("\n\n");

          logger.mcp.info({
            requestId,
            tool: "search_recipes",
            query,
            resultsCount: results.length,
            topResults: results.slice(0, 3).map((r) => ({ shortId: r.shortid, title: r.title })),
          }, "Search completed successfully");

          timer.end({
            success: true,
            query,
            resultsCount: results.length,
            hasProjects: !!(projects && projects.length > 0),
          });

          return {
            content: [
              {
                type: "text",
                text: `Found ${results.length} recipe(s) for "${query}":\n\n${formattedResults}`,
              },
            ],
          };
        } catch (error) {
          logger.mcp.error({
            requestId,
            tool: "search_recipes",
            query: args.query,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
          }, "Error in search_recipes tool");

          timer.end({ success: false, query: args.query, error: error instanceof Error ? error.message : "Unknown error" });

          return {
            content: [
              {
                type: "text",
                text: `Error searching recipes: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
          };
        }
      },
    );
  }

  /**
   * Register Express routes for MCP endpoints
   */
  private registerRoutes() {
    if (!this.app || !this.server) return;

    // Health check endpoint
    this.app.get("/health", (_req: Request, res: Response) => {
      logger.mcp.debug("Health check requested");
      res.json({
        status: "healthy",
        server: "Neural Kitchen MCP Server",
        port: this.port,
        timestamp: new Date().toISOString(),
      });
    });

    // POST /mcp - Handle MCP requests
    this.app.post("/mcp", async (req: Request, res: Response) => {
      const requestId = logger.generateRequestId();
      const timer = logger.createTimer("mcp", "handle_mcp_request");

      logger.mcp.info({
        requestId,
        method: req.method,
        path: req.path,
        queryParams: req.query,
        hasBody: !!req.body,
        bodyMethod: req.body?.method || null,
        bodyId: req.body?.id || null,
      }, "MCP request received");

      try {
        const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });

        // Handle projects parameter injection
        if (req.query.projects && req.body?.params?.arguments) {
          const projectsParam = req.query.projects;
          logger.mcp.debug({ requestId, projectsParam }, "Injecting projects parameter");

          if (typeof projectsParam === "string") {
            req.body.params.arguments.projects = projectsParam.split(",");
          } else if (Array.isArray(projectsParam)) {
            req.body.params.arguments.projects = projectsParam;
          }
        }

        res.on("close", () => {
          logger.mcp.debug({ requestId }, "MCP request connection closed");
          transport.close();
          this.server?.close();
        });

        logger.mcp.debug({ requestId }, "Connecting MCP server to transport");
        if (this.server) {
          await this.server.connect(transport);
        }

        logger.mcp.debug({ requestId }, "Handling MCP request");
        await transport.handleRequest(req, res, req.body);

        timer.end({ success: true, method: req.body?.method || "unknown" });
        logger.mcp.info({ requestId }, "MCP request completed successfully");
      } catch (error) {
        logger.mcp.error({
          requestId,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          method: req.body?.method || "unknown",
        }, "Error handling MCP request");

        timer.end({ success: false, error: error instanceof Error ? error.message : "Unknown error" });

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
      logger.mcp.warn("GET request to /mcp - method not allowed");
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
      logger.mcp.warn("DELETE request to /mcp - method not allowed");
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
    const shutdown = (signal: string) => {
      logger.mcp.info({ signal }, "Received shutdown signal");
      this.stop();
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    logger.mcp.debug("Graceful shutdown handlers registered");
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
  mcpServer.start().catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  });
}

export { StandaloneMcpServer };
