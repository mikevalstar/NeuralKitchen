// src/server.ts

import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { mcpService } from "./lib/services/mcp";
import { queueProcessor } from "./lib/services/queueProcessor";
import { createRouter } from "./router";

// Start services when the server starts
if (typeof window === "undefined") {
  queueProcessor.start();
  mcpService.start();
}

export default createStartHandler({
  createRouter,
})(defaultStreamHandler);
