import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import prisma from "../lib/prisma";

const getTags = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.tag.findMany({});
});

export const Route = createFileRoute("/")({
  component: Home,
  loader: () => {
    return getTags();
  },
});

function Home() {
  const tags = Route.useLoaderData();

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

      {tags.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Recent Tags</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag.id} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
