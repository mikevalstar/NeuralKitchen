import { VecDocuments } from "../data/vecDocuments";
import { OpenAIService } from "./openai";

export interface SearchResult {
  id: number;
  title: string;
  shortid: string;
  versionId: string;
  recipeId: string;
  similarity: number;
  summary?: string;
}

export namespace SearchService {
  /**
   * Perform semantic search using vector embeddings
   */
  export async function searchRecipes(query: string, limit = 10, threshold = 0.3): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      // Generate embedding for the search query
      const queryEmbedding = await OpenAIService.generateEmbedding(query);

      // Perform vector similarity search
      const results = await VecDocuments.similaritySearch(queryEmbedding, limit, threshold);

      // Get additional details for each result (including AI summaries)
      const enrichedResults = await Promise.all(
        results.map(async (result) => {
          // Get the recipe version to fetch the AI summary
          const version = await prisma.recipeVersion.findFirst({
            where: {
              id: result.versionId,
              isCurrent: true,
              deletedAt: null,
            },
            select: {
              aiSummary: true,
            },
          });

          return {
            ...result,
            summary: version?.aiSummary || undefined,
          };
        }),
      );

      return enrichedResults;
    } catch (error) {
      console.error("Error performing semantic search:", error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Simple text-based search (fallback when vector search fails)
   */
  export async function textSearch(query: string, limit = 10): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      // Search in recipe titles and content using PostgreSQL full-text search
      const results = await prisma.$queryRaw<
        Array<{
          versionId: string;
          recipeId: string;
          title: string;
          shortId: string;
          aiSummary: string | null;
        }>
      >`
        SELECT 
          rv.id as "versionId",
          rv."recipeId",
          rv.title,
          rv."shortId",
          rv."aiSummary"
        FROM "RecipeVersion" rv
        WHERE rv."deletedAt" IS NULL 
          AND rv."isCurrent" = true
          AND (
            rv.title ILIKE ${`%${query}%`} 
            OR rv.content ILIKE ${`%${query}%`}
          )
        ORDER BY 
          CASE 
            WHEN rv.title ILIKE ${`%${query}%`} THEN 1 
            ELSE 2 
          END,
          rv."updatedAt" DESC
        LIMIT ${limit}
      `;

      return results.map((result, index) => ({
        id: index, // Not from VecDocument, so use array index
        title: result.title,
        shortid: result.shortId,
        versionId: result.versionId,
        recipeId: result.recipeId,
        similarity: 0.8, // Default similarity for text search
        summary: result.aiSummary || undefined,
      }));
    } catch (error) {
      console.error("Error performing text search:", error);
      throw new Error(`Text search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Hybrid search - tries vector search first, falls back to text search
   */
  export async function hybridSearch(query: string, limit = 10): Promise<SearchResult[]> {
    try {
      // Try vector search first
      const vectorResults = await searchRecipes(query, limit);

      if (vectorResults.length > 0) {
        return vectorResults;
      }

      // Fall back to text search if no vector results
      console.log("No vector search results, falling back to text search");
      return await textSearch(query, limit);
    } catch (error) {
      console.error("Vector search failed, falling back to text search:", error);
      return await textSearch(query, limit);
    }
  }
}

// Import prisma at the bottom to avoid circular dependency issues
import prisma from "../prisma";
