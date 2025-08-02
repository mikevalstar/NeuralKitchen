import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects")({
  component: Projects,
});

function Projects() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Track your culinary projects and experiments</p>
      </div>

      <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
        <p className="text-muted-foreground">Project management coming soon...</p>
      </div>
    </div>
  );
}
