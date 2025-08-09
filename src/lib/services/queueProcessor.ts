import { Queue } from "../data/queue";
import { Recipes } from "../data/recipes";

export class QueueProcessor {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private readonly intervalMs = (process.env.QUEUE_PROCESSOR_INTERVAL_MS ? parseInt(process.env.QUEUE_PROCESSOR_INTERVAL_MS) : 500000); // 5000 seconds default

  /**
   * Start the queue processor
   */
  start() {
    if (this.intervalId) {
      console.log("Queue processor is already running");
      return;
    }

    // Check for required environment variable
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY environment variable is required but not set. Queue processor will not start.");
      return;
    }

    console.log("Starting queue processor...");
    this.intervalId = setInterval(() => {
      this.processNext();
    }, this.intervalMs);

    // Process immediately on start
    this.processNext();
  }

  /**
   * Stop the queue processor
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Queue processor stopped");
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

      // Get the next item from the queue
      const item = await Queue.popNext();

      if (!item) {
        // No items to process
        return;
      }

      console.log(`Processing queue item: ${item.title} (${item.versionId})`);

      try {
        // Process the recipe version (generate AI summary and embedding)
        await Recipes.processRecipeVersion(item.versionId);

        // Mark the queue item as completed
        await Queue.markCompleted(item.id);
        console.log(`Completed processing: ${item.title}`);
      } catch (processError) {
        console.error(`Failed to process queue item ${item.id}:`, processError);
        const errorMessage = processError instanceof Error ? processError.message : String(processError);
        await Queue.markFailed(item.id, errorMessage);
        throw processError;
      }
    } catch (error) {
      console.error("Error processing queue item:", error);

      // If we have an item reference, mark it as failed
      // This is a simplified error handling - in practice we'd want more robust retry logic
    } finally {
      this.isProcessing = false;
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
