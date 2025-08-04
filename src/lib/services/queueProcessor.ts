import { Queue } from "../data/queue";

export class QueueProcessor {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private readonly intervalMs = 5000; // 5 seconds

  /**
   * Start the queue processor
   */
  start() {
    if (this.intervalId) {
      console.log("Queue processor is already running");
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

      // TODO: Add actual processing logic here
      // For now, we'll just mark it as completed
      // In the next phase, this is where we'll call OpenAI for summarization and embeddings

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 100));

      await Queue.markCompleted(item.id);
      console.log(`Completed processing: ${item.title}`);
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
