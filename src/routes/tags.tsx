import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Tags } from "~/lib/data/tags";
import { tagSchema } from "~/lib/dataValidators";

const getTags = createServerFn({ method: "GET" }).handler(async () => {
  return Tags.list();
});

const createTag = createServerFn({ method: "POST" })
  .validator((data: unknown) => tagSchema.parse(data))
  .handler(async (ctx) => {
    return Tags.create(ctx.data);
  });

export const Route = createFileRoute("/tags")({
  component: TagsPage,
  loader: () => {
    return getTags();
  },
});

function TagsPage() {
  const router = useRouter();
  const tags = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: tagSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await createTag({ data: { name: value.name } });
        // Clear the form
        form.reset();
        // Refresh the data to show the new tag
        router.invalidate();
        toast.success("Tag created successfully!");
      } catch (error) {
        console.error("Failed to create tag:", error);
        toast.error("Failed to create tag. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Tags</h1>
        <p className="text-muted-foreground text-lg">Organize your content with custom tags</p>
      </div>

      {/* Add Tag Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Tag</CardTitle>
          <CardDescription>Create a new tag to organize your content</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4">
            <form.Field name="name">
              {(field) => {
                const charCount = field.state.value.length;
                const maxChars = 50;
                const isNearLimit = charCount > 40;
                const isAtLimit = charCount >= maxChars;

                return (
                  <div className="space-y-2">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          type="text"
                          placeholder="Enter tag name..."
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          disabled={isSubmitting}
                          className={field.state.meta.errors?.length ? "border-destructive" : ""}
                        />
                      </div>
                      <Button type="submit" disabled={isSubmitting || !form.state.canSubmit} className="min-w-[100px]">
                        {isSubmitting ? "Adding..." : "Add Tag"}
                      </Button>
                    </div>

                    {/* Character counter */}
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
                        }`}>
                        {charCount}/{maxChars}
                      </div>
                    </div>
                  </div>
                );
              }}
            </form.Field>
          </form>
        </CardContent>
      </Card>

      {/* Tags List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tags ({tags.length})</CardTitle>
          <CardDescription>Manage and view all your tags</CardDescription>
        </CardHeader>
        <CardContent>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-sm px-3 py-1">
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Tag className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No tags yet</h3>
              <p className="text-muted-foreground">Create your first tag to get started organizing your content.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
