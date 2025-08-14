import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { authMiddlewareEnsure } from "../lib/auth-middleware";
import { getUserDetails } from "../lib/auth-server-user";
import { Recipes } from "../lib/data/recipes";
import { formatDateTime } from "../lib/dateUtils";
import prisma from "../lib/prisma";

const getTags = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .handler(async () => {
    return prisma.tag.findMany({});
  });

const getRecentRecipes = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .handler(async () => {
    return Recipes.getRecentlyUpdated(20);
  });

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  loader: async ({ context }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: "/" },
      });
    }

    const [tags, recentRecipes] = await Promise.all([getTags(), getRecentRecipes()]);
    return { tags, recentRecipes };
  },
  component: Home,
});

function Home() {
  const { tags, recentRecipes } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Neural Kitchen</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your AI-powered recipe management and culinary project workspace
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
        <Link to="/recipes" className="group h-full">
          <div className="p-6 border rounded-lg bg-card transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">Recipes</h3>
            <p className="text-muted-foreground flex-1">Manage and organize your favorite recipes</p>
          </div>
        </Link>
        <Link to="/projects" className="group h-full">
          <div className="p-6 border rounded-lg bg-card transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">Projects</h3>
            <p className="text-muted-foreground flex-1">Track your culinary projects and experiments</p>
          </div>
        </Link>
        <Link to="/tags" className="group h-full">
          <div className="p-6 border rounded-lg bg-card transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">Tags</h3>
            <p className="text-muted-foreground flex-1">Organize content with custom tags</p>
          </div>
        </Link>
        <Link to="/help" className="group h-full">
          <div className="p-6 border rounded-lg bg-card transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">Help</h3>
            <p className="text-muted-foreground flex-1">Get assistance and learn more features</p>
          </div>
        </Link>
      </div>

      {(recentRecipes.length > 0 || tags.length > 0) && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Recent Changes</h2>
          <div className="flex gap-6">
            {/* Recent Changes - 70% width */}
            <div className="w-[70%]">
              {recentRecipes.length > 0 ? (
                <div className="space-y-3">
                  {recentRecipes.map((recipe) => (
                    <div key={recipe.id} className="p-4 border rounded-lg bg-card hover:bg-accent transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link
                            to="/recipes/$recipeId"
                            params={{ recipeId: recipe.shortId }}
                            className="hover:underline">
                            <h3 className="font-medium text-foreground">{recipe.title}</h3>
                          </Link>
                          {recipe.currentVersion?.projects && recipe.currentVersion.projects.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {recipe.currentVersion.projects.slice(0, 3).map((project) => (
                                <span key={project.id} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                                  {project.title}
                                </span>
                              ))}
                              {recipe.currentVersion.projects.length > 3 && (
                                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                                  +{recipe.currentVersion.projects.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground italic mt-1 block">No projects</span>
                          )}
                          {recipe.currentVersion?.tags && recipe.currentVersion.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {recipe.currentVersion.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground ml-4 text-right">
                          <div>{formatDateTime(recipe.updatedAt)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent changes yet.</p>
              )}
            </div>

            {/* Tags - 30% width */}
            <div className="w-[30%]">
              <h3 className="text-lg font-medium mb-3">Recent Tags</h3>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No tags yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
