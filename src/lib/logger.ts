/**
 * Neural Kitchen Logging System
 *
 * A comprehensive logging solution using Pino with:
 * - Component-specific loggers (web, mcp, tasks, auth, db)
 * - Pretty console output for development
 * - Structured JSON file logging
 * - Performance timing utilities
 * - Request correlation IDs
 *
 * Basic Usage:
 * ```typescript
 * import { logger } from '~/lib/logger';
 *
 * // Component-specific logging
 * logger.web.info('User logged in', { userId: 'user123' });
 * logger.mcp.error('Tool execution failed', { tool: 'search', error: 'timeout' });
 * logger.tasks.info('Queue processed', { jobsCompleted: 5 });
 *
 * // General logging
 * logger.info('Application started');
 * logger.error('Critical error', { error: 'database connection failed' });
 *
 * // Performance timing
 * const timer = logger.createTimer('web', 'user_registration');
 * // ... do work ...
 * timer.end({ userId: 'user123', success: true });
 * ```
 */

import fs from "node:fs";
import path from "node:path";
import pino from "pino";

export type LogComponent = "web" | "mcp" | "tasks" | "auth" | "db" | "general";

interface LoggerConfig {
  level: string;
  logDir: string;
  toFile: boolean;
  toConsole: boolean;
  prettyConsole: boolean;
}

/**
 * Load logger configuration from environment variables
 *
 * Environment Variables:
 * - LOG_LEVEL: Log level (debug, info, warn, error) - default: info
 * - LOG_DIR: Directory for log files - default: ./logs
 * - LOG_TO_FILE: Enable file logging - default: false
 * - LOG_TO_CONSOLE: Enable console logging - default: true
 * - LOG_PRETTY_CONSOLE: Pretty console formatting in dev - default: true
 */
function getConfig(): LoggerConfig {
  return {
    level: process.env.LOG_LEVEL || "info",
    logDir: process.env.LOG_DIR || "./logs",
    toFile: process.env.LOG_TO_FILE === "true",
    toConsole: process.env.LOG_TO_CONSOLE === "true",
    prettyConsole: process.env.LOG_PRETTY_CONSOLE === "true",
  };
}

function createLogDirectory(logDir: string) {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

/**
 * Main Logger class that provides component-specific logging
 *
 * Features:
 * - Separate log files for each component (app.log, mcp.log, etc.)
 * - Combined log file for all components
 * - Pretty console output in development
 * - Performance timing with request correlation
 * - Structured JSON logging for production
 */
class Logger {
  private baseLogger: pino.Logger;
  private config: LoggerConfig;
  private componentLoggers: Map<LogComponent, pino.Logger> = new Map();

  constructor() {
    this.config = getConfig();

    const streams: pino.DestinationStream[] = [];

    // Console transport
    if (this.config.toConsole) {
      if (this.config.prettyConsole && process.env.NODE_ENV !== "production") {
        streams.push({
          stream: pino.transport({
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
              messageFormat: "[{component}] {msg}",
            },
          }),
        });
      } else {
        streams.push({ stream: process.stdout });
      }
    }

    // File transport
    if (this.config.toFile) {
      createLogDirectory(this.config.logDir);

      try {
        const logPath = path.join(this.config.logDir, "combined.log");
        const dest = pino.destination({
          dest: logPath,
          sync: false, // Async for better performance
        });

        dest.on("error", (err) => {
          console.error("Pino destination error:", err);
        });

        streams.push({ stream: dest });
      } catch (err) {
        console.error("Failed to create pino destination:", err);
      }
    }

    this.baseLogger = pino(
      {
        level: this.config.level,
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label) => ({ level: label }),
        },
      },
      pino.multistream(streams),
    );
  }

  private createComponentLogger(component: LogComponent): pino.Logger {
    if (this.componentLoggers.has(component)) {
      const logger = this.componentLoggers.get(component);
      if (logger) return logger;
    }

    const streams: pino.DestinationStream[] = [];

    // Console transport
    if (this.config.toConsole) {
      if (this.config.prettyConsole && process.env.NODE_ENV !== "production") {
        streams.push({
          stream: pino.transport({
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
              messageFormat: `[${component.toUpperCase()}] {msg}`,
            },
          }),
        });
      } else {
        streams.push({ stream: process.stdout });
      }
    }

    // Component-specific file
    if (this.config.toFile) {
      const componentFile = this.getComponentLogFile(component);
      if (componentFile) {
        try {
          const dest = pino.destination({
            dest: componentFile,
            sync: false,
          });
          dest.on("error", (err) => {
            console.error(`Pino destination error for ${component}:`, err);
          });
          streams.push({ stream: dest });
        } catch (err) {
          console.error(`Failed to create pino destination for ${component}:`, err);
        }
      }

      // Also write to combined log
      try {
        const combinedDest = pino.destination({
          dest: path.join(this.config.logDir, "combined.log"),
          sync: false,
        });
        combinedDest.on("error", (err) => {
          console.error("Pino combined destination error:", err);
        });
        streams.push({ stream: combinedDest });
      } catch (err) {
        console.error("Failed to create combined pino destination:", err);
      }
    }

    const componentLogger = pino(
      {
        level: this.config.level,
        timestamp: pino.stdTimeFunctions.isoTime,
        base: { component },
        formatters: {
          level: (label) => ({ level: label }),
        },
      },
      pino.multistream(streams),
    );

    this.componentLoggers.set(component, componentLogger);
    return componentLogger;
  }

  private getComponentLogFile(component: LogComponent): string | null {
    const logDir = this.config.logDir;

    switch (component) {
      case "mcp":
        return path.join(logDir, "mcp.log");
      case "tasks":
        return path.join(logDir, "background-tasks.log");
      case "auth":
        return path.join(logDir, "auth.log");
      case "db":
        return path.join(logDir, "database.log");
      case "web":
        return path.join(logDir, "app.log");
      case "general":
        return path.join(logDir, "app.log");
      default:
        return null;
    }
  }

  // Component-specific logger getters - logs to both component file and combined.log
  get web() {
    return this.createComponentLogger("web");
  } // -> app.log + combined.log
  get mcp() {
    return this.createComponentLogger("mcp");
  } // -> mcp.log + combined.log
  get tasks() {
    return this.createComponentLogger("tasks");
  } // -> background-tasks.log + combined.log
  get auth() {
    return this.createComponentLogger("auth");
  } // -> auth.log + combined.log
  get db() {
    return this.createComponentLogger("db");
  } // -> database.log + combined.log
  get general() {
    return this.createComponentLogger("general");
  } // -> app.log + combined.log

  // Direct access to base logger (combined.log only)
  get base() {
    return this.baseLogger;
  }

  // Convenience methods for general logging (same as logger.general.*)
  info(msg: string, obj?: Record<string, unknown>) {
    if (obj) {
      this.general.info(obj, msg);
    } else {
      this.general.info(msg);
    }
  }
  error(msg: string, obj?: Record<string, unknown>) {
    if (obj) {
      this.general.error(obj, msg);
    } else {
      this.general.error(msg);
    }
  }
  warn(msg: string, obj?: Record<string, unknown>) {
    if (obj) {
      this.general.warn(obj, msg);
    } else {
      this.general.warn(msg);
    }
  }
  debug(msg: string, obj?: Record<string, unknown>) {
    if (obj) {
      this.general.debug(obj, msg);
    } else {
      this.general.debug(msg);
    }
  }
  trace(msg: string, obj?: Record<string, unknown>) {
    if (obj) {
      this.general.trace(obj, msg);
    } else {
      this.general.trace(msg);
    }
  }

  /**
   * Generate a unique request ID for correlating logs across components
   * Format: req_{timestamp}_{randomString}
   *
   * @returns A unique request ID string
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a performance timer for measuring operation duration
   *
   * Usage:
   * ```typescript
   * const timer = logger.createTimer('web', 'user_registration');
   * // ... perform operation ...
   * const duration = timer.end({ userId: 'user123', success: true });
   * ```
   *
   * @param component - The component performing the operation
   * @param operation - Description of the operation being timed
   * @returns Timer object with end() method
   */
  createTimer(component: LogComponent, operation: string) {
    const startTime = process.hrtime.bigint();
    const requestId = this.generateRequestId();
    const logger = this.createComponentLogger(component);

    logger.debug({ requestId, operation }, `Starting ${operation}`);

    return {
      requestId,
      end: (metadata?: Record<string, unknown>) => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        logger.info(
          {
            requestId,
            operation,
            duration: Math.round(duration * 100) / 100,
            ...metadata,
          },
          `Completed ${operation}`,
        );

        return duration;
      },
    };
  }
}

/**
 * Singleton logger instance - import and use throughout your application
 *
 * File Structure Created:
 * logs/
 * ├── combined.log          # All logs from all components
 * ├── app.log               # Web application + general logs
 * ├── mcp.log               # MCP server logs
 * ├── background-tasks.log  # Background queue processor logs
 * ├── auth.log              # Authentication logs
 * └── database.log          # Database operation logs
 *
 * Examples:
 * ```typescript
 * // Import the logger
 * import { logger } from '~/lib/logger';
 *
 * // Component-specific logging
 * logger.mcp.info('Tool executed', { tool: 'search', duration: 150 });
 * logger.web.error('Request failed', { userId: 'user123', path: '/api/recipes' });
 * logger.tasks.info('Job completed', { jobType: 'summarization', success: true });
 *
 * // Performance timing
 * const timer = logger.createTimer('db', 'recipe_query');
 * const recipes = await prisma.recipe.findMany();
 * timer.end({ recipeCount: recipes.length });
 *
 * // Request correlation
 * const requestId = logger.generateRequestId();
 * logger.web.info('Processing request', { requestId, path: req.path });
 * logger.db.debug('Database query', { requestId, query: 'SELECT ...' });
 * ```
 */
export const logger = new Logger();
export default logger;
