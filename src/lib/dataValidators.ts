import { z } from "zod";

// Tag validation schema
export const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name must be less than 50 characters"),
});

export type TagInput = z.infer<typeof tagSchema>;