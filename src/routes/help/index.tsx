import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/help/")({
  beforeLoad: () => {
    throw redirect({
      to: "/help/$helpFile",
      params: { helpFile: "home" },
    });
  },
});
