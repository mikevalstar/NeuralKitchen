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
  description: z.string().max(300, "Project description must be less than 300 characters").optional().or(z.literal("")),
});

export type ProjectInput = z.infer<typeof projectSchema>;
