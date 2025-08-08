import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { ArrowRight, ChevronDown, ChevronUp, Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { MarkdownRenderer } from "~/components/MarkdownRenderer";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Projects } from "~/lib/data/projects";
import { type SearchResult, SearchService } from "~/lib/services/search";

const searchSchema = z.object({
  q: z.string().optional(),
  limit: z.number().optional().default(10),
  projects: z.array(z.string()).optional(),
});

const searchRecipes = createServerFn({ method: "GET" })
  .validator((data: unknown) => searchSchema.parse(data))
  .handler(async ({ data }) => {
    if (!data.q || data.q.trim() === "") {
      return [];
    }

    return await SearchService.hybridSearch(data.q, data.limit, data.projects);
  });

const getProjects = createServerFn({ method: "GET" }).handler(async () => {
  return await Projects.list();
});

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search: { q, limit, projects } }) => ({ q, limit, projects }),
  loader: async ({ deps }) => {
    const projectsData = await getProjects();

    if (deps.q) {
      const searchResults = await searchRecipes({ data: deps });
      return { results: searchResults, projects: projectsData };
    }

    return { results: [], projects: projectsData };
  },
});

function SearchPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { results, projects } = Route.useLoaderData();
  const [query, setQuery] = useState(search.q || "");
  const [selectedProjects, setSelectedProjects] = useState<string[]>(search.projects || []);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Show advanced filters if any filters are active
  useEffect(() => {
    if (selectedProjects.length > 0) {
      setShowAdvanced(true);
    }
  }, [selectedProjects]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      await navigate({
        to: "/search",
        search: {
          q: query.trim(),
          projects: selectedProjects.length > 0 ? selectedProjects : undefined,
        },
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleProjectToggle = (projectShortId: string, checked: boolean) => {
    const newSelectedProjects = checked
      ? [...selectedProjects, projectShortId]
      : selectedProjects.filter((id) => id !== projectShortId);

    setSelectedProjects(newSelectedProjects);
  };

  const clearAllFilters = () => {
    setSelectedProjects([]);
    if (search.q) {
      navigate({
        to: "/search",
        search: { q: search.q },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Recipes</h1>
          <p className="text-muted-foreground">Find AI development recipes using semantic search</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for recipes, frameworks, concepts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {selectedProjects.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {selectedProjects.length}
                </span>
              )}
            </Button>
            <Button type="submit" disabled={isSearching || !query.trim()}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Search Filters</CardTitle>
                  {selectedProjects.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project Filters */}
                {projects.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Projects</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {projects.map((project) => (
                        <div key={project.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`project-${project.id}`}
                            checked={selectedProjects.includes(project.shortId)}
                            onCheckedChange={(checked) => handleProjectToggle(project.shortId, !!checked)}
                          />
                          <label
                            htmlFor={`project-${project.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                            {project.title}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </form>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {search.q && (
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              {results.length > 0
                ? `Found ${results.length} result${results.length === 1 ? "" : "s"} for "${search.q}"`
                : `No results found for "${search.q}"`}
            </div>
            {selectedProjects.length > 0 && (
              <div className="flex items-center gap-2">
                <span>Filtered by projects:</span>
                <div className="flex gap-1">
                  {selectedProjects.map((projectId) => {
                    const project = projects.find((p) => p.shortId === projectId);
                    return project ? (
                      <span key={projectId} className="px-2 py-1 text-xs bg-muted rounded-md">
                        {project.title}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result) => (
              <SearchResultCard key={result.versionId} result={result} />
            ))}
          </div>
        )}

        {search.q && results.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No recipes found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search terms or browse all recipes.</p>
              <Link to="/recipes">
                <Button variant="outline">
                  Browse All Recipes
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!search.q && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Start searching</h3>
              <p className="text-muted-foreground mb-4">
                Enter a search term above to find relevant AI development recipes.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("React");
                    navigate({ to: "/search", search: { q: "React" } });
                  }}>
                  React
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("API");
                    navigate({ to: "/search", search: { q: "API" } });
                  }}>
                  API
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("Database");
                    navigate({ to: "/search", search: { q: "Database" } });
                  }}>
                  Database
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count lines in the summary to determine if we need show more/less
  const summaryLines = result.summary ? result.summary.split("\n").length : 0;
  const shouldShowExpandButton = summaryLines > 5;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">
              <Link
                to="/recipes/$recipeId"
                params={{ recipeId: result.recipeId }}
                className="text-primary hover:underline">
                {result.title}
              </Link>
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{result.shortid}</span>
              {result.similarity < 1 && (
                <>
                  <span>•</span>
                  <span>{Math.round(result.similarity * 100)}% match</span>
                </>
              )}
            </div>
          </div>
        </div>

        {result.summary && (
          <div className="mt-3">
            <div
              className={!isExpanded && shouldShowExpandButton ? "line-clamp-5" : ""}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: !isExpanded && shouldShowExpandButton ? 5 : "unset",
                WebkitBoxOrient: "vertical",
                overflow: !isExpanded && shouldShowExpandButton ? "hidden" : "visible",
              }}>
              <MarkdownRenderer content={result.summary} variant="search" />
            </div>

            {shouldShowExpandButton && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2 transition-colors">
                {isExpanded ? (
                  <>
                    Show less
                    <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Show more
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <Link
          to="/recipes/$recipeId"
          params={{ recipeId: result.recipeId }}
          className="inline-flex items-center text-sm text-primary hover:underline">
          View Recipe
          <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      </CardContent>
    </Card>
  );
}
