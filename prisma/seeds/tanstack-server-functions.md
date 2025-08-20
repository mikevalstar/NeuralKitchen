---
title: "TanStack Start Server Functions in Neural Kitchen"
shortId: "tanstack-server-functions"
projects: ["NeuralKitchen"]
tags: ["Backend", "TanStack Start", "Validation", "Server Functions"]
---

# TanStack Start Server Functions in Neural Kitchen

This recipe guides you through creating and implementing server functions in Neural Kitchen using TanStack Start's `createServerFn` pattern with proper validation and authentication.

## Prerequisites

- Understanding of TypeScript and Zod validation
- Familiarity with TanStack Start framework
- Authentication middleware already configured

## Server Function Architecture

Neural Kitchen uses a standardized pattern for server functions that includes:
1. **Authentication middleware** - `authMiddlewareEnsure` for required auth, `authMiddleware` for optional
2. **Input validation** - Zod schemas from `~/lib/dataValidators.ts`
3. **Data access layer** - Namespaced functions from `~/lib/data/`
4. **Error handling** - Consistent error responses

## Step-by-Step Implementation

### 1. Define Validation Schema

First, add your validation schema to `src/lib/dataValidators.ts`:

```typescript
// Example: Adding a new validation schema
export const myEntitySchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

export type MyEntityInput = z.infer<typeof myEntitySchema>;

// For route parameters
export const myEntityIdSchema = z.object({
  entityId: z.string().min(1, "Entity ID is required"),
});

export type MyEntityIdInput = z.infer<typeof myEntityIdSchema>;
```

### 2. Use Existing Data Access Functions

Server functions should use the existing data access layer from `src/lib/data/`. Reference existing namespaces like `Projects`, `Tags`, `Recipes`, etc. for the established patterns.

### 3. Create Server Functions

In your route file, create server functions following this pattern:

```typescript
import { createServerFn } from "@tanstack/react-start";
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { Projects } from "~/lib/data/projects"; // Use existing data access
import { projectSchema, projectIdSchema } from "~/lib/dataValidators";

// GET server function (read operation)
const getProject = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => projectIdSchema.parse(data))
  .handler(async (ctx) => {
    const project = await Projects.read(ctx.data.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    return project;
  });

// POST server function (create/update operation)
const updateProject = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => {
    const parsed = data as { projectId: string; projectData: unknown };
    return {
      projectId: parsed.projectId,
      projectData: projectSchema.parse(parsed.projectData),
    };
  })
  .handler(async (ctx) => {
    return Projects.update(
      ctx.data.projectId, 
      ctx.data.projectData, 
      ctx.context.user?.id
    );
  });
```

### 4. Integration with Route Loader

Use server functions in your route configuration:

```typescript
export const Route = createFileRoute("/projects/$projectId/edit")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  component: ProjectEdit,
  loader: async ({ context, params }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: `/projects/${params.projectId}/edit` },
      });
    }

    return getProject({ data: { projectId: params.projectId } });
  },
});
```

### 5. Call Server Functions from Components

In your React component, call server functions:

```typescript
function ProjectEdit() {
  const project = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: ProjectInput) => {
    setIsSubmitting(true);
    try {
      await updateProject({
        data: {
          projectId: project.id,
          projectData: formData,
        },
      });
      toast.success("Project updated successfully!");
      // Navigate or handle success
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error("Failed to update project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Component render logic...
}
```

## Validation Patterns

### Complex Validation with Multiple Inputs

For server functions that accept multiple parameters with different validation requirements:

```typescript
.validator((data: unknown) => {
  const parsed = data as { 
    projectId: string; 
    projectData: unknown; 
    additionalParam?: unknown 
  };
  
  return {
    projectId: z.string().min(1).parse(parsed.projectId),
    projectData: projectSchema.parse(parsed.projectData),
    additionalParam: z.string().optional().parse(parsed.additionalParam),
  };
})
```

### Optional Authentication

For server functions that work with optional authentication:

```typescript
const getPublicProject = createServerFn({ method: "GET" })
  .middleware([authMiddleware]) // Note: not authMiddlewareEnsure
  .validator((data: unknown) => projectIdSchema.parse(data))
  .handler(async (ctx) => {
    // ctx.context.user may be undefined
    const project = await Projects.read(ctx.data.projectId);
    return project;
  });
```

## Error Handling Best Practices

### 1. Data Access Errors
```typescript
.handler(async (ctx) => {
  try {
    return await Projects.update(ctx.data.projectId, ctx.data.projectData);
  } catch (error) {
    console.error("Data access error:", error);
    throw new Error("Failed to update project");
  }
});
```

### 2. Authorization Errors
```typescript
.handler(async (ctx) => {
  const project = await Projects.read(ctx.data.projectId);
  
  if (!project) {
    throw new Error("Project not found");
  }
  
  if (project.createdBy !== ctx.context.user?.id && ctx.context.user?.role !== "admin") {
    throw new Error("Not authorized to modify this project");
  }
  
  return Projects.update(ctx.data.projectId, ctx.data.projectData);
});
```

### 3. Validation Errors
Zod validation errors are automatically handled by the validator, but you can add custom validation:

```typescript
.validator((data: unknown) => {
  const result = projectSchema.safeParse(data);
  if (!result.success) {
    throw new Error("Invalid input data");
  }
  return result.data;
})
```

## Reference Example

See `src/routes/projects/$projectId/edit.tsx:24-46` for a complete implementation showing:
- GET server function with authentication and validation
- POST server function with complex validation
- Integration with route loader and form handling

## Common Anti-patterns to Avoid

1. **Missing Authentication**: Always include appropriate authentication middleware
2. **Skipping Validation**: Never trust client input - always validate with Zod schemas
3. **Direct Database Access**: Use the existing data access layer namespace functions (Projects, Tags, Recipes, etc.)
4. **Inconsistent Error Handling**: Follow the established error patterns
5. **Missing Type Safety**: Always use existing Zod schemas from `~/lib/dataValidators.ts`

## Code Quality Verification

After implementing server functions, always run the following checks to ensure code quality:

### 1. TypeScript Type Checking
```bash
pnpm build
```
This command runs TypeScript compilation and catches type errors. Ensure no TypeScript errors before considering the implementation complete.

**Verification Checklist:**
- [ ] Run `pnpm build` - TypeScript compilation passes without errors
- [ ] Server functions are properly typed with Zod schemas
- [ ] Import statements resolve correctly

### 2. Biome Linting and Formatting
```bash
pnpm check:fix
```
This runs both linting and formatting with auto-fix. Use this to maintain consistent code style across the project.

**Available Biome Commands:**
- `pnpm lint` - Run linting checks only
- `pnpm lint:fix` - Run linting with auto-fix
- `pnpm format` - Check code formatting
- `pnpm format:fix` - Format code with auto-fix
- `pnpm check` - Run all checks (lint + format)
- `pnpm check:fix` - Run all checks with auto-fix (recommended)

**Verification Checklist:**
- [ ] Run `pnpm check:fix` - All linting and formatting issues resolved
- [ ] Code follows existing formatting patterns
- [ ] Import statements are properly organized
- [ ] No unused variables or imports remain

### 3. Manual Testing Implementation

**Functional Testing Checklist:**
- [ ] Server functions respond correctly to valid inputs
- [ ] Validation properly rejects invalid inputs with clear error messages
- [ ] Authentication middleware works as expected (blocks unauthorized access)
- [ ] Error handling provides appropriate user feedback
- [ ] All existing functionality still works as expected
- [ ] Test both success and error scenarios


## Expected Outcome

- Server functions follow Neural Kitchen's established patterns
- Input validation is comprehensive and type-safe
- Authentication is properly implemented
- Error handling is consistent and user-friendly
- Code is maintainable and follows project conventions
- TypeScript compilation passes without errors
- Code passes Biome linting and formatting checks

## Links

- https://tanstack.com/start/latest/docs/framework/react/server-functions