// src/background-tasks.ts
// This project developed with AI assistance (Cursor/Claude)
// Human review and testing applied to all AI-generated code

import "dotenv/config";
import { Settings } from "./lib/data/settings";
import { logger } from "./lib/logger.js";
import { queueProcessor } from "./lib/services/queueProcessor";

logger.tasks.info("Starting background tasks processor");

async function main() {
  const startupTimer = logger.createTimer("tasks", "background_tasks_startup");

  try {
    // Initialize settings cache
    logger.tasks.info("Loading application settings");
    await Settings.loadSettings();

    logger.tasks.info("Starting queue processor");
    queueProcessor.start();

    startupTimer.end({ success: true });
    logger.tasks.info("Background tasks processor started successfully");
  } catch (error) {
    logger.tasks.error("Failed to start background tasks", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    startupTimer.end({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on("SIGINT", () => {
  logger.tasks.info("Received SIGINT signal, initiating graceful shutdown");
  const shutdownTimer = logger.createTimer("tasks", "background_tasks_shutdown");

  queueProcessor.stop();
  shutdownTimer.end({ success: true, signal: "SIGINT" });
  logger.tasks.info("Background tasks processor stopped successfully");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.tasks.info("Received SIGTERM signal, initiating graceful shutdown");
  const shutdownTimer = logger.createTimer("tasks", "background_tasks_shutdown");

  queueProcessor.stop();
  shutdownTimer.end({ success: true, signal: "SIGTERM" });
  logger.tasks.info("Background tasks processor stopped successfully");
  process.exit(0);
});

main();
