import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Edit, History, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MarkdownRenderer } from "~/components/MarkdownRenderer";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Recipes } from "~/lib/data/recipes";
import { recipeIdSchema } from "~/lib/dataValidators";
import { formatDateTime } from "~/lib/dateUtils";

const getRecipe = createServerFn({ method: "GET" })
  .validator((data: unknown) => recipeIdSchema.parse(data))
  .handler(async (ctx) => {
    const recipe = await Recipes.read(ctx.data.recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }
    return recipe;
  });

const deleteRecipe = createServerFn({ method: "POST" })
  .validator((data: unknown) => recipeIdSchema.parse(data))
  .handler(async (ctx) => {
    return Recipes.deleteRecipe(ctx.data.recipeId);
  });

export const Route = createFileRoute("/recipes/$recipeId/")({
  component: RecipeDetail,
  loader: ({ params }) => {
    return getRecipe({ data: { recipeId: params.recipeId } });
  },
});

function RecipeDetail() {
  const recipe = Route.useLoaderData();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRecipe({ data: { recipeId: recipe.id } });
      toast.success("Recipe deleted successfully!");
      // Navigate back to recipes list
      window.history.back();
    } catch (error) {
      console.error("Failed to delete recipe:", error);
      toast.error("Failed to delete recipe. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const currentVersion = recipe.currentVersion;

  return (
    <div className="space-y-6">
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
            <BreadcrumbPage>{recipe.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{recipe.title}</h1>
          <p className="text-muted-foreground">Version {currentVersion?.versionId || "No version"} • AI Agent Recipe</p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/recipes/$recipeId/versions" params={{ recipeId: recipe.id }}>
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              Version History
            </Button>
          </Link>
          <Link to="/recipes/$recipeId/edit" params={{ recipeId: recipe.id }}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Content</CardTitle>
              <CardDescription>Step-by-step instructions for AI agents</CardDescription>
            </CardHeader>
            <CardContent>
              {currentVersion?.content ? (
                <MarkdownRenderer content={currentVersion.content} variant="default" />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">No content available for this recipe.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metadata Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Recipe Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Recipe ID</div>
                  <p className="text-sm font-mono">{recipe.shortId}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Version</div>
                  <p className="text-sm">{currentVersion?.versionId || "No version"}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Created</div>
                  <p className="text-sm">{formatDateTime(recipe.createdAt)}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                  <p className="text-sm">{formatDateTime(recipe.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {currentVersion?.tags && currentVersion.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {currentVersion.tags.map((tag) => (
                      <span key={tag.id} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Projects */}
            {currentVersion?.projects && currentVersion.projects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentVersion.projects.map((project) => (
                      <Link
                        key={project.id}
                        to="/projects/$projectId"
                        params={{ projectId: project.id }}
                        className="block p-2 bg-primary/10 text-primary rounded text-sm hover:bg-primary/20 transition-colors">
                        {project.title}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Summary */}
            {currentVersion?.aiSummary && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Summary</CardTitle>
                  <CardDescription>Auto-generated summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <MarkdownRenderer content={currentVersion.aiSummary} variant="compact" />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{recipe.title}"? This action cannot be undone and will delete all
              versions of this recipe.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Recipe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
