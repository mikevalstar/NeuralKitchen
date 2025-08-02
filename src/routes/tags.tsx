import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import prisma from "../lib/prisma";

const getTags = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.tag.findMany({});
});

export const Route = createFileRoute("/tags")({
  component: Tags,
  loader: () => {
    return getTags();
  },
});

function Tags() {
  const tags = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
        <p className="text-muted-foreground">
          Organize content with custom tags
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Tags</h2>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
            <p className="text-muted-foreground">No tags found</p>
          </div>
        )}
      </div>
    </div>
  );
}
