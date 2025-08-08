import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Plus, Search, Tag } from "lucide-react";
import { useMemo, useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tags, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Tags</h1>
        <p className="text-muted-foreground text-lg">Organize your content with custom tags</p>
      </div>

      {/* Add Tag Form - Compact Design */}
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-3">
          <form.Field name="name">
            {(field) => {
              const charCount = field.state.value.length;
              const maxChars = 50;
              const isNearLimit = charCount > 40;
              const isAtLimit = charCount >= maxChars;

              return (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Plus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Create a new tag..."
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={isSubmitting}
                        className={`pl-10 ${field.state.meta.errors?.length ? "border-destructive" : ""}`}
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting || !form.state.canSubmit} size="default">
                      {isSubmitting ? "Adding..." : "Add"}
                    </Button>
                  </div>

                  {/* Error and character counter */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex-1">
                      {field.state.meta.errors?.length ? (
                        <span className="text-destructive">
                          {field.state.meta.errors.map((error) => error?.message).join(", ")}
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={
                        isAtLimit
                          ? "text-destructive font-medium"
                          : isNearLimit
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground"
                      }>
                      {charCount}/{maxChars}
                    </span>
                  </div>
                </div>
              );
            }}
          </form.Field>
        </form>
      </div>

      {/* Tags List with Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Tags ({tags.length})</CardTitle>
              <CardDescription>Manage and view all your tags</CardDescription>
            </div>
            <div className="w-72">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Tag className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No tags yet</h3>
              <p className="text-muted-foreground">Create your first tag to get started organizing your content.</p>
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No tags found</h3>
              <p className="text-muted-foreground">No tags match "{searchQuery}". Try a different search term.</p>
            </div>
          ) : (
            <div>
              {searchQuery && (
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {filteredTags.length} of {tags.length} tags
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {filteredTags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-sm px-3 py-1.5">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
