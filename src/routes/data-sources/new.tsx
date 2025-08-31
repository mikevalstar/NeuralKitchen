import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/data-sources/new")({
  beforeLoad: () => {
    // Redirect to the unified form with 'new' as the ID
    throw redirect({
      to: "/data-sources/$id/edit",
      params: { id: "new" },
    });
  },
});
