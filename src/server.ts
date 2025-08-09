// src/server.ts
// This project developed with AI assistance (Cursor/Claude)
// Human review and testing applied to all AI-generated code

import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { queueProcessor } from "./lib/services/queueProcessor";
import { createRouter } from "./router";

// Start services when the server starts
if (typeof window === "undefined") {
  queueProcessor.start();
  // Note: MCP service now runs as a separate process
}

export default createStartHandler({
  createRouter,
})(defaultStreamHandler);
