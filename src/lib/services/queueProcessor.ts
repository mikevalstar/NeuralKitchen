import { DataSourceSyncJobs } from "../data/dataSources";
import { Queue } from "../data/queue";
import { Recipes } from "../data/recipes";
import { Settings } from "../data/settings";
import type { RecipeQueue } from "../generated/prisma/client";
import { logger } from "../logger.js";

export class QueueProcessor {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private readonly intervalMs = process.env.QUEUE_PROCESSOR_INTERVAL_MS
    ? parseInt(process.env.QUEUE_PROCESSOR_INTERVAL_MS)
    : 5000; // 5 seconds default (fixed from 500000)

  /**
   * Start the queue processor
   */
  start() {
    if (this.intervalId) {
      logger.tasks.warn("Queue processor start requested but already running", {
        intervalMs: this.intervalMs,
      });
      return;
    }

    // Check for required OpenAI API key setting
    if (!Settings.get("OPENAI_API_KEY")) {
      logger.tasks.error("OPENAI_API_KEY setting not configured, queue processor cannot start");
      return;
    }

    logger.tasks.info("Queue processor starting", {
      intervalMs: this.intervalMs,
      intervalSeconds: this.intervalMs / 1000,
    });

    this.intervalId = setInterval(() => {
      this.processNext();
    }, this.intervalMs);

    // Process immediately on start
    this.processNext();
    logger.tasks.info("Queue processor started and processing first batch");
  }

  /**
   * Stop the queue processor
   */
  stop() {
    if (this.intervalId) {
      logger.tasks.info("Stopping queue processor");
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.tasks.info("Queue processor stopped successfully");
    } else {
      logger.tasks.debug("Queue processor stop requested but not running");
    }
  }

  /**
   * Process the next item in the queue
   */
  private async processNext() {
    if (this.isProcessing) {
      // Skip if already processing an item
      return;
    }

    try {
      this.isProcessing = true;

      // Try to process recipe queue items first
      const recipeItem = await Queue.popNext();
      if (recipeItem) {
        await this.processRecipeItem(recipeItem);
        return;
      }

      // Try to process data source sync jobs
      const syncJobs = await DataSourceSyncJobs.getRunning();
      if (syncJobs.length === 0) {
        // No items to process in either queue
        return;
      }

      // Process the first running sync job (this would be expanded with actual sync logic in Phase 4)
      const syncJob = syncJobs[0];
      logger.tasks.info("Data source sync job found but sync logic not implemented yet", {
        syncJobId: syncJob.id,
        dataSourceId: syncJob.dataSourceId,
        status: syncJob.status,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.tasks.error("Unexpected error in queue processing cycle", {
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : "Unknown",
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a recipe queue item
   */
  private async processRecipeItem(item: RecipeQueue) {
    logger.tasks.info("Processing recipe queue item", {
      queueItemId: item.id,
      title: item.title,
      versionId: item.versionId,
      type: "recipe_processing",
    });

    try {
      // Process the recipe version (generate AI summary and embedding)
      await Recipes.processRecipeVersion(item.versionId);

      // Mark the queue item as completed
      await Queue.markCompleted(item.id);
      logger.tasks.info("Recipe queue item processing completed", {
        queueItemId: item.id,
        title: item.title,
        versionId: item.versionId,
      });
    } catch (processError) {
      const errorMessage = processError instanceof Error ? processError.message : String(processError);

      logger.tasks.error("Recipe queue item processing failed", {
        queueItemId: item.id,
        title: item.title,
        versionId: item.versionId,
        error: errorMessage,
        errorType: processError instanceof Error ? processError.constructor.name : "Unknown",
      });

      await Queue.markFailed(item.id, errorMessage);
      throw processError;
    }
  }

  /**
   * Get current processor status
   */
  getStatus() {
    return {
      isRunning: this.intervalId !== null,
      isProcessing: this.isProcessing,
      intervalMs: this.intervalMs,
    };
  }
}

// Create a singleton instance
export const queueProcessor = new QueueProcessor();
