import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/help")({
  component: Help,
});

function Help() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help</h1>
        <p className="text-muted-foreground">
          Get assistance and learn more features
        </p>
      </div>

      <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
        <p className="text-muted-foreground">
          Help documentation coming soon...
        </p>
      </div>
    </div>
  );
}
