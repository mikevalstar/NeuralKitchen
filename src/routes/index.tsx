import prisma from "../lib/prisma";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

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
    <div>
      <h1 className="text-2xl font-bold underline">Tags</h1>
      <ul>
        {tags.map((tag) => (
          <li key={tag.id}>{tag.name}</li>
        ))}
      </ul>
      <Button>Click me</Button>
    </div>
  );
}
