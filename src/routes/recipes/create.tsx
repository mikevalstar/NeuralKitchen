import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
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
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { getUserDetails } from "~/lib/auth-server-user";
import { Projects } from "~/lib/data/projects";
import { Recipes } from "~/lib/data/recipes";
import { Tags } from "~/lib/data/tags";
import { recipeSchema, recipeVersionSchema } from "~/lib/dataValidators";

// Server functions
const getTags = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .handler(async () => {
    return Tags.list();
  });

const getProjects = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .handler(async () => {
    return Projects.list();
  });

const createRecipe = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => {
    const parsed = data as { recipe: unknown; version: unknown };
    return {
      recipe: recipeSchema.parse(parsed.recipe),
      version: recipeVersionSchema.parse(parsed.version),
    };
  })
  .handler(async (ctx) => {
    return Recipes.create(ctx.data.recipe, ctx.data.version);
  });

export const Route = createFileRoute("/recipes/create")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  component: RecipeCreate,
  loader: async ({ context }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: "/recipes/create" },
      });
    }

    const [tags, projects] = await Promise.all([getTags(), getProjects()]);
    return { tags, projects };
  },
});

function RecipeCreate() {
  const router = useRouter();
  const { tags, projects } = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const form = useForm({
    defaultValues: {
      title: "",
      shortId: "",
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
        const result = await createRecipe({
          data: {
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

        toast.success("Recipe created successfully!");
        router.navigate({
          to: "/recipes/$recipeId",
          params: { recipeId: result.recipe.id },
        });
      } catch (error) {
        console.error("Failed to create recipe:", error);
        toast.error("Failed to create recipe. Please try again.");
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
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/recipes">Recipes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Create Recipe</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Recipe</h1>
            <p className="text-muted-foreground">Create a new AI agent recipe</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recipe Content</CardTitle>
            <CardDescription>Write the step-by-step instructions for AI agents</CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Basic details about this recipe</CardDescription>
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
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <Link to="/recipes">
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
                {isSubmitting ? "Creating..." : "Create Recipe"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
