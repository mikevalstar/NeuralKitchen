import { type ProjectInput, projectSchema } from "../dataValidators";
import prisma from "../prisma";

export namespace Projects {
  /**
   * Get all non-deleted projects, ordered by title
   */
  export async function list() {
    return prisma.project.findMany({
      where: {
        deletedAt: null, // Only show non-deleted projects
      },
      orderBy: {
        title: "asc",
      },
    });
  }

  /**
   * Get a single project by ID
   */
  export async function read(id: string) {
    return prisma.project.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  /**
   * Get a single project by shortId
   */
  export async function readByShortId(shortId: string) {
    return prisma.project.findFirst({
      where: {
        shortId,
        deletedAt: null,
      },
    });
  }

  /**
   * Create a new project
   */
  export async function create(data: ProjectInput, userId?: string) {
    // Validate the input
    const validatedData = projectSchema.parse(data);

    // Check if project already exists by title (case-insensitive)
    const existingProject = await prisma.project.findFirst({
      where: {
        title: {
          equals: validatedData.title,
          mode: "insensitive",
        },
        deletedAt: null,
      },
    });

    if (existingProject) {
      throw new Error("Project with this title already exists");
    }

    // Check if shortId already exists (case-insensitive)
    const existingShortId = await prisma.project.findFirst({
      where: {
        shortId: {
          equals: validatedData.shortId,
          mode: "insensitive",
        },
        deletedAt: null,
      },
    });

    if (existingShortId) {
      throw new Error("Project ID already exists");
    }

    return prisma.project.create({
      data: {
        title: validatedData.title.trim(),
        shortId: validatedData.shortId.trim(),
        description: validatedData.description?.trim() || null,
        createdBy: userId,
        modifiedBy: userId,
      },
    });
  }

  /**
   * Update an existing project
   */
  export async function update(id: string, data: ProjectInput, userId?: string) {
    // Validate the input
    const validatedData = projectSchema.parse(data);

    // Check if the project exists and is not deleted
    const existingProject = await read(id);
    if (!existingProject) {
      throw new Error("Project not found");
    }

    // Check if another project with the same title already exists (case-insensitive)
    const duplicateProject = await prisma.project.findFirst({
      where: {
        title: {
          equals: validatedData.title,
          mode: "insensitive",
        },
        deletedAt: null,
        NOT: {
          id: id,
        },
      },
    });

    if (duplicateProject) {
      throw new Error("Project with this title already exists");
    }

    // Check if another project with the same shortId already exists (case-insensitive)
    const duplicateShortId = await prisma.project.findFirst({
      where: {
        shortId: {
          equals: validatedData.shortId,
          mode: "insensitive",
        },
        deletedAt: null,
        NOT: {
          id: id,
        },
      },
    });

    if (duplicateShortId) {
      throw new Error("Project ID already exists");
    }

    return prisma.project.update({
      where: { id },
      data: {
        title: validatedData.title.trim(),
        shortId: validatedData.shortId.trim(),
        description: validatedData.description?.trim() || null,
        modifiedBy: userId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete a project by setting deletedAt timestamp
   */
  export async function deleteProject(id: string, userId?: string) {
    // Check if the project exists and is not already deleted
    const existingProject = await read(id);
    if (!existingProject) {
      throw new Error("Project not found");
    }

    return prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        modifiedBy: userId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Permanently delete a project (hard delete)
   */
  export async function hardDelete(id: string) {
    return prisma.project.delete({
      where: { id },
    });
  }

  /**
   * Restore a soft-deleted project
   */
  export async function restore(id: string, userId?: string) {
    return prisma.project.update({
      where: { id },
      data: {
        deletedAt: null,
        modifiedBy: userId,
        updatedAt: new Date(),
      },
    });
  }
}
