import { Prisma } from "~/generated/prisma/client";
import prisma from "../prisma";

export namespace VecDocuments {
  /**
   * Create or update a vector document with embedding
   */
  export async function upsert(
    title: string,
    shortid: string,
    embedding: number[],
    versionId: string,
    recipeId: string,
    isCurrent = true,
  ) {
    // First, mark any existing document for this recipe as not current
    if (isCurrent) {
      await markRecipeVersionsAsNotCurrent(recipeId);
    }

    // Check if a document already exists for this version
    const existingDoc = await prisma.vecDocument.findFirst({
      where: {
        versionId,
        deletedat: null,
      },
    });

    if (existingDoc) {
      // Update existing document
      return prisma.$executeRaw`
        UPDATE "VecDocument" 
        SET 
          title = ${title},
          shortid = ${shortid},
          embedding = ${JSON.stringify(embedding)}::vector,
          updatedat = NOW(),
          "isCurrent" = ${isCurrent}
        WHERE id = ${existingDoc.id}
      `;
    } else {
      // Create new document
      return prisma.$executeRaw`
        INSERT INTO "VecDocument" (title, shortid, embedding, "versionId", "recipeId", "isCurrent", createdat, updatedat)
        VALUES (
          ${title},
          ${shortid}, 
          ${JSON.stringify(embedding)}::vector,
          ${versionId},
          ${recipeId},
          ${isCurrent},
          NOW(),
          NOW()
        )
      `;
    }
  }

  /**
   * Mark all vector documents for a recipe as not current
   */
  export async function markRecipeVersionsAsNotCurrent(recipeId: string) {
    return prisma.$executeRaw`
      UPDATE "VecDocument" 
      SET "isCurrent" = false, updatedat = NOW()
      WHERE "recipeId" = ${recipeId} AND deletedat IS NULL
    `;
  }

  /**
   * Soft delete a vector document
   */
  export async function softDelete(versionId: string) {
    return prisma.$executeRaw`
      UPDATE "VecDocument" 
      SET deletedat = NOW(), updatedat = NOW()
      WHERE "versionId" = ${versionId}
    `;
  }

  /**
   * Get current vector document for a recipe
   */
  export async function getCurrentForRecipe(recipeId: string) {
    const result = await prisma.$queryRaw<
      Array<{
        id: number;
        title: string;
        shortid: string;
        versionId: string;
        recipeId: string;
        isCurrent: boolean;
        createdat: Date;
        updatedat: Date;
      }>
    >`
      SELECT id, title, shortid, "versionId", "recipeId", "isCurrent", createdat, updatedat
      FROM "VecDocument"
      WHERE "recipeId" = ${recipeId} 
        AND "isCurrent" = true 
        AND deletedat IS NULL
      LIMIT 1
    `;

    return result[0] || null;
  }

  /**
   * Perform vector similarity search
   * Returns the top N most similar documents
   */
  export async function similaritySearch(queryEmbedding: number[], limit = 10, threshold = 0.3, projectIds?: string[]) {
    const projectIdsArray = projectIds || [];

    if(projectIdsArray.length === 0){
      const result = await prisma.$queryRaw<
        Array<{
          id: number;
          title: string;
          shortid: string;
          versionId: string;
          recipeId: string;
          similarity: number;
        }>
      >`
        SELECT 
          id, 
          title, 
          shortid, 
          "versionId", 
          "recipeId",
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
        FROM "VecDocument"
        WHERE deletedat IS NULL 
          AND "isCurrent" = true
          AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) > ${threshold}
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${limit}
      `;

      return result;
    }

    const result = await prisma.$queryRaw<
      Array<{
        id: number;
        title: string;
        shortid: string;
        versionId: string;
        recipeId: string;
        similarity: number;
      }>
    >`
      SELECT 
        id, 
        title, 
        shortid, 
        "versionId", 
        "recipeId",
        1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
      FROM "VecDocument"
      WHERE deletedat IS NULL 
        AND "isCurrent" = true
        AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) > ${threshold}
        AND (
          ${projectIdsArray.length} = 0 
          OR "versionId" IN (
            SELECT rv.id 
            FROM "RecipeVersion" rv
            INNER JOIN "_RecipeVersionProjects" rvp ON rv.id = rvp."B"
            INNER JOIN "Project" p ON rvp."A" = p.id
            WHERE p."shortId" IN(${Prisma.join(projectIdsArray.length ? projectIdsArray : ['nope'])})
              AND rv."deletedAt" IS NULL
              AND p."deletedAt" IS NULL
          )
        )
      ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${limit}
    `;

    return result;
  }

  /**
   * Get statistics about vector documents
   */
  export async function getStats() {
    const result = await prisma.$queryRaw<
      Array<{
        total: bigint;
        current: bigint;
        deleted: bigint;
      }>
    >`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN "isCurrent" = true AND deletedat IS NULL THEN 1 END) as current,
        COUNT(CASE WHEN deletedat IS NOT NULL THEN 1 END) as deleted
      FROM "VecDocument"
    `;

    const stats = result[0];
    return {
      total: Number(stats?.total || 0),
      current: Number(stats?.current || 0),
      deleted: Number(stats?.deleted || 0),
    };
  }
}
