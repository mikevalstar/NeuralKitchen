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
      console.log("MCP server is already running");
      return;
    }

    console.log("Starting standalone MCP server...");

    // Get prompts from database with fallback to constants
    const [description, instructions] = await Promise.all([
      Prompts.getByKey("MCP_SERVER_DESCRIPTION"),
      Prompts.getByKey("MCP_SERVER_INSTRUCTIONS"),
    ]);

    // Create the MCP server
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
        try {
          console.log("get_recipe", args, extra);
          const { identifier, projects } = args;

          // Try to get recipe by ID first, then by shortId
          let recipe = await Recipes.read(identifier);
          if (!recipe) {
            recipe = await Recipes.readByShortId(identifier);
          }

          if (!recipe || !recipe.currentVersion) {
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
          return {
            content: [
              {
                type: "text",
                text: `# ${recipe.currentVersion.title}\n\n${recipe.currentVersion.content}${projectWarning}`,
              },
            ],
          };
        } catch (error) {
          console.error("Error in get_recipe:", error);
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
        try {
          const limit = 10;
          const { query, projects } = args;
          console.info("search_recipes", args);

          // Use hybrid search (vector + text fallback)
          const results = await SearchService.hybridSearch(query, limit, projects);

          if (results.length === 0) {
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

          return {
            content: [
              {
                type: "text",
                text: `Found ${results.length} recipe(s) for "${query}":\n\n${formattedResults}`,
              },
            ],
          };
        } catch (error) {
          console.error("Error in search_recipes:", error);
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

        console.info("Query params", req.query.projects);

        if (req.query.projects && req.body?.params?.arguments) {
          const projectsParam = req.query.projects;
          if (typeof projectsParam === "string") {
            req.body.params.arguments.projects = projectsParam.split(",");
          } else if (Array.isArray(projectsParam)) {
            req.body.params.arguments.projects = projectsParam;
          }
        }

        console.info("Body", req.body);

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
  mcpServer.start().catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  });
}

export { StandaloneMcpServer };
