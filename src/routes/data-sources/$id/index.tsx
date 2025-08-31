import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Edit,
  ExternalLink,
  GitBranch,
  Loader2,
  Play,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "~/components/ui/badge";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import type { DataSourceProject, DataSourceSyncJob, Project } from "~/generated/prisma/client";
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { getUserDetails } from "~/lib/auth-server-user";
import { DataSourceSyncJobs, DataSources } from "~/lib/data/dataSources";
import type { DataSourceConfig } from "~/lib/dataValidators";
import { formatDateTime } from "~/lib/dateUtils";

const dataSourceIdSchema = z.object({
  id: z.string().min(1, "Data source ID is required"),
});

const getDataSource = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => dataSourceIdSchema.parse(data))
  .handler(async (ctx) => {
    const dataSource = await DataSources.getById(ctx.data.id);
    if (!dataSource) {
      throw new Error("Data source not found");
    }
    return {
      ...dataSource,
      config: dataSource.config as DataSourceConfig,
    };
  });

const deleteDataSource = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => dataSourceIdSchema.parse(data))
  .handler(async (ctx) => {
    const _result = await DataSources.deleteDataSource(ctx.data.id);
    return { success: true };
  });

const triggerSync = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => dataSourceIdSchema.parse(data))
  .handler(async (ctx) => {
    // Create a new sync job - the actual sync logic will be implemented in Phase 4
    const result = await DataSourceSyncJobs.create(ctx.data.id, ctx.context.user.id);
    return {
      ...result,
      dataSource: {
        ...result.dataSource,
        config: result.dataSource.config as DataSourceConfig,
      },
    };
  });

export const Route = createFileRoute("/data-sources/$id/")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  component: DataSourceDetailPage,
  loader: async ({ context, params }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: `/data-sources/${params.id}` },
      });
    }

    return getDataSource({ data: { id: params.id } });
  },
});

function DataSourceDetailPage() {
  const router = useRouter();
  const dataSource = Route.useLoaderData();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDataSource({ data: { id: dataSource.id } });
      toast.success("Data source deleted successfully");
      router.navigate({ to: "/data-sources" });
    } catch (error) {
      console.error("Failed to delete data source:", error);
      toast.error("Failed to delete data source. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleTriggerSync = async () => {
    setIsTriggering(true);
    try {
      await triggerSync({ data: { id: dataSource.id } });
      toast.success("Sync triggered successfully");
      router.invalidate();
    } catch (error) {
      console.error("Failed to trigger sync:", error);
      toast.error("Failed to trigger sync. Please try again.");
    } finally {
      setIsTriggering(false);
    }
  };

  const getSyncStatus = () => {
    const latestJob = dataSource.syncJobs[0];

    if (!latestJob) {
      return { status: "never", color: "gray", icon: Clock, text: "Never synced" };
    }

    switch (latestJob.status) {
      case "running":
        return { status: "running", color: "blue", icon: Loader2, text: "Syncing..." };
      case "completed":
        return { status: "success", color: "green", icon: CheckCircle2, text: "Last sync successful" };
      case "failed":
        return { status: "error", color: "red", icon: AlertCircle, text: "Last sync failed" };
      default:
        return { status: "pending", color: "yellow", icon: Clock, text: "Sync pending" };
    }
  };

  const syncStatus = getSyncStatus();
  const StatusIcon = syncStatus.icon;
  const config = dataSource.config as DataSourceConfig;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link to="/data-sources" className="transition-colors hover:text-foreground">
              Data Sources
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{dataSource.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            {dataSource.type === "git" ? (
              <GitBranch className="h-8 w-8 text-primary" />
            ) : (
              <Database className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{dataSource.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{dataSource.type.toUpperCase()}</Badge>
              {!dataSource.isActive && <Badge variant="destructive">INACTIVE</Badge>}
              <div className="flex items-center gap-2">
                <StatusIcon
                  className={`h-4 w-4 ${syncStatus.status === "running" ? "animate-spin" : ""} ${
                    syncStatus.color === "green"
                      ? "text-green-500"
                      : syncStatus.color === "red"
                        ? "text-red-500"
                        : syncStatus.color === "blue"
                          ? "text-blue-500"
                          : syncStatus.color === "yellow"
                            ? "text-yellow-500"
                            : "text-gray-500"
                  }`}
                />
                <span className="text-sm text-muted-foreground">{syncStatus.text}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleTriggerSync}
            disabled={isTriggering || syncStatus.status === "running"}
            variant="outline">
            {isTriggering ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Triggering...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Trigger Sync
              </>
            )}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/data-sources/$id/edit" params={{ id: dataSource.id }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataSource.type === "git" && (
              <>
                <div>
                  <p className="text-sm font-medium mb-1">Repository URL</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground font-mono break-all flex-1">
                      {config?.repositoryUrl || "Not configured"}
                    </p>
                    {config?.repositoryUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={config.repositoryUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Branch</p>
                  <p className="text-sm text-muted-foreground">{config?.branch || "main"}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-sm font-medium mb-1">Sync Interval</p>
              <p className="text-sm text-muted-foreground">
                Every{" "}
                {dataSource.syncIntervalMinutes >= 60
                  ? `${Math.floor(dataSource.syncIntervalMinutes / 60)} hour${Math.floor(dataSource.syncIntervalMinutes / 60) !== 1 ? "s" : ""}`
                  : `${dataSource.syncIntervalMinutes} minutes`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">SSH Authentication</p>
              <p className="text-sm text-muted-foreground">
                {dataSource.sshPrivateKey ? "Configured" : "Not configured"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Created</p>
              <p className="text-sm text-muted-foreground">{formatDateTime(new Date(dataSource.createdAt))}</p>
            </div>
            {dataSource.lastSyncAt && (
              <div>
                <p className="text-sm font-medium mb-1">Last Sync</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(new Date(dataSource.lastSyncAt))}</p>
              </div>
            )}
            {dataSource.lastError && (
              <div>
                <p className="text-sm font-medium mb-1 text-destructive">Last Error</p>
                <p className="text-sm text-muted-foreground break-all">{dataSource.lastError}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Linked Projects</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/data-sources/$id/projects" params={{ id: dataSource.id }}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Link>
              </Button>
            </div>
            <CardDescription>Projects that sync content from this data source</CardDescription>
          </CardHeader>
          <CardContent>
            {dataSource.projects && dataSource.projects.length > 0 ? (
              <div className="space-y-3">
                {dataSource.projects.map((dsProject: DataSourceProject & { project: Project }) => (
                  <div key={dsProject.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{dsProject.project.title}</p>
                      <p className="text-sm text-muted-foreground">ID: {dsProject.project.shortId}</p>
                      {dsProject.includeGlobs && (
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          Include: {dsProject.includeGlobs}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!dsProject.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          INACTIVE
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/projects/$projectId" params={{ projectId: dsProject.project.id }}>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No projects linked yet</p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/data-sources/$id/projects" params={{ id: dataSource.id }}>
                    Link Projects
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>Recent synchronization jobs and their results</CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled>
              View All History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dataSource.syncJobs && dataSource.syncJobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Files Found</TableHead>
                  <TableHead>Files Imported</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataSource.syncJobs.map((job: DataSourceSyncJob) => {
                  const duration = job.completedAt
                    ? Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)
                    : null;

                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {job.status === "running" ? (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          ) : job.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : job.status === "failed" ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          <Badge
                            variant={
                              job.status === "completed"
                                ? "default"
                                : job.status === "failed"
                                  ? "destructive"
                                  : job.status === "running"
                                    ? "secondary"
                                    : "outline"
                            }
                            className="text-xs">
                            {job.status.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(new Date(job.startedAt))}</TableCell>
                      <TableCell className="text-sm">
                        {duration !== null ? `${duration}s` : job.status === "running" ? "Running..." : "-"}
                      </TableCell>
                      <TableCell className="text-sm">{job.filesFound ?? "-"}</TableCell>
                      <TableCell className="text-sm">{job.filesImported ?? "-"}</TableCell>
                      <TableCell className="text-sm text-destructive">
                        {job.error ? (
                          <span className="break-all" title={job.error}>
                            {job.error.substring(0, 50)}
                            {job.error.length > 50 ? "..." : ""}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No sync history yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Data Source</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{dataSource.name}"? This action cannot be undone. All sync history and
              project links will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Data Source"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
