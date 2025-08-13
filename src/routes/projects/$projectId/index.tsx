import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Edit, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { getUserDetails } from "~/lib/auth-server-user";
import { Projects } from "~/lib/data/projects";
import { projectIdSchema } from "~/lib/dataValidators";
import { formatDateTime } from "~/lib/dateUtils";

const getProject = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => projectIdSchema.parse(data))
  .handler(async (ctx) => {
    const project = await Projects.read(ctx.data.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    return project;
  });

const deleteProject = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => projectIdSchema.parse(data))
  .handler(async (ctx) => {
    return Projects.deleteProject(ctx.data.projectId);
  });

export const Route = createFileRoute("/projects/$projectId/")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  component: ProjectDetail,
  loader: async ({ context, params }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: `/projects/${params.projectId}` },
      });
    }

    return getProject({ data: { projectId: params.projectId } });
  },
});

function ProjectDetail() {
  const router = useRouter();
  const project = Route.useLoaderData();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const mcpEndpoint =
    typeof window !== "undefined" ? `${window.location.origin}/mcp?projects=${project.shortId}` : undefined;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProject({ data: { projectId: project.id } });
      toast.success("Project deleted successfully!");
      router.navigate({ to: "/projects" });
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
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
            <BreadcrumbPage>{project.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          <p className="text-muted-foreground">Project Details</p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/projects/$projectId/edit" params={{ projectId: project.id }}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Project Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Basic details about this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Project Title</div>
                  <p className="text-lg font-medium">{project.title}</p>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">Project ID</div>
                  <p className="text-lg font-mono text-muted-foreground">{project.shortId}</p>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Description</div>
                {project.description ? (
                  <p className="text-base mt-1">{project.description}</p>
                ) : (
                  <p className="text-base mt-1 italic text-muted-foreground">No description provided</p>
                )}
              </div>

              {mcpEndpoint && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">MCP Endpoint</div>
                  <a href={mcpEndpoint} className="text-base mt-1 font-mono break-all text-blue-600 underline">
                    {mcpEndpoint}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {mcpEndpoint && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>MCP Integration</CardTitle>
                <CardDescription>Configure this endpoint in Cursor or Claude</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Cursor</div>
                  <p className="text-sm text-muted-foreground">
                    Settings → Features → MCP Servers → Add. Use the following configuration:
                  </p>
                  <pre className="bg-muted rounded p-3 overflow-auto text-sm">
                    <code>{`{
  "mcpServers": {
    "Neural Kitchen": {
      "type": "http",
      "url": "${mcpEndpoint}"
    }
  }
}`}</code>
                  </pre>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Claude.ai / Claude Desktop</div>
                  <p className="text-sm text-muted-foreground">Add a custom connector and set the server URL to:</p>
                  <div className="text-sm font-mono break-all">{mcpEndpoint}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Metadata Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Project timestamps and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Created</div>
                <p className="text-base">{formatDateTime(project.createdAt)}</p>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                <p className="text-base">{formatDateTime(project.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
