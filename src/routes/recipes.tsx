import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/recipes")({
  component: Recipes,
});

function Recipes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
        <p className="text-muted-foreground">Manage and organize your favorite recipes</p>
      </div>

      <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
        <p className="text-muted-foreground">Recipe management coming soon...</p>
      </div>
    </div>
  );
}
