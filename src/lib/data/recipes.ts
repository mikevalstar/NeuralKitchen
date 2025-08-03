import crypto from "node:crypto";
import { type RecipeInput, type RecipeVersionInput, recipeSchema, recipeVersionSchema } from "../dataValidators";
import prisma from "../prisma";

export namespace Recipes {
  /**
   * Create a hash of the content for duplicate detection
   */
  function createContentHash(content: string, title: string): string {
    return crypto.createHash("sha256").update(`${title}:${content}`).digest("hex");
  }

  /**
   * Generate version ID string from version number
   */
  function generateVersionId(versionNumber: number): string {
    return `v${versionNumber}`;
  }

  /**
   * Get all non-deleted recipes, ordered by title
   */
  export async function list() {
    return prisma.recipe.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        currentVersion: {
          include: {
            tags: true,
            projects: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });
  }

  /**
   * Get a single recipe by ID with current version
   */
  export async function read(id: string) {
    return prisma.recipe.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        currentVersion: {
          include: {
            tags: true,
            projects: true,
          },
        },
      },
    });
  }

  /**
   * Get a single recipe by shortId with current version
   */
  export async function readByShortId(shortId: string) {
    return prisma.recipe.findFirst({
      where: {
        shortId,
        deletedAt: null,
      },
      include: {
        currentVersion: {
          include: {
            tags: true,
            projects: true,
          },
        },
      },
    });
  }

  /**
   * Create a new recipe with initial version
   */
  export async function create(recipeData: RecipeInput, versionData: RecipeVersionInput) {
    // Validate inputs
    const validatedRecipe = recipeSchema.parse(recipeData);
    const validatedVersion = recipeVersionSchema.parse(versionData);

    // Check if recipe shortId already exists
    const existingRecipe = await prisma.recipe.findFirst({
      where: {
        shortId: {
          equals: validatedRecipe.shortId,
          mode: "insensitive",
        },
        deletedAt: null,
      },
    });

    if (existingRecipe) {
      throw new Error("Recipe ID already exists");
    }

    // Create content hash
    const contentHash = createContentHash(validatedVersion.content, validatedVersion.title);

    return prisma.$transaction(async (tx) => {
      // Create the recipe
      const recipe = await tx.recipe.create({
        data: {
          title: validatedRecipe.title.trim(),
          shortId: validatedRecipe.shortId.trim(),
        },
      });

      // Create the first version
      const version = await tx.recipeVersion.create({
        data: {
          title: validatedVersion.title.trim(),
          shortId: `${validatedRecipe.shortId}-v1`,
          content: validatedVersion.content,
          versionId: generateVersionId(1),
          versionNumber: 1,
          isCurrent: true,
          contentHash,
          recipeId: recipe.id,
          tags: {
            connect: validatedVersion.tagIds.map((id) => ({ id })),
          },
          projects: {
            connect: validatedVersion.projectIds.map((id) => ({ id })),
          },
        },
        include: {
          tags: true,
          projects: true,
        },
      });

      // Update recipe to reference this version as current
      await tx.recipe.update({
        where: { id: recipe.id },
        data: { currentVersionId: version.id },
      });

      return {
        recipe,
        version,
      };
    });
  }

  /**
   * Save a new version of an existing recipe (main save operation)
   * Automatically creates a new version and sets it as current
   * Compares content to avoid duplicate versions
   */
  export async function save(recipeId: string, versionData: RecipeVersionInput) {
    // Validate input
    const validatedVersion = recipeVersionSchema.parse(versionData);

    // Get current recipe and its current version
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, deletedAt: null },
      include: {
        currentVersion: true,
      },
    });

    if (!recipe) {
      throw new Error("Recipe not found");
    }

    // Create content hash for comparison
    const newContentHash = createContentHash(validatedVersion.content, validatedVersion.title);

    // Check if content is identical to current version (avoid duplicates)
    if (recipe.currentVersion?.contentHash === newContentHash) {
      throw new Error("No changes detected - content is identical to current version");
    }

    // Get next version number
    const lastVersion = await prisma.recipeVersion.findFirst({
      where: { recipeId }, // we want deleted here, so we can avoid duplicate version ids
      orderBy: { versionNumber: "desc" },
    });

    const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1;

    return prisma.$transaction(async (tx) => {
      // Mark current version as not current
      if (recipe.currentVersionId) {
        await tx.recipeVersion.update({
          where: { id: recipe.currentVersionId },
          data: { isCurrent: false },
        });
      }

      // Create new version
      const newVersion = await tx.recipeVersion.create({
        data: {
          title: validatedVersion.title.trim(),
          shortId: `${recipe.shortId}-v${nextVersionNumber}`,
          content: validatedVersion.content,
          versionId: generateVersionId(nextVersionNumber),
          versionNumber: nextVersionNumber,
          isCurrent: true,
          contentHash: newContentHash,
          recipeId: recipe.id,
          tags: {
            connect: validatedVersion.tagIds.map((id) => ({ id })),
          },
          projects: {
            connect: validatedVersion.projectIds.map((id) => ({ id })),
          },
        },
        include: {
          tags: true,
          projects: true,
        },
      });

      // Update recipe to reference new version as current and update title
      await tx.recipe.update({
        where: { id: recipe.id },
        data: {
          title: validatedVersion.title.trim(),
          currentVersionId: newVersion.id,
        },
      });

      return newVersion;
    });
  }

  /**
   * Get all versions of a recipe (for version history)
   */
  export async function getVersionHistory(recipeId: string) {
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, deletedAt: null },
    });

    if (!recipe) {
      throw new Error("Recipe not found");
    }

    return prisma.recipeVersion.findMany({
      where: {
        recipeId,
        deletedAt: null,
      },
      include: {
        tags: true,
        projects: true,
      },
      orderBy: { versionNumber: "desc" },
    });
  }

  /**
   * Get a specific version (read-only)
   * This is for viewing old versions, not editing
   */
  export async function getVersion(versionId: string) {
    return prisma.recipeVersion.findFirst({
      where: {
        id: versionId,
        deletedAt: null,
      },
      include: {
        tags: true,
        projects: true,
        recipe: true,
      },
    });
  }

  /**
   * Get a specific version by version number (read-only)
   */
  export async function getVersionByNumber(recipeId: string, versionNumber: number) {
    return prisma.recipeVersion.findFirst({
      where: {
        recipeId,
        versionNumber,
        deletedAt: null,
      },
      include: {
        tags: true,
        projects: true,
        recipe: true,
      },
    });
  }

  /**
   * Revert to a previous version (creates a new version with old content)
   */
  export async function revertToVersion(recipeId: string, targetVersionNumber: number) {
    // Get the target version
    const targetVersion = await getVersionByNumber(recipeId, targetVersionNumber);
    if (!targetVersion) {
      throw new Error("Target version not found");
    }

    // Save it as a new version (this will create a new version with the old content)
    return save(recipeId, {
      title: targetVersion.title,
      content: targetVersion.content,
      tagIds: targetVersion.tags.map((tag) => tag.id),
      projectIds: targetVersion.projects.map((project) => project.id),
    });
  }

  /**
   * Update recipe metadata (title, shortId) without creating new version
   */
  export async function updateMetadata(recipeId: string, data: RecipeInput) {
    const validatedData = recipeSchema.parse(data);

    const existingRecipe = await prisma.recipe.findFirst({
      where: { id: recipeId, deletedAt: null },
    });

    if (!existingRecipe) {
      throw new Error("Recipe not found");
    }

    // Check if shortId is taken by another recipe
    const duplicateShortId = await prisma.recipe.findFirst({
      where: {
        shortId: {
          equals: validatedData.shortId,
          mode: "insensitive",
        },
        deletedAt: null,
        NOT: { id: recipeId },
      },
    });

    if (duplicateShortId) {
      throw new Error("Recipe ID already exists");
    }

    return prisma.recipe.update({
      where: { id: recipeId },
      data: {
        title: validatedData.title.trim(),
        shortId: validatedData.shortId.trim(),
      },
    });
  }

  /**
   * Soft delete a recipe and all its versions
   */
  export async function deleteRecipe(recipeId: string) {
    const existingRecipe = await prisma.recipe.findFirst({
      where: { id: recipeId, deletedAt: null },
    });

    if (!existingRecipe) {
      throw new Error("Recipe not found");
    }

    return prisma.$transaction(async (tx) => {
      // Soft delete all versions
      await tx.recipeVersion.updateMany({
        where: { recipeId },
        data: { deletedAt: new Date() },
      });

      // Soft delete the recipe
      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          deletedAt: new Date(),
          currentVersionId: null,
        },
      });
    });
  }

  /**
   * Restore a soft-deleted recipe
   */
  export async function restore(recipeId: string) {
    return prisma.$transaction(async (tx) => {
      // Restore the recipe
      await tx.recipe.update({
        where: { id: recipeId },
        data: { deletedAt: null },
      });

      // Restore all versions
      await tx.recipeVersion.updateMany({
        where: { recipeId },
        data: { deletedAt: null },
      });
    });
  }
}
