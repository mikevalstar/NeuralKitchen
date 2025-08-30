import { PrismaClient } from "../generated/prisma/client";
import { logger } from "./logger.js";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
});

// Set up structured logging for Prisma events
prisma.$on("query", (e) => {
  const duration = e.duration;
  const isSlowQuery = duration > 1000; // Log queries slower than 1 second as warnings

  if (isSlowQuery) {
    logger.db.warn("Slow database query detected", {
      query: e.query,
      params: e.params,
      duration,
      target: e.target,
      timestamp: e.timestamp,
    });
  } else {
    logger.db.debug("Database query executed", {
      query: e.query,
      params: e.params,
      duration,
      target: e.target,
      timestamp: e.timestamp,
    });
  }
});

prisma.$on("error", (e) => {
  logger.db.error("Database error", {
    message: e.message,
    target: e.target,
    timestamp: e.timestamp,
  });
});

prisma.$on("info", (e) => {
  logger.db.info("Database info", {
    message: e.message,
    target: e.target,
    timestamp: e.timestamp,
  });
});

prisma.$on("warn", (e) => {
  logger.db.warn("Database warning", {
    message: e.message,
    target: e.target,
    timestamp: e.timestamp,
  });
});

// Add connection monitoring
logger.db.info("Prisma client initialized", {
  accelerateEnabled: true,
  logLevels: ["query", "error", "info", "warn"],
});

export default prisma;
