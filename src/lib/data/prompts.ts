import prisma from "../prisma";
import type { PromptKey } from "../prompts";
import { DEFAULT_PROMPTS } from "../prompts";

export interface PromptInput {
  key: string;
  name: string;
  description?: string;
  content: string;
}

export namespace Prompts {
  /**
   * Get all non-deleted prompts
   */
  export async function list() {
    return prisma.prompt.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Get a single prompt by key with fallback to constants
   * If no prompt exists in DB or content is blank, returns the default from constants
   */
  export async function getByKey(key: PromptKey): Promise<string> {
    const prompt = await prisma.prompt.findFirst({
      where: {
        key,
        deletedAt: null,
      },
    });

    // If no prompt in DB or content is blank, return default
    if (!prompt || !prompt.content.trim()) {
      return DEFAULT_PROMPTS[key];
    }

    return prompt.content;
  }

  /**
   * Get a single prompt record by key (for editing)
   */
  export async function getRecordByKey(key: string) {
    return prisma.prompt.findFirst({
      where: {
        key,
        deletedAt: null,
      },
    });
  }

  /**
   * Get a single prompt by ID
   */
  export async function read(id: string) {
    return prisma.prompt.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  /**
   * Create a new prompt
   */
  export async function create(data: PromptInput, userId?: string) {
    // Check if key already exists
    const existing = await prisma.prompt.findFirst({
      where: {
        key: data.key,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new Error("Prompt key already exists");
    }

    return prisma.prompt.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
        content: data.content,
        createdBy: userId,
        modifiedBy: userId,
      },
    });
  }

  /**
   * Update an existing prompt
   */
  export async function update(id: string, data: Partial<PromptInput>, userId?: string) {
    const existing = await read(id);
    if (!existing) {
      throw new Error("Prompt not found");
    }

    // If updating key, check for duplicates
    if (data.key && data.key !== existing.key) {
      const duplicate = await prisma.prompt.findFirst({
        where: {
          key: data.key,
          deletedAt: null,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new Error("Prompt key already exists");
      }
    }

    return prisma.prompt.update({
      where: { id },
      data: {
        ...data,
        modifiedBy: userId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete a prompt
   */
  export async function deletePrompt(id: string, userId?: string) {
    const existing = await read(id);
    if (!existing) {
      throw new Error("Prompt not found");
    }

    return prisma.prompt.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        modifiedBy: userId,
      },
    });
  }

  /**
   * Restore a soft-deleted prompt
   */
  export async function restore(id: string, userId?: string) {
    return prisma.prompt.update({
      where: { id },
      data: {
        deletedAt: null,
        modifiedBy: userId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Upsert a prompt - create if doesn't exist, update if it does
   */
  export async function upsert(key: string, data: Omit<PromptInput, "key">, userId?: string) {
    const existing = await getRecordByKey(key);

    if (existing) {
      return update(existing.id, data, userId);
    }

    return create({ ...data, key }, userId);
  }
}
