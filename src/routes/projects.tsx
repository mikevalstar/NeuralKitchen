import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { FolderOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Projects } from "~/lib/data/projects";
import { projectSchema } from "~/lib/dataValidators";

const getProjects = createServerFn({ method: "GET" }).handler(async () => {
  return Projects.list();
});

const createProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => projectSchema.parse(data))
  .handler(async (ctx) => {
    return Projects.create(ctx.data);
  });

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
  loader: () => {
    return getProjects();
  },
});

function ProjectsPage() {
  const router = useRouter();
  const projects = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      title: "",
      shortId: "",
      description: "",
    },
    validators: {
      onChange: projectSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await createProject({
          data: {
            title: value.title,
            shortId: value.shortId,
            description: value.description || undefined,
          },
        });
        // Clear the form
        form.reset();
        // Refresh the data to show the new project
        router.invalidate();
        toast.success("Project created successfully!");
      } catch (error) {
        console.error("Failed to create project:", error);
        toast.error("Failed to create project. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground text-lg">Organize your recipes into collections</p>
      </div>

      {/* Add Project Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Project</CardTitle>
          <CardDescription>Create a new project to organize your recipes</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4">
            {/* Title Field */}
            <form.Field name="title">
              {(field) => {
                const charCount = field.state.value.length;
                const maxChars = 100;
                const isNearLimit = charCount > 80;
                const isAtLimit = charCount >= maxChars;

                return (
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                      Project Title *
                    </label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Enter project title..."
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isSubmitting}
                      className={field.state.meta.errors?.length ? "border-destructive" : ""}
                    />

                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        {field.state.meta.errors?.length ? (
                          <div className="text-sm text-destructive">
                            {field.state.meta.errors.map((error) => error?.message).join(", ")}
                          </div>
                        ) : null}
                      </div>
                      <div
                        className={`text-xs ${
                          isAtLimit
                            ? "text-destructive font-medium"
                            : isNearLimit
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                        }`}>
                        {charCount}/{maxChars}
                      </div>
                    </div>
                  </div>
                );
              }}
            </form.Field>

            {/* ShortId Field */}
            <form.Field name="shortId">
              {(field) => {
                const charCount = field.state.value.length;
                const maxChars = 50;
                const isNearLimit = charCount > 40;
                const isAtLimit = charCount >= maxChars;

                return (
                  <div className="space-y-2">
                    <label htmlFor="shortId" className="text-sm font-medium">
                      Project ID *
                    </label>
                    <Input
                      id="shortId"
                      type="text"
                      placeholder="e.g., my-awesome-project"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isSubmitting}
                      className={field.state.meta.errors?.length ? "border-destructive" : ""}
                    />

                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        {field.state.meta.errors?.length ? (
                          <div className="text-sm text-destructive">
                            {field.state.meta.errors.map((error) => error?.message).join(", ")}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Letters, numbers, hyphens, and underscores only. No spaces.
                          </div>
                        )}
                      </div>
                      <div
                        className={`text-xs ${
                          isAtLimit
                            ? "text-destructive font-medium"
                            : isNearLimit
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                        }`}>
                        {charCount}/{maxChars}
                      </div>
                    </div>
                  </div>
                );
              }}
            </form.Field>

            {/* Description Field */}
            <form.Field name="description">
              {(field) => {
                const charCount = field.state.value.length;
                const maxChars = 300;
                const isNearLimit = charCount > 250;
                const isAtLimit = charCount >= maxChars;

                return (
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description (optional)
                    </label>
                    <Textarea
                      id="description"
                      placeholder="Enter project description..."
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isSubmitting}
                      className={`min-h-[80px] ${field.state.meta.errors?.length ? "border-destructive" : ""}`}
                    />

                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        {field.state.meta.errors?.length ? (
                          <div className="text-sm text-destructive">
                            {field.state.meta.errors.map((error) => error?.message).join(", ")}
                          </div>
                        ) : null}
                      </div>
                      <div
                        className={`text-xs ${
                          isAtLimit
                            ? "text-destructive font-medium"
                            : isNearLimit
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                        }`}>
                        {charCount}/{maxChars}
                      </div>
                    </div>
                  </div>
                );
              }}
            </form.Field>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !form.state.canSubmit} className="min-w-[120px]">
                {isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects ({projects.length})</CardTitle>
          <CardDescription>Manage and view all your projects</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Title</th>
                    <th className="text-left p-4 font-medium">Project ID</th>
                    <th className="text-left p-4 font-medium">Description</th>
                    <th className="text-left p-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project, index) => (
                    <tr
                      key={project.id}
                      className={`border-b last:border-b-0 ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                      <td className="p-4 font-medium">{project.title}</td>
                      <td className="p-4 font-mono text-sm text-muted-foreground">{project.shortId}</td>
                      <td className="p-4 text-muted-foreground">
                        {project.description ? (
                          <span className="line-clamp-2">{project.description}</span>
                        ) : (
                          <span className="italic">No description</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <FolderOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No projects yet</h3>
              <p className="text-muted-foreground">Create your first project to get started organizing your recipes.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
