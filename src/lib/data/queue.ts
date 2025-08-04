import { type QueueItemInput, queueItemSchema } from "../dataValidators";
import prisma from "../prisma";

export namespace Queue {
  /**
   * Get all pending queue items, ordered by creation date (oldest first)
   */
  export async function listPending() {
    return prisma.recipeQueue.findMany({
      where: {
        status: "pending",
        deletedAt: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  /**
   * Get the next pending item from the queue (pop the oldest)
   */
  export async function popNext() {
    const nextItem = await prisma.recipeQueue.findFirst({
      where: {
        status: "pending",
        deletedAt: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (nextItem) {
      // Mark as processing
      await prisma.recipeQueue.update({
        where: { id: nextItem.id },
        data: {
          status: "processing",
        },
      });
    }

    return nextItem;
  }

  /**
   * Add a new item to the queue
   */
  export async function add(data: QueueItemInput) {
    // Validate the input
    const validatedData = queueItemSchema.parse(data);

    // Check if an item with the same versionId is already in the queue (pending or processing)
    const existingItem = await prisma.recipeQueue.findFirst({
      where: {
        versionId: validatedData.versionId,
        status: {
          in: ["pending", "processing"],
        },
        deletedAt: null,
      },
    });

    if (existingItem) {
      // Don't add duplicate items for the same version
      return existingItem;
    }

    return prisma.recipeQueue.create({
      data: {
        title: validatedData.title,
        shortid: validatedData.shortid,
        versionId: validatedData.versionId,
        status: validatedData.status || "pending",
      },
    });
  }

  /**
   * Mark an item as completed
   */
  export async function markCompleted(id: string) {
    return prisma.recipeQueue.update({
      where: { id },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });
  }

  /**
   * Mark an item as failed
   */
  export async function markFailed(id: string) {
    return prisma.recipeQueue.update({
      where: { id },
      data: {
        status: "failed",
        completedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete a queue item
   */
  export async function remove(id: string) {
    return prisma.recipeQueue.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Get queue statistics
   */
  export async function getStats() {
    const [pending, processing, completed, failed] = await Promise.all([
      prisma.recipeQueue.count({ where: { status: "pending", deletedAt: null } }),
      prisma.recipeQueue.count({ where: { status: "processing", deletedAt: null } }),
      prisma.recipeQueue.count({ where: { status: "completed", deletedAt: null } }),
      prisma.recipeQueue.count({ where: { status: "failed", deletedAt: null } }),
    ]);

    return { pending, processing, completed, failed };
  }

  /**
   * Clean up old completed items (older than 7 days)
   */
  export async function cleanup() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return prisma.recipeQueue.updateMany({
      where: {
        status: {
          in: ["completed", "failed"],
        },
        completedAt: {
          lt: sevenDaysAgo,
        },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
