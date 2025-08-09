import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { BookOpen, Plus, Search } from "lucide-react";
import { useState } from "react";
import { TanStackPagination } from "~/components/TanStackPagination";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Recipes } from "~/lib/data/recipes";
import { paginationSearchSchema } from "~/lib/dataValidators";
import { formatDateOnly } from "~/lib/dateUtils";

const getRecipes = createServerFn({ method: "GET" })
  .validator((data: unknown) => paginationSearchSchema.parse(data))
  .handler(async ({ data }) => {
    return Recipes.list({
      page: data.page ?? 1,
      pageSize: 25,
    });
  });

export const Route = createFileRoute("/recipes/")({
  component: RecipesPage,
  validateSearch: zodValidator(paginationSearchSchema),
  loaderDeps: ({ search: { page } }) => ({ page }),
  loader: async ({ deps }) => {
    return getRecipes({ data: deps });
  },
});

function RecipesPage() {
  const recipesData = Route.useLoaderData();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({
        to: "/search",
        search: { q: searchQuery.trim() },
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground text-lg">AI agent recipes and development workflows</p>
        </div>

        <Link to="/recipes/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search recipes using AI semantic search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={!searchQuery.trim()}>
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recipes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Recipes ({recipesData.totalCount})</CardTitle>
          <CardDescription>Manage and view all your AI agent recipes</CardDescription>
        </CardHeader>
        <CardContent>
          {recipesData.recipes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="p-4">Title</TableHead>
                  <TableHead className="p-4">Recipe ID</TableHead>
                  <TableHead className="p-4 @8xl:table-cell hidden">Version</TableHead>
                  <TableHead className="p-4">Tags</TableHead>
                  <TableHead className="p-4">Projects</TableHead>
                  <TableHead className="p-4 @8xl:table-cell hidden">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipesData.recipes.map((recipe, index) => (
                  <TableRow key={recipe.id} className={index % 2 === 0 ? "bg-background/50" : ""}>
                    <TableCell className="p-4 font-medium">
                      <Link
                        to="/recipes/$recipeId"
                        params={{ recipeId: recipe.id }}
                        className="text-foreground hover:text-primary transition-colors hover:underline">
                        {recipe.title}
                      </Link>
                    </TableCell>
                    <TableCell className="p-4 font-mono text-sm text-muted-foreground">{recipe.shortId}</TableCell>
                    <TableCell className="p-4 text-sm text-muted-foreground @8xl:table-cell hidden">
                      {recipe.currentVersion ? recipe.currentVersion.versionId : "No version"}
                    </TableCell>
                    <TableCell className="p-4">
                      {recipe.currentVersion?.tags.length ? (
                        <div className="flex flex-wrap gap-1">
                          {recipe.currentVersion.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                              {tag.name}
                            </span>
                          ))}
                          {recipe.currentVersion.tags.length > 3 && (
                            <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                              +{recipe.currentVersion.tags.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No tags</span>
                      )}
                    </TableCell>
                    <TableCell className="p-4">
                      {recipe.currentVersion?.projects.length ? (
                        <div className="flex flex-wrap gap-1">
                          {recipe.currentVersion.projects.slice(0, 2).map((project) => (
                            <span key={project.id} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              {project.title}
                            </span>
                          ))}
                          {recipe.currentVersion.projects.length > 2 && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              +{recipe.currentVersion.projects.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No projects</span>
                      )}
                    </TableCell>
                    <TableCell className="p-4 text-sm text-muted-foreground @8xl:table-cell hidden">
                      {formatDateOnly(recipe.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No recipes yet</h3>
              <p className="text-muted-foreground">Create your first AI agent recipe to get started.</p>
              <Link to="/recipes/create" className="mt-4">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Recipe
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {recipesData.totalPages > 1 && (
        <div className="flex justify-center">
          <TanStackPagination currentPage={recipesData.currentPage} totalPages={recipesData.totalPages} />
        </div>
      )}
    </div>
  );
}
