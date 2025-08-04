import crypto from "node:crypto";
import { type RecipeInput, type RecipeVersionInput, recipeSchema, recipeVersionSchema } from "../dataValidators";
import prisma from "../prisma";
import { OpenAIService } from "../services/openai";
import { Queue } from "./queue";
import { VecDocuments } from "./vecDocuments";

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

      // Add to queue for processing (summarization and embedding)
      try {
        await Queue.add({
          title: version.title,
          shortid: version.shortId,
          versionId: version.id,
        });
      } catch (error) {
        // Log error but don't fail the recipe creation
        console.error("Failed to add recipe version to queue:", error);
      }

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

      // Add to queue for processing (summarization and embedding)
      try {
        await Queue.add({
          title: newVersion.title,
          shortid: newVersion.shortId,
          versionId: newVersion.id,
        });
      } catch (error) {
        // Log error but don't fail the save operation
        console.error("Failed to add recipe version to queue:", error);
      }

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
    // Note: The save() function will automatically add the new version to the queue
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

      // Soft delete all vector documents for this recipe
      await prisma.$executeRaw`
        UPDATE "VecDocument" 
        SET deletedat = NOW(), updatedat = NOW()
        WHERE "recipeId" = ${recipeId}
      `;
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

      // Restore all vector documents for this recipe
      await prisma.$executeRaw`
        UPDATE "VecDocument" 
        SET deletedat = NULL, updatedat = NOW()
        WHERE "recipeId" = ${recipeId}
      `;
    });
  }

  /**
   * Generate and update AI summary for a recipe version
   */
  export async function updateAISummary(versionId: string) {
    // Get the version
    const version = await prisma.recipeVersion.findFirst({
      where: {
        id: versionId,
        deletedAt: null,
      },
    });

    if (!version) {
      throw new Error("Recipe version not found");
    }

    try {
      // Generate summary using OpenAI
      const summary = await OpenAIService.summarizeRecipe(version.title, version.content);

      // Update the version with the summary
      await prisma.recipeVersion.update({
        where: { id: versionId },
        data: {
          aiSummary: summary,
        },
      });

      console.log(`Updated AI summary for recipe version: ${version.title}`);
      return summary;
    } catch (error) {
      console.error(`Failed to update AI summary for version ${versionId}:`, error);
      throw error;
    }
  }

  /**
   * Generate and store embedding for a recipe version
   */
  export async function updateEmbedding(versionId: string) {
    // Get the version
    const version = await prisma.recipeVersion.findFirst({
      where: {
        id: versionId,
        deletedAt: null,
      },
    });

    if (!version) {
      throw new Error("Recipe version not found");
    }

    try {
      // Combine title and content for embedding
      const textToEmbed = `${version.title}\n\n${version.content}`;

      // Generate embedding using OpenAI
      const embedding = await OpenAIService.generateEmbedding(textToEmbed);

      // Store in VecDocument table
      await VecDocuments.upsert(
        version.title,
        version.shortId,
        embedding,
        version.id,
        version.recipeId,
        version.isCurrent,
      );

      console.log(`Updated embedding for recipe version: ${version.title}`);
      return embedding;
    } catch (error) {
      console.error(`Failed to update embedding for version ${versionId}:`, error);
      throw error;
    }
  }

  /**
   * Process a recipe version - generate both AI summary and embedding
   */
  export async function processRecipeVersion(versionId: string) {
    console.log(`Processing recipe version: ${versionId}`);

    try {
      // Run both operations in parallel for efficiency
      const [summary, embedding] = await Promise.all([updateAISummary(versionId), updateEmbedding(versionId)]);

      console.log(`Successfully processed recipe version: ${versionId}`);
      return { summary, embedding };
    } catch (error) {
      console.error(`Failed to process recipe version ${versionId}:`, error);
      throw error;
    }
  }
}
