import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { Check, ExternalLink, Loader2, Plus, Settings, Trash2 } from "lucide-react";
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
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { getUserDetails } from "~/lib/auth-server-user";
import { DataSourceProjects, DataSources } from "~/lib/data/dataSources";
import { type DataSourceConfig, type DataSourceProjectInput, dataSourceProjectInputSchema } from "~/lib/dataValidators";

const dataSourceIdSchema = z.object({
  id: z.string().min(1, "Data source ID is required"),
});

const getDataSourceProjects = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => dataSourceIdSchema.parse(data))
  .handler(async ({ data }) => {
    const dataSource = await DataSources.getById(data.id);
    if (!dataSource) {
      throw new Error("Data source not found");
    }

    const linkedProjects = await DataSourceProjects.getByDataSource(data.id);
    const availableProjects = await DataSourceProjects.getAvailableProjects(data.id);

    return {
      dataSource: {
        ...dataSource,
        config: dataSource.config as DataSourceConfig,
      },
      linkedProjects,
      availableProjects,
    };
  });

const createDataSourceProject = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => dataSourceProjectInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    try {
      const result = await DataSourceProjects.create(data, context.user.id);
      return {
        ...result,
        dataSource: result.dataSource
          ? {
              ...result.dataSource,
              config: result.dataSource.config as DataSourceConfig,
            }
          : null,
      };
    } catch (error) {
      console.error("DataSourceProject creation error:", error);
      throw error;
    }
  });

const updateDataSourceProject = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => {
    const updateSchema = dataSourceProjectInputSchema.extend({
      id: z.string(),
    });
    return updateSchema.parse(data);
  })
  .handler(async ({ data, context }) => {
    try {
      const { id, ...updateData } = data;
      const result = await DataSourceProjects.update(id, updateData, context.user.id);
      // Ensure we return a serializable result
      return {
        ...result,
        dataSource: result.dataSource
          ? {
              ...result.dataSource,
              config: result.dataSource.config as DataSourceConfig,
            }
          : null,
      };
    } catch (error) {
      console.error("DataSourceProject update error:", error);
      throw error;
    }
  });

const deleteDataSourceProject = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await DataSourceProjects.deleteRelationship(data.id);
    return { success: true };
  });

export const Route = createFileRoute("/data-sources/$id/projects")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  component: DataSourceProjectsPage,
  loader: async ({ context, params }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: `/data-sources/${params.id}/projects` },
      });
    }

    return getDataSourceProjects({ data: { id: params.id } });
  },
});

function DataSourceProjectsPage() {
  const router = useRouter();
  const { dataSource, linkedProjects, availableProjects } = Route.useLoaderData();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<(typeof linkedProjects)[0] | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<(typeof linkedProjects)[0] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form for linking new project
  const linkForm = useForm({
    defaultValues: {
      projectId: "",
      includeGlobs: "**/*",
      excludeGlobs: "",
      isActive: true,
    } as Omit<DataSourceProjectInput, "dataSourceId">,
    onSubmit: async ({ value }) => {
      try {
        await createDataSourceProject({
          data: {
            ...value,
            dataSourceId: dataSource.id,
          },
        });
        toast.success("Project linked successfully!");
        setShowLinkDialog(false);
        router.invalidate();
        linkForm.reset();
      } catch (error) {
        console.error("Failed to link project:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        toast.error(`Failed to link project: ${errorMessage}`);
      }
    },
  });

  // Form for editing project relationship
  const editForm = useForm({
    defaultValues: {
      includeGlobs: "",
      excludeGlobs: "",
      isActive: true,
    } as Partial<DataSourceProjectInput>,
    validators: {
      onChange: dataSourceProjectInputSchema.partial(),
    },
    onSubmit: async ({ value }) => {
      if (!editingProject) return;

      try {
        const updateData = {
          id: editingProject.id,
          dataSourceId: editingProject.dataSourceId,
          projectId: editingProject.projectId,
          includeGlobs: value.includeGlobs ?? editingProject.includeGlobs,
          excludeGlobs: value.excludeGlobs ?? editingProject.excludeGlobs ?? "",
          isActive: value.isActive ?? editingProject.isActive,
        };

        await updateDataSourceProject({
          data: updateData,
        });
        toast.success("Project configuration updated successfully!");
        setShowEditDialog(false);
        setEditingProject(null);
        router.invalidate();
      } catch (error) {
        console.error("Failed to update project configuration:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        toast.error(`Failed to update project configuration: ${errorMessage}`);
      }
    },
  });

  const handleEdit = (project: (typeof linkedProjects)[0]) => {
    setEditingProject(project);
    editForm.setFieldValue("includeGlobs", project.includeGlobs);
    editForm.setFieldValue("excludeGlobs", project.excludeGlobs);
    editForm.setFieldValue("isActive", project.isActive);
    setShowEditDialog(true);
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDataSourceProject({ data: { id: projectToDelete.id } });
      toast.success("Project unlinked successfully");
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      router.invalidate();
    } catch (error) {
      console.error("Failed to unlink project:", error);
      toast.error("Failed to unlink project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

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
            <Link
              to="/data-sources/$id"
              params={{ id: dataSource.id }}
              className="transition-colors hover:text-foreground">
              {dataSource.name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Projects</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Configuration</h1>
          <p className="text-muted-foreground mt-1">Configure which projects sync content from "{dataSource.name}"</p>
        </div>
        <Button
          onClick={() => setShowLinkDialog(true)}
          disabled={availableProjects.length === 0}
          className="min-w-[140px]">
          <Plus className="h-4 w-4 mr-2" />
          Link Project
        </Button>
      </div>

      {/* Linked Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Projects ({linkedProjects.length})</CardTitle>
          <CardDescription>Projects that will receive synced content from this data source</CardDescription>
        </CardHeader>
        <CardContent>
          {linkedProjects.length > 0 ? (
            <div className="space-y-4">
              {linkedProjects.map((dsProject) => (
                <div key={dsProject.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{dsProject.project.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {dsProject.project.shortId}
                      </Badge>
                      {!dsProject.isActive && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          INACTIVE
                        </Badge>
                      )}
                    </div>
                    {dsProject.project.description && (
                      <p className="text-sm text-muted-foreground mb-2">{dsProject.project.description}</p>
                    )}
                    <div className="space-y-1">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Include patterns:</span>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded ml-2">
                          {dsProject.includeGlobs || "None"}
                        </code>
                      </div>
                      {dsProject.excludeGlobs && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Exclude patterns:</span>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded ml-2">{dsProject.excludeGlobs}</code>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/projects/$projectId" params={{ projectId: dsProject.project.id }}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(dsProject)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setProjectToDelete(dsProject);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No projects linked yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Link projects to start syncing content from this data source automatically.
              </p>
              <Button
                onClick={() => setShowLinkDialog(true)}
                disabled={availableProjects.length === 0}
                variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Link Your First Project
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {availableProjects.length === 0 && linkedProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Projects Linked</CardTitle>
            <CardDescription>All available projects are already linked to this data source</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Link Project Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Link Project to Data Source</DialogTitle>
            <DialogDescription>
              Select a project and configure which files should be synced from "{dataSource.name}".
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              linkForm.handleSubmit();
            }}
            className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-select">Project</Label>
              <linkForm.Field
                name="projectId"
                validators={{
                  onChange: z.string().min(1, "Please select a project"),
                }}>
                {(field) => (
                  <div>
                    <Select value={field.state.value} onValueChange={field.handleChange} name={field.name}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-2">
                              <span>{project.title}</span>
                              <Badge variant="secondary" className="text-xs">
                                {project.shortId}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive mt-1">{String(field.state.meta.errors[0])}</p>
                    )}
                  </div>
                )}
              </linkForm.Field>
            </div>

            <div className="space-y-2">
              <Label htmlFor="include-globs">Include Patterns</Label>
              <linkForm.Field
                name="includeGlobs"
                validators={{
                  onChange: z.string().min(1, "Include patterns are required"),
                }}>
                {(field) => (
                  <div>
                    <Textarea
                      id="include-globs"
                      placeholder="**/* (include all files)&#10;**/*.md (only markdown files)&#10;src/**/*.ts (TypeScript files in src/)"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      rows={3}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive mt-1">{String(field.state.meta.errors[0])}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Glob patterns for files to include. One pattern per line.
                    </p>
                  </div>
                )}
              </linkForm.Field>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exclude-globs">Exclude Patterns (Optional)</Label>
              <linkForm.Field name="excludeGlobs">
                {(field) => (
                  <div>
                    <Textarea
                      id="exclude-globs"
                      placeholder="node_modules/**&#10;.git/**&#10;**/*.log"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      rows={3}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive mt-1">{String(field.state.meta.errors[0])}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Glob patterns for files to exclude. One pattern per line.
                    </p>
                  </div>
                )}
              </linkForm.Field>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLinkDialog(false)}>
                Cancel
              </Button>
              <linkForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Linking...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Link Project
                      </>
                    )}
                  </Button>
                )}
              </linkForm.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure Project Sync</DialogTitle>
            <DialogDescription>Update the sync configuration for "{editingProject?.project.title}".</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editForm.handleSubmit();
            }}
            className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-include-globs">Include Patterns</Label>
              <editForm.Field name="includeGlobs">
                {(field) => (
                  <div>
                    <Textarea
                      id="edit-include-globs"
                      placeholder="**/*"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      rows={3}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive mt-1">{String(field.state.meta.errors[0])}</p>
                    )}
                  </div>
                )}
              </editForm.Field>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-exclude-globs">Exclude Patterns</Label>
              <editForm.Field name="excludeGlobs">
                {(field) => (
                  <div>
                    <Textarea
                      id="edit-exclude-globs"
                      placeholder="node_modules/**"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      rows={3}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive mt-1">{String(field.state.meta.errors[0])}</p>
                    )}
                  </div>
                )}
              </editForm.Field>
            </div>

            <div className="space-y-2">
              <editForm.Field name="isActive">
                {(field) => (
                  <div className="flex items-center space-x-2">
                    <input
                      id="edit-is-active"
                      type="checkbox"
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="edit-is-active" className="text-sm font-normal">
                      Active (sync enabled for this project)
                    </Label>
                  </div>
                )}
              </editForm.Field>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingProject(null);
                }}>
                Cancel
              </Button>
              <editForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
              </editForm.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlink Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to unlink "{projectToDelete?.project.title}" from this data source? This will stop
              syncing content from this data source to the project.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setProjectToDelete(null);
              }}
              disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unlinking...
                </>
              ) : (
                "Unlink Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
