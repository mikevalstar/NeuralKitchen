---
title: "TanStack Form Validation with Zod in Neural Kitchen"
shortId: "tanstack-form-validation"
projects: ["NeuralKitchen"]
tags: ["Frontend", "Forms", "Validation", "TanStack Form", "Zod"]
---

# TanStack Form Validation with Zod in Neural Kitchen

This recipe guides you through implementing client-side form validation in Neural Kitchen using TanStack Form with Zod schemas, ensuring proper type safety and user experience.

## Prerequisites

- Understanding of TypeScript and React hooks
- Familiarity with Zod validation schemas
- TanStack Form and TanStack Router already configured
- Existing validation schemas in `~/lib/dataValidators.ts`

## Form Validation Architecture

Neural Kitchen uses a standardized pattern for form validation that includes:
1. **Zod schemas** - Defined in `~/lib/dataValidators.ts` for type safety and validation
2. **TanStack Form** - Client-side form state management and validation
3. **Server function integration** - Seamless validation handoff to server functions
4. **Error handling** - User-friendly error messages with field-level feedback

## Step-by-Step Implementation

### 1. Define or Reference Validation Schema

Ensure your Zod schema exists in `src/lib/dataValidators.ts`. For optional fields, use `.optional()` instead of unions:

```typescript
// ✅ Correct: Use .optional() for optional fields
export const projectSchema = z.object({
  title: z.string().min(1, "Project title is required").max(100, "Title must be less than 100 characters"),
  shortId: z
    .string()
    .min(1, "Project ID is required")
    .max(50, "Project ID must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Project ID can only contain letters, numbers, hyphens, and underscores"),
  description: z.string().max(300, "Description must be less than 300 characters").optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

// ❌ Avoid: Union types with undefined cause form type issues
// description: z.union([z.string().max(300, "..."), z.undefined()])
```

### 2. Set Up Form with Proper Type Alignment

Create your form with default values that match the Zod schema's optional field structure:

```typescript
import { useForm } from "@tanstack/react-form";
import { projectSchema } from "~/lib/dataValidators";

function ProjectForm() {
  const form = useForm({
    // ✅ Correct: Type assertion ensures schema compatibility
    defaultValues: {
      title: "",
      shortId: "",
      description: undefined, // Optional field starts undefined
    } as { title: string; shortId: string; description?: string },
    
    // ✅ Direct schema validation (no adapter needed in current TanStack Form)
    validators: {
      onChange: projectSchema,
    },
    
    onSubmit: async ({ value }) => {
      // Handle form submission...
    },
  });
}
```

### 3. Handle Optional Fields in Form Controls

For optional fields that might be `undefined`, provide fallback values in form controls:

```typescript
// ✅ Handle potentially undefined optional fields
<form.Field name="description">
  {(field) => {
    const charCount = (field.state.value || "").length; // Fallback for undefined
    const maxChars = 300;
    
    return (
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description (optional)
        </label>
        <Textarea
          id="description"
          placeholder="Enter description..."
          value={field.state.value || ""} // Fallback for undefined
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          className={field.state.meta.errors?.length ? "border-destructive" : ""}
        />
        
        {/* Error display */}
        {field.state.meta.errors?.length ? (
          <div className="text-sm text-destructive">
            {field.state.meta.errors.map((error) => error?.message).join(", ")}
          </div>
        ) : null}
        
        {/* Character count */}
        <div className="text-xs text-muted-foreground">
          {charCount}/{maxChars}
        </div>
      </div>
    );
  }}
</form.Field>
```

### 4. Form Submission with Server Function Integration

Integrate client-side validation with server functions:

```typescript
const form = useForm({
  // ... form configuration
  
  onSubmit: async ({ value }) => {
    setIsSubmitting(true);
    try {
      await createProject({
        data: {
          title: value.title,
          shortId: value.shortId,
          description: value.description || undefined, // Convert empty string to undefined if needed
        },
      });
      
      // Success handling
      toast.success("Project created successfully!");
      form.reset();
      router.invalidate(); // Refresh data
      
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  },
});
```

### 5. Complete Form Implementation Pattern

Here's the complete pattern used in Neural Kitchen:

```typescript
import { useForm } from "@tanstack/react-form";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { projectSchema } from "~/lib/dataValidators";

// Server function for form submission
const createProject = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => projectSchema.parse(data))
  .handler(async (ctx) => {
    return Projects.create(ctx.data, ctx.context.user.id);
  });

function ProjectCreateForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm({
    defaultValues: {
      title: "",
      shortId: "",
      description: undefined,
    } as { title: string; shortId: string; description?: string },
    
    validators: {
      onChange: projectSchema,
    },
    
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await createProject({ data: value });
        toast.success("Project created successfully!");
        form.reset();
      } catch (error) {
        console.error("Failed to create project:", error);
        toast.error("Failed to create project. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      {/* Required field */}
      <form.Field name="title">
        {(field) => (
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              disabled={isSubmitting}
              className={field.state.meta.errors?.length ? "border-destructive" : ""}
            />
            {field.state.meta.errors?.length ? (
              <div className="text-sm text-destructive">
                {field.state.meta.errors.map((error) => error?.message).join(", ")}
              </div>
            ) : null}
          </div>
        )}
      </form.Field>

      {/* Optional field */}
      <form.Field name="description">
        {(field) => (
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (optional)
            </label>
            <Textarea
              id="description"
              value={field.state.value || ""}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              disabled={isSubmitting}
              className={field.state.meta.errors?.length ? "border-destructive" : ""}
            />
            {field.state.meta.errors?.length ? (
              <div className="text-sm text-destructive">
                {field.state.meta.errors.map((error) => error?.message).join(", ")}
              </div>
            ) : null}
          </div>
        )}
      </form.Field>

      <Button
        type="submit"
        disabled={isSubmitting || !form.state.canSubmit}
      >
        {isSubmitting ? "Creating..." : "Create Project"}
      </Button>
    </form>
  );
}
```

## Common Validation Patterns

### Character Count with Limits

```typescript
<form.Field name="title">
  {(field) => {
    const charCount = field.state.value.length;
    const maxChars = 100;
    const isNearLimit = charCount > 80;
    const isAtLimit = charCount >= maxChars;
    
    return (
      <div className="space-y-2">
        <Input
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          className={field.state.meta.errors?.length ? "border-destructive" : ""}
        />
        
        <div className="flex justify-between items-center">
          <div className="flex-1">
            {field.state.meta.errors?.length ? (
              <div className="text-sm text-destructive">
                {field.state.meta.errors.map((error) => error?.message).join(", ")}
              </div>
            ) : null}
          </div>
          <div
            className={`text-xs ${
              isAtLimit
                ? "text-destructive font-medium"
                : isNearLimit
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
            }`}
          >
            {charCount}/{maxChars}
          </div>
        </div>
      </div>
    );
  }}
</form.Field>
```

### Select Fields with Validation

```typescript
<form.Field name="category">
  {(field) => (
    <div className="space-y-2">
      <Select
        value={field.state.value}
        onValueChange={field.handleChange}
      >
        <SelectTrigger className={field.state.meta.errors?.length ? "border-destructive" : ""}>
          <SelectValue placeholder="Select category..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="frontend">Frontend</SelectItem>
          <SelectItem value="backend">Backend</SelectItem>
        </SelectContent>
      </Select>
      
      {field.state.meta.errors?.length ? (
        <div className="text-sm text-destructive">
          {field.state.meta.errors.map((error) => error?.message).join(", ")}
        </div>
      ) : null}
    </div>
  )}
</form.Field>
```

## Form Validation Troubleshooting

### Type Compatibility Issues

**Problem**: `ZodObject is not assignable to FormValidateOrFn`

**Solution**: Ensure optional fields use `.optional()` and default values are properly typed:

```typescript
// ✅ Fix the schema
export const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(), // Not z.union([z.string(), z.undefined()])
});

// ✅ Fix the form typing
const form = useForm({
  defaultValues: {
    title: "",
    description: undefined,
  } as { title: string; description?: string }, // Type assertion for optional fields
  validators: {
    onChange: schema,
  },
});
```

### Undefined Field Values

**Problem**: `field.state.value is possibly undefined` errors

**Solution**: Provide fallback values for optional fields:

```typescript
// ✅ Handle undefined values
<Input
  value={field.state.value || ""} // Fallback for undefined
  onChange={(e) => field.handleChange(e.target.value)}
/>

// ✅ For character counting
const charCount = (field.state.value || "").length;
```

### Validation Not Triggering

**Problem**: Form validation doesn't run on field changes

**Solution**: Ensure the schema is directly assigned to `validators.onChange`:

```typescript
// ✅ Correct validation setup
const form = useForm({
  validators: {
    onChange: projectSchema, // Direct schema reference
  },
});

// ❌ Don't use validator adapters - they're not needed in current TanStack Form
```

## Anti-patterns to Avoid

1. **Using Union Types for Optional Fields**: Use `.optional()` instead of `z.union([z.string(), z.undefined()])`
2. **Missing Type Assertions**: Optional fields need explicit typing for form compatibility
3. **Forgetting Undefined Fallbacks**: Always provide fallbacks when accessing potentially undefined optional field values
4. **Using Outdated Validator Adapters**: Current TanStack Form doesn't need `validatorAdapter` or `zodValidator()`
5. **Inconsistent Error Handling**: Always check `field.state.meta.errors?.length` before displaying errors

## Reference Examples

- **Complete Form**: See `src/routes/projects/index.tsx:56-80` for create form implementation
- **Edit Form**: See `src/routes/projects/$projectId/edit.tsx:71-79` for edit form with pre-populated values
- **Complex Validation**: See `src/routes/recipes/$recipeId/edit.tsx:109-116` for multi-field validation

## Code Quality Verification

After implementing form validation, run these checks:

### TypeScript Verification
```bash
pnpm type-check
```
**Checklist:**
- [ ] No TypeScript errors related to form validation
- [ ] Field types are properly inferred from Zod schema
- [ ] Optional field handling doesn't cause type errors

### Biome Checks
```bash
pnpm check:fix
```
**Checklist:**  
- [ ] Consistent code formatting
- [ ] No unused imports or variables
- [ ] Proper import organization

### Functional Testing
**Checklist:**
- [ ] Form validation triggers on field changes
- [ ] Error messages display correctly for invalid inputs
- [ ] Form submission works with valid data
- [ ] Form submission is blocked with invalid data
- [ ] Character counts and limits work correctly
- [ ] Optional fields handle undefined values properly

## Expected Outcome

- Forms provide real-time validation feedback
- Error messages are clear and actionable
- Type safety is maintained between client and server
- User experience is smooth and responsive
- Form state integrates seamlessly with TanStack Router
- Code follows Neural Kitchen's established patterns

## Links

- [TanStack Form Documentation](https://tanstack.com/form/latest)
- [Zod Validation Library](https://zod.dev/)
- [Neural Kitchen Server Functions Recipe](./tanstack-server-functions.md)