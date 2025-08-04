import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import { ArrowRight, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { MarkdownRenderer } from "~/components/MarkdownRenderer";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { type SearchResult, SearchService } from "~/lib/services/search";

const searchSchema = z.object({
  q: z.string().optional(),
  limit: z.number().optional().default(10),
});

const searchRecipes = createServerFn({ method: "GET" })
  .validator((data: unknown) => searchSchema.parse(data))
  .handler(async ({ data }) => {
    if (!data.q || data.q.trim() === "") {
      return [];
    }

    return await SearchService.hybridSearch(data.q, data.limit);
  });

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search: { q, limit } }) => ({ q, limit }),
  loader: ({ deps }) => {
    if (deps.q) {
      return searchRecipes({ data: deps });
    }
    return [];
  },
});

function SearchPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const results = Route.useLoaderData();
  const [query, setQuery] = useState(search.q || "");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      await navigate({
        to: "/search",
        search: { q: query.trim() },
      });
    } finally {
      setIsSearching(false);
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
        <form onSubmit={handleSearch} className="flex gap-2">
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
          <Button type="submit" disabled={isSearching || !query.trim()}>
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </form>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {search.q && (
          <div className="text-sm text-muted-foreground">
            {results.length > 0
              ? `Found ${results.length} result${results.length === 1 ? "" : "s"} for "${search.q}"`
              : `No results found for "${search.q}"`}
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
