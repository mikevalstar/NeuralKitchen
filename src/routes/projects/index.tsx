import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { FolderOpen, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Projects } from "~/lib/data/projects";
import { projectSchema } from "~/lib/dataValidators";
import { formatDateOnly } from "~/lib/dateUtils";

const getProjects = createServerFn({ method: "GET" }).handler(async () => {
  return Projects.list();
});

const createProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => projectSchema.parse(data))
  .handler(async (ctx) => {
    return Projects.create(ctx.data);
  });

export const Route = createFileRoute("/projects/")({
  component: ProjectsPage,
  loader: () => {
    return getProjects();
  },
});

function ProjectsPage() {
  const router = useRouter();
  const projects = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const form = useForm({
    defaultValues: {
      title: "",
      shortId: "",
      description: undefined as string | undefined,
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
        // Hide the create form
        setShowCreateForm(false);
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

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    return projects.filter(
      (project) =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.shortId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [projects, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground text-lg">Organize your recipes into collections</p>
      </div>

      {/* Create Project Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? "outline" : "default"}
          className="min-w-[160px]">
          <Plus className="h-4 w-4 mr-2" />
          {showCreateForm ? "Cancel" : "Create Project"}
        </Button>
      </div>

      {/* Add Project Form - Collapsible */}
      {showCreateForm && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>Projects help organize your recipes into collections</CardDescription>
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
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex-1">
                            {field.state.meta.errors?.length ? (
                              <span className="text-destructive">
                                {field.state.meta.errors.map((error) => error?.message).join(", ")}
                              </span>
                            ) : null}
                          </div>
                          <span
                            className={
                              isAtLimit
                                ? "text-destructive font-medium"
                                : isNearLimit
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                            }>
                            {charCount}/{maxChars}
                          </span>
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
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex-1">
                            {field.state.meta.errors?.length ? (
                              <span className="text-destructive">
                                {field.state.meta.errors.map((error) => error?.message).join(", ")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Letters, numbers, hyphens, and underscores only. No spaces.
                              </span>
                            )}
                          </div>
                          <span
                            className={
                              isAtLimit
                                ? "text-destructive font-medium"
                                : isNearLimit
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                            }>
                            {charCount}/{maxChars}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                </form.Field>

                {/* Description Field */}
                <form.Field name="description">
                  {(field) => {
                    const charCount = field.state.value?.length || 0;
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
                          value={field.state.value || ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value || undefined)}
                          disabled={isSubmitting}
                          className={`min-h-[80px] ${field.state.meta.errors?.length ? "border-destructive" : ""}`}
                        />
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex-1">
                            {field.state.meta.errors?.length ? (
                              <span className="text-destructive">
                                {field.state.meta.errors.map((error) => error?.message).join(", ")}
                              </span>
                            ) : null}
                          </div>
                          <span
                            className={
                              isAtLimit
                                ? "text-destructive font-medium"
                                : isNearLimit
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                            }>
                            {charCount}/{maxChars}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                </form.Field>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !form.state.canSubmit} className="min-w-[120px]">
                    {isSubmitting ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Projects List with Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Projects ({projects.length})</CardTitle>
              <CardDescription>Manage and view all your projects</CardDescription>
            </div>
            <div className="w-72">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <FolderOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No projects yet</h3>
              <p className="text-muted-foreground">Create your first project to get started organizing your recipes.</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No projects found</h3>
              <p className="text-muted-foreground">No projects match "{searchQuery}". Try a different search term.</p>
            </div>
          ) : (
            <div>
              {searchQuery && (
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {filteredProjects.length} of {projects.length} projects
                </div>
              )}
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
                    {filteredProjects.map((project, index) => (
                      <tr
                        key={project.id}
                        className={`border-b last:border-b-0 ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                        <td className="p-4 font-medium">
                          <Link
                            to="/projects/$projectId"
                            params={{ projectId: project.id }}
                            className="text-foreground hover:text-primary transition-colors hover:underline">
                            {project.title}
                          </Link>
                        </td>
                        <td className="p-4 font-mono text-sm text-muted-foreground">{project.shortId}</td>
                        <td className="p-4 text-muted-foreground">
                          {project.description ? (
                            <span className="line-clamp-2">{project.description}</span>
                          ) : (
                            <span className="italic">No description</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{formatDateOnly(project.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
