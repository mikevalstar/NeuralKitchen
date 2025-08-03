import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Save } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
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
import { Input } from "~/components/ui/input";
import { Projects } from "~/lib/data/projects";
import { Recipes } from "~/lib/data/recipes";
import { Tags } from "~/lib/data/tags";
import { recipeIdSchema, recipeSchema, recipeVersionSchema } from "~/lib/dataValidators";

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  diffSourcePlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  BlockTypeSelect,
  DiffSourceToggleWrapper,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

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
      getProjects()
    ]);
    return { recipe, tags, projects };
  },
});

function RecipeEdit() {
  const router = useRouter();
  const { recipe, tags, projects } = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [content, setContent] = useState(() => {
    // Safely initialize content, handling potential parsing issues
    const rawContent = recipe.currentVersion?.content || "";
    try {
      // Basic validation - ensure content is a string and not empty
      return typeof rawContent === 'string' ? rawContent : "";
    } catch (error) {
      console.warn("Issue loading recipe content:", error);
      return "";
    }
  });
  const [selectedTags, setSelectedTags] = useState<string[]>(
    recipe.currentVersion?.tags.map(tag => tag.id) || []
  );
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    recipe.currentVersion?.projects.map(project => project.id) || []
  );

  // Sanitize markdown content for better MDX editor compatibility
  const sanitizeMarkdown = (markdown: string) => {
    if (!markdown) return "";
    
    try {
      // Fix common markdown parsing issues
      let sanitized = markdown
        // Ensure code blocks have proper language tags
        .replace(/```(\s*\n)/g, '```text\n')
        // Fix inline code that might be causing issues
        .replace(/`([^`]*)`/g, (match, code) => {
          // Ensure inline code doesn't contain problematic characters
          return `\`${code.replace(/\n/g, ' ')}\``;
        })
        // Ensure proper line endings
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
      
      return sanitized;
    } catch (error) {
      console.warn("Error sanitizing markdown:", error);
      return markdown;
    }
  };

  // Effect to handle content sanitization and error recovery
  useEffect(() => {
    const rawContent = recipe.currentVersion?.content || "";
    if (rawContent) {
      try {
        const sanitized = sanitizeMarkdown(rawContent);
        setContent(sanitized);
        setEditorError(null); // Clear any previous errors
      } catch (error) {
        console.error("Error processing recipe content:", error);
        setEditorError(error instanceof Error ? error.message : "Failed to process recipe content");
        setContent(rawContent); // Use raw content as fallback
      }
    }
  }, [recipe.currentVersion?.content]);

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
        const result = await updateRecipe({
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
          params: { recipeId: recipe.id } 
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
    try {
      setContent(value);
    } catch (error) {
      console.error("Error updating content:", error);
      setEditorError(error instanceof Error ? error.message : "Unknown error");
    }
  }, []);

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/recipes">Recipes</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Recipe</h1>
          <p className="text-muted-foreground">
            Editing will create a new version (v{(recipe.currentVersion?.versionNumber || 0) + 1})
          </p>
        </div>
      </div>

      {/* Edit Form */}
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

        {/* Content Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Recipe Content</CardTitle>
            <CardDescription>
              Edit the step-by-step instructions for AI agents. Changes will create a new version.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              {editorError ? (
                <div className="min-h-[400px] p-4">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-destructive mb-2">Editor Loading Error</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      There was an issue loading the recipe content in the editor. You can still edit using the fallback text area below.
                    </p>
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">Error Details</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">{editorError}</pre>
                    </details>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditorError(null);
                        // Force re-initialization
                        const rawContent = recipe.currentVersion?.content || "";
                        setContent(sanitizeMarkdown(rawContent));
                      }}
                      className="mt-2"
                    >
                      Retry Editor
                    </Button>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start writing your recipe content here..."
                    className="w-full min-h-[300px] p-3 border rounded-lg bg-background text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ) : content !== null ? (
                <MDXEditor
                  key={`${recipe.id}-${recipe.currentVersion?.id}`} // Force re-render
                  markdown={content}
                  onChange={handleContentChange}
                  contentEditableClassName="min-h-[400px] p-4 max-w-none"
                  placeholder="Start writing your recipe content here..."
                  plugins={[
                    headingsPlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    thematicBreakPlugin(),
                    markdownShortcutPlugin(),
                    linkPlugin(),
                    linkDialogPlugin(),
                    imagePlugin(),
                    tablePlugin(),
                    codeBlockPlugin({
                      defaultCodeBlockLanguage: 'text'
                    }),
                    codeMirrorPlugin({ 
                      codeBlockLanguages: { 
                        '': 'Plain Text',
                        text: 'Plain Text',
                        js: 'JavaScript', 
                        javascript: 'JavaScript', 
                        tsx: 'TypeScript', 
                        typescript: 'TypeScript', 
                        bash: 'Bash', 
                        shell: 'Shell',
                        sql: 'SQL', 
                        python: 'Python',
                        py: 'Python',
                        json: 'JSON',
                        css: 'CSS',
                        html: 'HTML',
                        yaml: 'YAML',
                        yml: 'YAML'
                      }
                    }),
                    diffSourcePlugin({ 
                      viewMode: 'rich-text',
                      diffMarkdown: sanitizeMarkdown(recipe.currentVersion?.content || ''),
                      readOnlyDiff: false
                    }),
                    toolbarPlugin({
                      toolbarContents: () => (
                        <DiffSourceToggleWrapper>
                          <UndoRedo />
                          <BoldItalicUnderlineToggles />
                          <CodeToggle />
                          <BlockTypeSelect />
                          <CreateLink />
                          <InsertImage />
                          <InsertTable />
                          <InsertThematicBreak />
                          <ListsToggle />
                        </DiffSourceToggleWrapper>
                      )
                    })
                  ]}
                  className="min-h-[400px]"
                />
              ) : (
                <div className="min-h-[400px] p-4 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    Loading editor...
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tags and Projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedTags.includes(tag.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
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
                <div className="space-y-2">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => toggleProject(project.id)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        selectedProjects.includes(project.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      <div className="font-medium">{project.title}</div>
                      {project.description && (
                        <div className="text-xs opacity-80 mt-1">{project.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No projects available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-2">
          <Link to="/recipes/$recipeId" params={{ recipeId: recipe.id }}>
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || !form.state.canSubmit}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}