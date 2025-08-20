// src/background-tasks.ts
// This project developed with AI assistance (Cursor/Claude)
// Human review and testing applied to all AI-generated code

import { queueProcessor } from "./lib/services/queueProcessor";

console.log("Starting background tasks...");
queueProcessor.start();

// Graceful shutdown handling
process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down background tasks...");
  queueProcessor.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down background tasks...");
  queueProcessor.stop();
  process.exit(0);
});