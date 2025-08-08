import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Save } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { MarkdownEditor } from "~/components/MarkdownEditor";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Projects } from "~/lib/data/projects";
import { Recipes } from "~/lib/data/recipes";
import { Tags } from "~/lib/data/tags";
import { recipeIdSchema, recipeSchema, recipeVersionSchema } from "~/lib/dataValidators";

// Server functions
const getRecipe = createServerFn({ method: "GET" })
  .validator((data: unknown) => recipeIdSchema.parse(data))
  .handler(async (ctx) => {
    const recipe = await Recipes.read(ctx.data.recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }
    return recipe;
  });

const getTags = createServerFn({ method: "GET" }).handler(async () => {
  return Tags.list();
});

const getProjects = createServerFn({ method: "GET" }).handler(async () => {
  return Projects.list();
});

const updateRecipe = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const parsed = data as { recipeId: string; recipe: unknown; version: unknown };
    return {
      recipeId: parsed.recipeId,
      recipe: recipeSchema.parse(parsed.recipe),
      version: recipeVersionSchema.parse(parsed.version),
    };
  })
  .handler(async (ctx) => {
    // Update recipe metadata if needed
    if (ctx.data.recipe.title || ctx.data.recipe.shortId) {
      await Recipes.updateMetadata(ctx.data.recipeId, ctx.data.recipe);
    }

    // Save new version (this automatically creates a new version and sets it as current)
    const newVersion = await Recipes.save(ctx.data.recipeId, ctx.data.version);

    // Return the updated recipe
    const updatedRecipe = await Recipes.read(ctx.data.recipeId);
    return { recipe: updatedRecipe, version: newVersion };
  });

export const Route = createFileRoute("/recipes/$recipeId/edit")({
  component: RecipeEdit,
  loader: async ({ params }) => {
    const [recipe, tags, projects] = await Promise.all([
      getRecipe({ data: { recipeId: params.recipeId } }),
      getTags(),
      getProjects(),
    ]);
    return { recipe, tags, projects };
  },
});

function RecipeEdit() {
  const router = useRouter();
  const { recipe, tags, projects } = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState(recipe.currentVersion?.content || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(recipe.currentVersion?.tags.map((tag) => tag.id) || []);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    recipe.currentVersion?.projects.map((project) => project.id) || [],
  );

  const form = useForm({
    defaultValues: {
      title: recipe.title,
      shortId: recipe.shortId,
    },
    validators: {
      onChange: recipeSchema,
    },
    onSubmit: async ({ value }) => {
      if (!content.trim()) {
        toast.error("Recipe content is required");
        return;
      }

      setIsSubmitting(true);
      try {
        await updateRecipe({
          data: {
            recipeId: recipe.id,
            recipe: {
              title: value.title,
              shortId: value.shortId,
            },
            version: {
              title: value.title,
              content: content.trim(),
              tagIds: selectedTags,
              projectIds: selectedProjects,
            },
          },
        });

        toast.success("Recipe updated successfully! New version created.");
        router.navigate({
          to: "/recipes/$recipeId",
          params: { recipeId: recipe.id },
        });
      } catch (error) {
        console.error("Failed to update recipe:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update recipe. Please try again.";
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
  }, []);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    );
  };

  return (
    <div className="grid flex-1 auto-rows-max gap-4 lg:grid-cols-3 lg:gap-8 pb-20">
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink>
                <Link to="/recipes">Recipes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>
                <Link to="/recipes/$recipeId" params={{ recipeId: recipe.id }}>
                  {recipe.title}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Recipe</h1>
            <p className="text-muted-foreground">
              Editing will create a new version (v{(recipe.currentVersion?.versionNumber || 0) + 1})
            </p>
          </div>
        </div>
        {/* Content Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Recipe Content</CardTitle>
            <CardDescription>
              Edit the step-by-step instructions for AI agents. Changes will create a new version.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MarkdownEditor
              value={content}
              onChange={handleContentChange}
              placeholder="Start writing your recipe content here..."
              minHeight="400px"
            />
          </CardContent>
        </Card>
      </div>
      <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update basic details about this recipe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title Field */}
              <form.Field name="title">
                {(field) => {
                  const charCount = field.state.value.length;
                  const maxChars = 200;
                  const isNearLimit = charCount > 160;
                  const isAtLimit = charCount >= maxChars;

                  return (
                    <div className="space-y-2">
                      <label htmlFor="title" className="text-sm font-medium">
                        Recipe Title *
                      </label>
                      <Input
                        id="title"
                        type="text"
                        placeholder="Enter recipe title..."
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={isSubmitting}
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
                          }`}>
                          {charCount}/{maxChars}
                        </div>
                      </div>
                    </div>
                  );
                }}
              </form.Field>

              {/* ShortId Field */}
              <form.Field name="shortId">
                {(field) => {
                  const charCount = field.state.value.length;
                  const maxChars = 50;
                  const isNearLimit = charCount > 40;
                  const isAtLimit = charCount >= maxChars;

                  return (
                    <div className="space-y-2">
                      <label htmlFor="shortId" className="text-sm font-medium">
                        Recipe ID *
                      </label>
                      <Input
                        id="shortId"
                        type="text"
                        placeholder="e.g., my-awesome-recipe"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={isSubmitting}
                        className={field.state.meta.errors?.length ? "border-destructive" : ""}
                      />

                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          {field.state.meta.errors?.length ? (
                            <div className="text-sm text-destructive">
                              {field.state.meta.errors.map((error) => error?.message).join(", ")}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              Letters, numbers, hyphens, and underscores only. No spaces.
                            </div>
                          )}
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
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Select relevant tags for this recipe</CardDescription>
            </CardHeader>
            <CardContent>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}>
                      {tag.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No tags available</p>
              )}
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Associate this recipe with projects</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`project-${project.id}`}
                        checked={selectedProjects.includes(project.id)}
                        onCheckedChange={() => toggleProject(project.id)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor={`project-${project.id}`} className="font-medium cursor-pointer">
                          {project.title}
                        </Label>
                        {project.description && <p className="text-xs text-muted-foreground">{project.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No projects available</p>
              )}
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div>
                Content:{" "}
                {
                  content
                    .trim()
                    .split(/\s+/)
                    .filter((word) => word.length > 0).length
                }{" "}
                words
              </div>
              <div>Tags: {selectedTags.length}</div>
              <div>Projects: {selectedProjects.length}</div>
              <div>Version: {(recipe.currentVersion?.versionNumber || 0) + 1}</div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <Link to="/recipes/$recipeId" params={{ recipeId: recipe.id }}>
                <Button variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting || !form.state.canSubmit}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
