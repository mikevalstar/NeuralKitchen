import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { MarkdownRenderer } from "~/components/MarkdownRenderer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import type { Project, RecipeVersion, Tag } from "~/generated/prisma";
import { Recipes } from "~/lib/data/recipes";
import { recipeIdSchema, versionRestoreSchema } from "~/lib/dataValidators";
import { formatDateOnly, formatDateTime } from "~/lib/dateUtils";

type VersionWithRelations = RecipeVersion & {
  tags: Tag[];
  projects: Project[];
};

const getRecipe = createServerFn({ method: "GET" })
  .validator((data: unknown) => recipeIdSchema.parse(data))
  .handler(async (ctx) => {
    const recipe = await Recipes.read(ctx.data.recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }
    return recipe;
  });

const getVersionHistory = createServerFn({ method: "GET" })
  .validator((data: unknown) => recipeIdSchema.parse(data))
  .handler(async (ctx) => {
    const versions = await Recipes.getVersionHistory(ctx.data.recipeId);
    return versions;
  });

const restoreVersion = createServerFn({ method: "POST" })
  .validator((data: unknown) => versionRestoreSchema.parse(data))
  .handler(async (ctx) => {
    return Recipes.revertToVersion(ctx.data.recipeId, ctx.data.versionNumber);
  });

export const Route = createFileRoute("/recipes/$recipeId/versions/")({
  component: VersionHistory,
  loader: async ({ params }) => {
    try {
      const [recipe, versions] = await Promise.all([
        getRecipe({ data: { recipeId: params.recipeId } }),
        getVersionHistory({ data: { recipeId: params.recipeId } }),
      ]);
      return { recipe, versions };
    } catch (error) {
      console.error("Failed to load version history:", error);
      throw new Error("Failed to load version history");
    }
  },
});

function VersionHistory() {
  const { recipe, versions } = Route.useLoaderData();
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [restoreDialog, setRestoreDialog] = useState<{ version: VersionWithRelations } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const router = useRouter();

  const handleVersionSelect = (versionId: string, checked: boolean) => {
    if (checked) {
      if (selectedVersions.length < 2) {
        setSelectedVersions([...selectedVersions, versionId]);
      }
    } else {
      setSelectedVersions(selectedVersions.filter((id) => id !== versionId));
    }
  };

  const handleRestoreVersion = async (version: VersionWithRelations) => {
    setIsRestoring(true);
    try {
      await restoreVersion({
        data: {
          recipeId: recipe.id,
          versionNumber: version.versionNumber,
        },
      });
      toast.success(`Successfully restored ${version.versionId}`);
      // Navigate back to the main recipe page to see the restored version
      router.navigate({ to: "/recipes/$recipeId", params: { recipeId: recipe.id } });
    } catch (error) {
      console.error("Failed to restore version:", error);
      toast.error("Failed to restore version. Please try again.");
    } finally {
      setIsRestoring(false);
      setRestoreDialog(null);
    }
  };

  const compareMode = selectedVersions.length === 2;
  const selectedVersion = selectedVersions.length === 1 ? versions.find((v) => v.id === selectedVersions[0]) : null;

  return (
    <TooltipProvider>
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
              <BreadcrumbLink>
                <Link to="/recipes/$recipeId" params={{ recipeId: recipe.id }}>
                  {recipe.title}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Version History</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Version History for {recipe.title}</h1>
          <p className="text-muted-foreground">Select versions to compare</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 min-h-[600px]">
          {/* Left Panel - Version List */}
          <div className="lg:col-span-3">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Versions ({versions.length})</CardTitle>
                <CardDescription>Select up to 2 versions to compare</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {versions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No versions found</p>
                    <p className="text-sm text-muted-foreground mt-1">This recipe doesn't have any versions yet.</p>
                  </div>
                ) : (
                  versions.map((version, index) => (
                    <Tooltip key={version.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex items-center space-x-3 p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedVersions.includes(version.id)
                              ? "bg-muted border-primary"
                              : "hover:border-muted-foreground/30"
                          }`}
                          onClick={() => {
                            const isSelected = selectedVersions.includes(version.id);
                            handleVersionSelect(version.id, !isSelected);
                          }}>
                          {/* Git-style graph line */}
                          <div className="relative flex flex-col items-center">
                            {/* Top line (except for first item) */}
                            {index > 0 && <div className="absolute -top-3 w-0.5 h-3 bg-primary"></div>}

                            {/* Dot */}
                            <div
                              className={`w-3 h-3 rounded-full border-2 border-primary ${
                                version.isCurrent ? "bg-primary" : "bg-background"
                              }`}></div>

                            {/* Bottom line (except for last item) */}
                            {index < versions.length - 1 && (
                              <div className="absolute -bottom-3 w-0.5 h-3 bg-primary"></div>
                            )}
                          </div>

                          <Checkbox
                            checked={selectedVersions.includes(version.id)}
                            onChange={() => {}} // controlled by parent click
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {version.versionId}
                                {version.isCurrent && <span className="text-xs text-primary">(Current)</span>}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">{formatDateOnly(version.createdAt)}</div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-sm">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {version.versionId}: {version.title}
                          </div>
                          <div className="text-xs text-foreground/70">{formatDateTime(version.createdAt)}</div>
                          {version.comment && <div className="text-xs italic">"{version.comment}"</div>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))
                )}

                {/* Compare Button */}
                {versions.length > 1 && (
                  <div className="pt-3 border-t">
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={selectedVersions.length !== 2}
                      variant={compareMode ? "default" : "outline"}>
                      {compareMode
                        ? "Showing Comparison"
                        : selectedVersions.length === 0
                          ? "Select 2 versions to compare"
                          : selectedVersions.length === 1
                            ? "Select 1 more version"
                            : "Compare Selected"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview/Comparison */}
          <div className="lg:col-span-7">
            {compareMode && selectedVersions.length === 2 ? (
              (() => {
                const version1 = versions.find((v) => v.id === selectedVersions[0]);
                const version2 = versions.find((v) => v.id === selectedVersions[1]);
                return version1 && version2 ? (
                  <ComparisonView
                    version1={version1}
                    version2={version2}
                    onRestore={(version) => setRestoreDialog({ version })}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-center">
                    <p className="text-muted-foreground">Selected versions not found</p>
                  </div>
                );
              })()
            ) : selectedVersion ? (
              <SingleVersionView version={selectedVersion} onRestore={(version) => setRestoreDialog({ version })} />
            ) : (
              <div className="flex items-center justify-center h-64 text-center">
                <div>
                  <p className="text-muted-foreground">Select a version to preview</p>
                  <p className="text-sm text-muted-foreground mt-1">Or select 2 versions to compare side-by-side</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Restore Confirmation Dialog */}
        <AlertDialog open={!!restoreDialog} onOpenChange={() => setRestoreDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restore Version</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to restore {restoreDialog?.version.versionId}?
                <br />
                <br />
                This will create a new version with the content from {restoreDialog?.version.versionId}. The current
                version will be preserved in the version history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => restoreDialog && handleRestoreVersion(restoreDialog.version)}
                disabled={isRestoring}>
                {isRestoring ? "Restoring..." : "Restore Version"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

function SingleVersionView({
  version,
  onRestore,
}: {
  version: VersionWithRelations;
  onRestore: (version: VersionWithRelations) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {version.versionId}: {version.title}
            </CardTitle>
            <CardDescription>
              Created {formatDateTime(version.createdAt)}
              {version.isCurrent && " • Current Version"}
            </CardDescription>
          </div>
          {!version.isCurrent && (
            <Button variant="outline" size="sm" onClick={() => onRestore(version)}>
              Restore This Version
            </Button>
          )}
        </div>
        {version.comment && (
          <div className="text-sm italic text-muted-foreground border-l-2 border-muted pl-3">"{version.comment}"</div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-3">Content</h4>
          <div className="prose prose-sm max-w-none">
            <MarkdownRenderer content={version.content} variant="default" />
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          {version.tags.length > 0 && (
            <div>
              <h5 className="font-medium text-sm mb-2">Tags</h5>
              <div className="flex flex-wrap gap-1">
                {version.tags.map((tag) => (
                  <span key={tag.id} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {version.projects.length > 0 && (
            <div>
              <h5 className="font-medium text-sm mb-2">Projects</h5>
              <div className="space-y-1">
                {version.projects.map((project) => (
                  <div key={project.id} className="text-sm text-primary">
                    {project.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonView({
  version1,
  version2,
  onRestore,
}: {
  version1: VersionWithRelations;
  version2: VersionWithRelations;
  onRestore: (version: VersionWithRelations) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Comparing Versions</CardTitle>
          <CardDescription>
            Side-by-side comparison of {version1.versionId} and {version2.versionId}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Version 1 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {version1.versionId}: {version1.title}
                </CardTitle>
                <CardDescription>
                  {formatDateTime(version1.createdAt)}
                  {version1.isCurrent && " • Current"}
                </CardDescription>
              </div>
              {!version1.isCurrent && (
                <Button variant="outline" size="sm" onClick={() => onRestore(version1)}>
                  Restore
                </Button>
              )}
            </div>
            {version1.comment && <div className="text-sm italic text-muted-foreground">"{version1.comment}"</div>}
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <MarkdownRenderer content={version1.content} variant="compact" />
            </div>
          </CardContent>
        </Card>

        {/* Version 2 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {version2.versionId}: {version2.title}
                </CardTitle>
                <CardDescription>
                  {formatDateTime(version2.createdAt)}
                  {version2.isCurrent && " • Current"}
                </CardDescription>
              </div>
              {!version2.isCurrent && (
                <Button variant="outline" size="sm" onClick={() => onRestore(version2)}>
                  Restore
                </Button>
              )}
            </div>
            {version2.comment && <div className="text-sm italic text-muted-foreground">"{version2.comment}"</div>}
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <MarkdownRenderer content={version2.content} variant="compact" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
