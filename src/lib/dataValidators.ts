import { z } from "zod";

// Tag validation schema
export const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name must be less than 50 characters"),
});

export type TagInput = z.infer<typeof tagSchema>;

// Project validation schema
export const projectSchema = z.object({
  title: z.string().min(1, "Project title is required").max(100, "Project title must be less than 100 characters"),
  shortId: z
    .string()
    .min(1, "Project ID is required")
    .max(50, "Project ID must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Project ID can only contain letters, numbers, hyphens, and underscores"),
  description: z.union([z.string().max(300, "Project description must be less than 300 characters"), z.undefined()]),
});

export type ProjectInput = z.infer<typeof projectSchema>;

// Project ID validation schema for server routes
export const projectIdSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});

export type ProjectIdInput = z.infer<typeof projectIdSchema>;

// Recipe validation schema
export const recipeSchema = z.object({
  title: z.string().min(1, "Recipe title is required").max(200, "Recipe title must be less than 200 characters"),
  shortId: z
    .string()
    .min(1, "Recipe ID is required")
    .max(50, "Recipe ID must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Recipe ID can only contain letters, numbers, hyphens, and underscores"),
});

export type RecipeInput = z.infer<typeof recipeSchema>;

// Recipe version validation schema
export const recipeVersionSchema = z.object({
  title: z.string().min(1, "Recipe title is required").max(200, "Recipe title must be less than 200 characters"),
  content: z.string().min(1, "Recipe content is required"),
  tagIds: z.array(z.string()).optional().default([]),
  projectIds: z.array(z.string()).optional().default([]),
});

export type RecipeVersionInput = z.infer<typeof recipeVersionSchema>;

// Recipe ID validation schema for server routes
export const recipeIdSchema = z.object({
  recipeId: z.string().min(1, "Recipe ID is required"),
});

export type RecipeIdInput = z.infer<typeof recipeIdSchema>;

// Recipe version ID validation schema for server routes
export const recipeVersionIdSchema = z.object({
  versionId: z.string().min(1, "Version ID is required"),
});

export type RecipeVersionIdInput = z.infer<typeof recipeVersionIdSchema>;
