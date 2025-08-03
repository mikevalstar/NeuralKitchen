import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Projects } from "~/lib/data/projects";
import { projectIdSchema, projectSchema } from "~/lib/dataValidators";

const getProject = createServerFn({ method: "GET" })
  .validator((data: unknown) => projectIdSchema.parse(data))
  .handler(async (ctx) => {
    const project = await Projects.read(ctx.data.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    return project;
  });

const updateProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const parsed = data as { projectId: string; projectData: unknown };
    return {
      projectId: parsed.projectId,
      projectData: projectSchema.parse(parsed.projectData),
    };
  })
  .handler(async (ctx) => {
    return Projects.update(ctx.data.projectId, ctx.data.projectData);
  });

export const Route = createFileRoute("/projects/$projectId/edit")({
  component: ProjectEdit,
  loader: ({ params }) => {
    return getProject({ data: { projectId: params.projectId } });
  },
});

function ProjectEdit() {
  const router = useRouter();
  const project = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      title: project.title,
      shortId: project.shortId,
      description: project.description || "",
    },
    validators: {
      onChange: projectSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await updateProject({
          data: {
            projectId: project.id,
            projectData: {
              title: value.title,
              shortId: value.shortId,
              description: value.description || undefined,
            },
          },
        });
        toast.success("Project updated successfully!");
        router.navigate({ to: "/projects/$projectId", params: { projectId: project.id } });
      } catch (error) {
        console.error("Failed to update project:", error);
        toast.error("Failed to update project. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink>
              <Link to="/projects">Projects</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>
              <Link to="/projects/$projectId" params={{ projectId: project.id }}>
                {project.title}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
          <p className="text-muted-foreground">Update project information</p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>Update the details for this project</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-6">
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

            <div className="flex justify-end space-x-2">
              <Link to="/projects/$projectId" params={{ projectId: project.id }}>
                <Button variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || !form.state.canSubmit} className="min-w-[120px]">
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
