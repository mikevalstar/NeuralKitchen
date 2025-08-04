// src/server.ts
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { queueProcessor } from "./lib/services/queueProcessor";
import { createRouter } from "./router";

// Start the queue processor when the server starts
if (typeof window === "undefined") {
  queueProcessor.start();
}

export default createStartHandler({
  createRouter,
})(defaultStreamHandler);
