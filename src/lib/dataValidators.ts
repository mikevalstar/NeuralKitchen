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
  comment: z.string().max(500, "Comment must be less than 500 characters").optional(),
});

export type RecipeVersionInput = z.infer<typeof recipeVersionSchema>;

// Help file validation schema
export const helpFileSchema = z.object({
  helpFile: z
    .string()
    .min(1, "Help file name is required")
    .max(50, "Help file name must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Help file name can only contain letters, numbers, hyphens, and underscores"),
});

export type HelpFileInput = z.infer<typeof helpFileSchema>;

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

// Queue validation schema
export const queueItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  shortid: z.string().min(1, "Short ID is required").max(50, "Short ID must be less than 50 characters"),
  versionId: z.string().min(1, "Version ID is required"),
  status: z.enum(["pending", "processing", "completed", "failed"]).optional().default("pending"),
});

export type QueueItemInput = z.infer<typeof queueItemSchema>;

// Version restore validation schema
export const versionRestoreSchema = z.object({
  recipeId: z.string().min(1, "Recipe ID is required"),
  versionNumber: z.number().min(1, "Version number must be positive"),
});

export type VersionRestoreInput = z.infer<typeof versionRestoreSchema>;

// Pagination query params validation schema
export const paginationSearchSchema = z.object({
  page: z.number().min(1).optional(),
});

export type PaginationSearchInput = z.infer<typeof paginationSearchSchema>;

// Login validation schema
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// User name update validation schema
export const userNameUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
});

export type UserNameUpdateInput = z.infer<typeof userNameUpdateSchema>;

// Password change validation schema
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

// User creation validation schema
export const userCreateSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;

// User validation schema
export const userSchema = z.object({
  name: z.string().min(1, "User name is required").max(100, "User name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["", "admin"]).optional(),
});

export type UserInput = z.infer<typeof userSchema>;

// User update validation schema (for updating existing users - no email field)
export const userUpdateSchema = z.object({
  name: z.string().min(1, "User name is required").max(100, "User name must be less than 100 characters"),
  role: z.enum(["", "admin"]).optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

// User ID validation schema for server routes
export const userIdSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type UserIdInput = z.infer<typeof userIdSchema>;

// Data Source validation schema
export const dataSourceInputSchema = z.object({
  name: z.string().min(1, "Data source name is required").max(100, "Data source name must be less than 100 characters"),
  type: z.enum(["git", "confluence"], { message: "Data source type must be 'git' or 'confluence'" }),
  syncIntervalMinutes: z
    .number()
    .min(5, "Sync interval must be at least 5 minutes")
    .max(1440, "Sync interval must be at most 24 hours")
    .default(60),
  config: z
    .object({
      // Git specific config
      repositoryUrl: z
        .string()
        .refine(
          (url) => {
            // Allow HTTP/HTTPS URLs
            if (url.startsWith("http://") || url.startsWith("https://")) {
              try {
                new URL(url);
                return true;
              } catch {
                return false;
              }
            }
            // Allow SSH URLs in various formats:
            // - git@host:user/repo.git
            // - git@host:user/repo
            // - ssh://git@host/user/repo.git
            // - ssh://git@host:port/user/repo.git
            const sshPatterns = [
              /^git@[^:]+:[^/]+\/[^/]+(\.git)?$/, // git@host:user/repo(.git)
              /^ssh:\/\/git@[^/]+(:\d+)?\/[^/]+\/[^/]+(\.git)?$/, // ssh://git@host(:port)/user/repo(.git)
            ];
            return sshPatterns.some((pattern) => pattern.test(url));
          },
          {
            message:
              "Must be a valid HTTP/HTTPS URL or SSH URL (e.g., git@host:user/repo.git or ssh://git@host/user/repo.git)",
          },
        )
        .optional(),
      branch: z.string().min(1, "Branch name is required").default("main").optional(),
      // Extensible for other types
    })
    .passthrough(), // Allow additional properties for extensibility
  sshPrivateKey: z.string().optional(),
  sshPublicKey: z.string().optional(),
  isActive: z.boolean().default(true).optional(),
});

export type DataSourceInput = z.infer<typeof dataSourceInputSchema>;

// Data source config types
export interface GitDataSourceConfig {
  repositoryUrl?: string;
  branch?: string;
}

export interface DataSourceConfig extends GitDataSourceConfig {
  // Extensible for other data source types
  [key: string]: unknown;
}

// Data Source Project validation schema
export const dataSourceProjectInputSchema = z.object({
  dataSourceId: z.string().min(1, "Data source ID is required"),
  projectId: z.string().min(1, "Project ID is required"),
  includeGlobs: z.string().min(1, "Include globs are required"),
  excludeGlobs: z.string().optional().default(""),
  isActive: z.boolean().default(true),
});

export type DataSourceProjectInput = z.infer<typeof dataSourceProjectInputSchema>;

// Data Source Sync Job validation schema
export const dataSourceSyncJobInputSchema = z.object({
  dataSourceId: z.string().min(1, "Data source ID is required"),
  status: z
    .enum(["pending", "running", "completed", "failed"], { message: "Invalid sync job status" })
    .default("pending"),
  error: z.string().optional(),
  filesFound: z.number().int().min(0).optional(),
  filesImported: z.number().int().min(0).optional(),
  filesUpdated: z.number().int().min(0).optional(),
  filesSkipped: z.number().int().min(0).optional(),
});

export type DataSourceSyncJobInput = z.infer<typeof dataSourceSyncJobInputSchema>;

// Admin password set validation schema
export const adminPasswordSetSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type AdminPasswordSetInput = z.infer<typeof adminPasswordSetSchema>;

// App setting validation schema
export const appSettingSchema = z.object({
  key: z.string().min(1, "Setting key is required").max(100, "Setting key must be less than 100 characters"),
  value: z.string().max(10000, "Setting value must be less than 10,000 characters").optional(),
  description: z.string().max(500, "Setting description must be less than 500 characters").optional(),
  type: z.enum(["string", "number", "boolean", "json"]).optional().default("string"),
});

export type AppSettingInput = z.infer<typeof appSettingSchema>;
