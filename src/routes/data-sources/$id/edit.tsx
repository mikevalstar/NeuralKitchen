import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { GitBranch, Loader2, Plus, Save } from "lucide-react";
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
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { getUserDetails } from "~/lib/auth-server-user";
import { DataSourceProjects, DataSources } from "~/lib/data/dataSources";
import { Projects } from "~/lib/data/projects";
import { dataSourceInputSchema, dataSourceProjectInputSchema } from "~/lib/dataValidators";

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
      config: dataSource.config as Record<string, unknown>,
    };
  });

const getProjects = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .handler(async () => {
    return Projects.list();
  });

const getAvailableProjects = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => dataSourceIdSchema.parse(data))
  .handler(async (ctx) => {
    return DataSourceProjects.getAvailableProjects(ctx.data.id);
  });

const updateDataSource = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => {
    const parsed = data as { id: string; dataSourceData: unknown };
    return {
      id: parsed.id,
      dataSourceData: dataSourceInputSchema.partial().parse(parsed.dataSourceData),
    };
  })
  .handler(async (ctx) => {
    const result = await DataSources.update(ctx.data.id, ctx.data.dataSourceData, ctx.context.user?.id);
    return {
      ...result,
      config: result.config as Record<string, unknown>,
    };
  });

const createDataSource = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => dataSourceInputSchema.parse(data))
  .handler(async (ctx) => {
    const result = await DataSources.create(ctx.data, ctx.context.user?.id);
    return {
      ...result,
      config: result.config as Record<string, unknown>,
    };
  });

const createDataSourceProject = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => dataSourceProjectInputSchema.parse(data))
  .handler(async (ctx) => {
    const result = await DataSourceProjects.create(ctx.data, ctx.context.user?.id);
    return {
      ...result,
      dataSource: {
        ...result.dataSource,
        config: result.dataSource.config as Record<string, unknown>,
      },
    };
  });

const updateDataSourceProject = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => {
    const parsed = data as { id: string; projectData: unknown };
    return {
      id: parsed.id,
      projectData: dataSourceProjectInputSchema.partial().parse(parsed.projectData),
    };
  })
  .handler(async (ctx) => {
    const result = await DataSourceProjects.update(ctx.data.id, ctx.data.projectData, ctx.context.user?.id);
    return {
      ...result,
      dataSource: {
        ...result.dataSource,
        config: result.dataSource.config as Record<string, unknown>,
      },
    };
  });

const deleteDataSourceProject = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async (ctx) => {
    return DataSourceProjects.deleteRelationship(ctx.data.id);
  });

export const Route = createFileRoute("/data-sources/$id/edit")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  component: EditDataSourcePage,
  loader: async ({ context, params }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: `/data-sources/${params.id}/edit` },
      });
    }

    // If ID is 'new', we're creating a new data source
    if (params.id === "new") {
      const projects = await getProjects();
      return {
        dataSource: null,
        projects,
        availableProjects: projects,
        isNew: true,
      };
    }

    // Otherwise, we're editing an existing one
    const dataSource = await getDataSource({ data: { id: params.id } });
    const projects = await getProjects();
    const availableProjects = await getAvailableProjects({ data: { id: params.id } });

    return {
      dataSource,
      projects,
      availableProjects,
      isNew: false,
    };
  },
});

function EditDataSourcePage() {
  const router = useRouter();
  const { dataSource, availableProjects, isNew } = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedProjects, setLinkedProjects] = useState(dataSource?.projects || []);
  const [newProjectForm, setNewProjectForm] = useState<{
    projectId: string;
    includeGlobs: string;
    excludeGlobs: string;
  } | null>(null);

  const config = dataSource?.config as Record<string, unknown> | undefined;

  const form = useForm({
    defaultValues: {
      name: dataSource?.name || "",
      type: (dataSource?.type as "git" | "confluence") || "git",
      syncIntervalMinutes: dataSource?.syncIntervalMinutes || 60,
      config: {
        repositoryUrl: config?.repositoryUrl || "",
        branch: config?.branch || "main",
      },
      sshPrivateKey: dataSource?.sshPrivateKey || "",
      sshPublicKey: dataSource?.sshPublicKey || "",
      isActive: dataSource?.isActive ?? true,
    },
    validators: {
      onChange: ({ value }) => {
        const result = isNew
          ? dataSourceInputSchema.safeParse(value)
          : dataSourceInputSchema.partial().safeParse(value);
        if (!result.success) {
          return result.error.formErrors.fieldErrors;
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        let result: { id: string };
        if (isNew) {
          result = await createDataSource({
            data: {
              name: value.name,
              type: value.type,
              syncIntervalMinutes: value.syncIntervalMinutes,
              config: value.config,
              sshPrivateKey: value.sshPrivateKey || undefined,
              sshPublicKey: value.sshPublicKey || undefined,
              isActive: value.isActive,
            },
          });
          toast.success("Data source created successfully!");
          router.navigate({ to: `/data-sources/${result.id}` });
        } else {
          const updateResult = await updateDataSource({
            data: {
              id: dataSource!.id,
              dataSourceData: {
                name: value.name,
                type: value.type,
                syncIntervalMinutes: value.syncIntervalMinutes,
                config: value.config,
                sshPrivateKey: value.sshPrivateKey || undefined,
                sshPublicKey: value.sshPublicKey || undefined,
                isActive: value.isActive,
              },
            },
          });
          result = { id: dataSource!.id };
          toast.success("Data source updated successfully!");
          router.navigate({ to: `/data-sources/${dataSource!.id}` });
        }
      } catch (error) {
        console.error(`Failed to ${isNew ? "create" : "update"} data source:`, error);
        toast.error(`Failed to ${isNew ? "create" : "update"} data source. Please try again.`);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleAddProject = async () => {
    if (!newProjectForm || !dataSource) return;

    try {
      const result = await createDataSourceProject({
        data: {
          dataSourceId: dataSource.id,
          projectId: newProjectForm.projectId,
          includeGlobs: newProjectForm.includeGlobs,
          excludeGlobs: newProjectForm.excludeGlobs,
          isActive: true,
        },
      });

      setLinkedProjects((prev) => [...prev, result]);
      setNewProjectForm(null);
      toast.success("Project linked successfully!");
    } catch (error) {
      console.error("Failed to link project:", error);
      toast.error("Failed to link project. Please try again.");
    }
  };

  const handleUpdateProject = async (
    projectLinkId: string,
    updates: Partial<{
      includeGlobs: string;
      excludeGlobs: string;
      isActive: boolean;
    }>,
  ) => {
    try {
      const result = await updateDataSourceProject({
        data: {
          id: projectLinkId,
          projectData: updates,
        },
      });

      setLinkedProjects((prev) => prev.map((p) => (p.id === projectLinkId ? result : p)));
      toast.success("Project settings updated!");
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error("Failed to update project settings.");
    }
  };

  const handleRemoveProject = async (projectLinkId: string) => {
    try {
      await deleteDataSourceProject({ data: { id: projectLinkId } });
      setLinkedProjects((prev) => prev.filter((p) => p.id !== projectLinkId));
      toast.success("Project unlinked successfully!");
    } catch (error) {
      console.error("Failed to unlink project:", error);
      toast.error("Failed to unlink project.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink>
              <Link to="/data-sources">Data Sources</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {!isNew && dataSource && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink>
                  <Link to={`/data-sources/${dataSource.id}`}>{dataSource.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>{isNew ? "New Data Source" : "Edit"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{isNew ? "Create Data Source" : "Edit Data Source"}</h1>
        <p className="text-muted-foreground">
          {isNew
            ? "Configure a new data source to sync content from external repositories"
            : `Update the configuration for "${dataSource?.name}"`}
        </p>
      </div>

      {/* Form */}
      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Source Configuration</CardTitle>
            <CardDescription>
              {isNew ? "Set up your new data source" : "Modify the settings for this data source"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-6">
              {/* Basic Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Field */}
                <form.Field name="name">
                  {(field) => (
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Data Source Name *
                      </label>
                      <Input
                        id="name"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="My Git Repository"
                        maxLength={100}
                      />
                      {field.state.meta.errors ? (
                        <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                      ) : null}
                    </div>
                  )}
                </form.Field>

                {/* Type Field */}
                <form.Field name="type">
                  {(field) => (
                    <div className="space-y-2">
                      <label htmlFor="type" className="text-sm font-medium">
                        Source Type *
                      </label>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value as "git" | "confluence")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="git">Git Repository</SelectItem>
                          <SelectItem value="confluence" disabled>
                            Confluence (Coming Soon)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {field.state.meta.errors ? (
                        <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                      ) : null}
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Active Toggle */}
              <form.Field name="isActive">
                {(field) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
                    />
                    <Label htmlFor="isActive" className="text-sm font-medium">
                      Active
                    </Label>
                    <p className="text-xs text-muted-foreground ml-2">When disabled, sync operations will be paused</p>
                  </div>
                )}
              </form.Field>

              {/* Git Configuration */}
              <form.Field name="type">
                {(field) =>
                  field.state.value === "git" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Git Configuration
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Repository URL */}
                        <form.Field name="config.repositoryUrl">
                          {(repoField) => (
                            <div className="space-y-2 md:col-span-2">
                              <label htmlFor="repositoryUrl" className="text-sm font-medium">
                                Repository URL *
                              </label>
                              <Input
                                id="repositoryUrl"
                                value={repoField.state.value || ""}
                                onChange={(e) => repoField.handleChange(e.target.value)}
                                placeholder="https://github.com/user/repo.git or git@github.com:user/repo.git"
                              />
                              {repoField.state.meta.errors ? (
                                <p className="text-sm text-destructive">{repoField.state.meta.errors[0]}</p>
                              ) : null}
                            </div>
                          )}
                        </form.Field>

                        {/* Branch */}
                        <form.Field name="config.branch">
                          {(branchField) => (
                            <div className="space-y-2">
                              <label htmlFor="branch" className="text-sm font-medium">
                                Branch
                              </label>
                              <Input
                                id="branch"
                                value={branchField.state.value || "main"}
                                onChange={(e) => branchField.handleChange(e.target.value)}
                                placeholder="main"
                              />
                            </div>
                          )}
                        </form.Field>
                      </div>
                    </div>
                  )
                }
              </form.Field>

              {/* Sync Interval */}
              <form.Field name="syncIntervalMinutes">
                {(field) => (
                  <div className="space-y-2">
                    <label htmlFor="syncInterval" className="text-sm font-medium">
                      Sync Interval
                    </label>
                    <Select
                      value={field.state.value.toString()}
                      onValueChange={(value) => field.handleChange(parseInt(value))}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Every 5 minutes</SelectItem>
                        <SelectItem value="15">Every 15 minutes</SelectItem>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Every hour</SelectItem>
                        <SelectItem value="180">Every 3 hours</SelectItem>
                        <SelectItem value="360">Every 6 hours</SelectItem>
                        <SelectItem value="720">Every 12 hours</SelectItem>
                        <SelectItem value="1440">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">How often to check for updates and sync new content</p>
                  </div>
                )}
              </form.Field>

              {/* SSH Keys Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">SSH Authentication (Optional)</h4>
                <p className="text-sm text-muted-foreground">
                  For private repositories, provide SSH keys. Leave blank for public repositories.
                </p>

                {/* SSH Private Key */}
                <form.Field name="sshPrivateKey">
                  {(field) => (
                    <div className="space-y-2">
                      <label htmlFor="sshPrivateKey" className="text-sm font-medium">
                        SSH Private Key
                      </label>
                      <Textarea
                        id="sshPrivateKey"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                        rows={4}
                        className="font-mono text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        {!isNew && dataSource?.sshPrivateKey
                          ? "Leave blank to keep existing key, or paste new key to replace"
                          : "Paste your SSH private key here. It will be stored securely."}
                      </p>
                    </div>
                  )}
                </form.Field>

                {/* SSH Public Key */}
                <form.Field name="sshPublicKey">
                  {(field) => (
                    <div className="space-y-2">
                      <label htmlFor="sshPublicKey" className="text-sm font-medium">
                        SSH Public Key
                      </label>
                      <Input
                        id="sshPublicKey"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGg..."
                        className="font-mono text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        Add this public key to your repository's deploy keys
                      </p>
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (isNew) {
                      router.navigate({ to: "/data-sources" });
                    } else {
                      router.navigate({ to: `/data-sources/${dataSource?.id}` });
                    }
                  }}
                  disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isNew ? "Creating..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isNew ? "Create Data Source" : "Save Changes"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Project Linking Section - Only show for existing data sources */}
        {!isNew && dataSource && (
          <Card>
            <CardHeader>
              <CardTitle>Project Integration</CardTitle>
              <CardDescription>Configure which projects should sync content from this data source</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing linked projects */}
              {linkedProjects.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Linked Projects</h4>
                  {linkedProjects.map((projectLink) => (
                    <div key={projectLink.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{projectLink.project.title}</span>
                          <Badge variant={projectLink.isActive ? "default" : "secondary"}>
                            {projectLink.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleRemoveProject(projectLink.id)}>
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium">Include Patterns</Label>
                          <Input
                            value={projectLink.includeGlobs}
                            onChange={(e) =>
                              handleUpdateProject(projectLink.id, {
                                includeGlobs: e.target.value,
                              })
                            }
                            placeholder="**/*.md, **/*.ts"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Exclude Patterns</Label>
                          <Input
                            value={projectLink.excludeGlobs}
                            onChange={(e) =>
                              handleUpdateProject(projectLink.id, {
                                excludeGlobs: e.target.value,
                              })
                            }
                            placeholder="**/node_modules/**, **/.git/**"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`active-${projectLink.id}`}
                          checked={projectLink.isActive}
                          onCheckedChange={(checked) =>
                            handleUpdateProject(projectLink.id, {
                              isActive: Boolean(checked),
                            })
                          }
                        />
                        <Label htmlFor={`active-${projectLink.id}`} className="text-xs">
                          Enable sync for this project
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new project form */}
              {newProjectForm ? (
                <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
                  <h4 className="font-medium">Link New Project</h4>

                  <div>
                    <Label className="text-sm font-medium">Project</Label>
                    <Select
                      value={newProjectForm.projectId}
                      onValueChange={(value) => setNewProjectForm({ ...newProjectForm, projectId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Include Patterns *</Label>
                      <Input
                        value={newProjectForm.includeGlobs}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, includeGlobs: e.target.value })}
                        placeholder="**/*.md, **/*.ts"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Glob patterns for files to include (comma or newline separated)
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Exclude Patterns</Label>
                      <Input
                        value={newProjectForm.excludeGlobs}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, excludeGlobs: e.target.value })}
                        placeholder="**/node_modules/**, **/.git/**"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Glob patterns for files to exclude (optional)
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setNewProjectForm(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddProject}
                      disabled={!newProjectForm.projectId || !newProjectForm.includeGlobs}>
                      Link Project
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setNewProjectForm({
                      projectId: "",
                      includeGlobs: "",
                      excludeGlobs: "",
                    })
                  }
                  disabled={availableProjects.length === 0}
                  className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {availableProjects.length === 0 ? "All projects are already linked" : "Link Project to Data Source"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
