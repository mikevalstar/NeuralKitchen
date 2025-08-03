import { type TagInput, tagSchema } from "../dataValidators";
import prisma from "../prisma";

export namespace Tags {
  /**
   * Get all non-deleted tags, ordered by name
   */
  export async function list() {
    return prisma.tag.findMany({
      where: {
        deletedAt: null, // Only show non-deleted tags
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Get a single tag by ID
   */
  export async function read(id: string) {
    return prisma.tag.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  /**
   * Create a new tag
   */
  export async function create(data: TagInput) {
    // Validate the input
    const validatedData = tagSchema.parse(data);

    // Check if tag already exists (case-insensitive)
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: "insensitive",
        },
        deletedAt: null,
      },
    });

    if (existingTag) {
      throw new Error("Tag already exists");
    }

    return prisma.tag.create({
      data: {
        name: validatedData.name.trim(),
      },
    });
  }

  /**
   * Update an existing tag
   */
  export async function update(id: string, data: TagInput) {
    // Validate the input
    const validatedData = tagSchema.parse(data);

    // Check if the tag exists and is not deleted
    const existingTag = await read(id);
    if (!existingTag) {
      throw new Error("Tag not found");
    }

    // Check if another tag with the same name already exists (case-insensitive)
    const duplicateTag = await prisma.tag.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: "insensitive",
        },
        deletedAt: null,
        NOT: {
          id: id,
        },
      },
    });

    if (duplicateTag) {
      throw new Error("Tag with this name already exists");
    }

    return prisma.tag.update({
      where: { id },
      data: {
        name: validatedData.name.trim(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete a tag by setting deletedAt timestamp
   */
  export async function deleteTag(id: string) {
    // Check if the tag exists and is not already deleted
    const existingTag = await read(id);
    if (!existingTag) {
      throw new Error("Tag not found");
    }

    return prisma.tag.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Permanently delete a tag (hard delete)
   */
  export async function hardDelete(id: string) {
    return prisma.tag.delete({
      where: { id },
    });
  }

  /**
   * Restore a soft-deleted tag
   */
  export async function restore(id: string) {
    return prisma.tag.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedAt: new Date(),
      },
    });
  }
}
