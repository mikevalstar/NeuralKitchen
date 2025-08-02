import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import prisma from "../lib/prisma";

const getTags = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.tag.findMany({
    where: {
      deletedAt: null, // Only show non-deleted tags
    },
    orderBy: {
      name: "asc",
    },
  });
});

const createTag = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const data = ctx.data as { name: string } | undefined;
  if (!data?.name) {
    throw new Error("Name is required");
  }

  // Check if tag already exists (case-insensitive)
  const existingTag = await prisma.tag.findFirst({
    where: {
      name: {
        equals: data.name,
        mode: "insensitive",
      },
      deletedAt: null,
    },
  });

  if (existingTag) {
    throw new Error("Tag already exists");
  }

  return prisma.tag.create({
    data: {
      name: data.name.trim(),
    },
  });
});

const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name must be less than 50 characters"),
});

export const Route = createFileRoute("/tags")({
  component: Tags,
  loader: () => {
    return getTags();
  },
});

function Tags() {
  const tags = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await createTag({ data: { name: value.name } });
        // Refresh the page to show the new tag
        window.location.reload();
      } catch (error) {
        console.error("Failed to create tag:", error);
        // You could add toast notification here
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
        <p className="text-muted-foreground">Organize content with custom tags</p>
      </div>

      {/* Add Tag Form */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Add New Tag</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    const result = tagSchema.shape.name.safeParse(value);
                    return result.success ? undefined : result.error.issues[0]?.message;
                  },
                }}>
                {(field) => (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Enter tag name..."
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      disabled={isSubmitting}
                    />
                    {field.state.meta.errors ? (
                      <div className="text-sm text-destructive">{field.state.meta.errors.join(", ")}</div>
                    ) : null}
                  </div>
                )}
              </form.Field>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !form.state.canSubmit}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Adding..." : "Add Tag"}
            </button>
          </div>
        </form>
      </div>

      {/* Tags List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Tags</h2>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag.id} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                {tag.name}
              </span>
            ))}
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
            <p className="text-muted-foreground">No tags found</p>
          </div>
        )}
      </div>
    </div>
  );
}
