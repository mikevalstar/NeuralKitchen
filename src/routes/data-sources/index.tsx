import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AlertCircle, CheckCircle2, Clock, Database, GitBranch, Loader2, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { getUserDetails } from "~/lib/auth-server-user";
import { DataSources } from "~/lib/data/dataSources";
import { dataSourceInputSchema } from "~/lib/dataValidators";
import { formatDateTime } from "~/lib/dateUtils";

const getDataSources = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .handler(async () => {
    const dataSources = await DataSources.list();
    // Cast config to any to avoid JSON serialization issues in TanStack
    return dataSources.map((ds) => ({
      ...ds,
      config: ds.config as any,
    }));
  });

const createDataSource = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => dataSourceInputSchema.parse(data))
  .handler(async (ctx) => {
    const result = await DataSources.create(ctx.data, ctx.context.user.id);
    return {
      ...result,
      config: result.config as any,
    };
  });

export const Route = createFileRoute("/data-sources/")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  component: DataSourcesPage,
  loader: async ({ context }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: "/data-sources" },
      });
    }

    return getDataSources();
  },
});

function DataSourcesPage() {
  const router = useRouter();
  const dataSources = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      type: "git" as "git" | "confluence",
      syncIntervalMinutes: 60,
      config: {
        repositoryUrl: "",
        branch: "main",
      },
      sshPrivateKey: "",
      sshPublicKey: "",
      isActive: true,
    },
    validators: {
      onChange: ({ value }) => {
        const result = dataSourceInputSchema.safeParse(value);
        if (!result.success) {
          return result.error.formErrors.fieldErrors;
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await createDataSource({
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

        form.reset();
        setShowCreateForm(false);
        router.invalidate();
        toast.success("Data source created successfully!");
      } catch (error) {
        console.error("Failed to create data source:", error);
        toast.error("Failed to create data source. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const filteredDataSources = useMemo(() => {
    if (!searchQuery.trim()) return dataSources;
    return dataSources.filter(
      (ds) =>
        ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ds.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ds.config as Record<string, any>)?.repositoryUrl?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [dataSources, searchQuery]);

  const getSyncStatus = (dataSource: (typeof dataSources)[0]) => {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Data Sources</h1>
        <p className="text-muted-foreground text-lg">Automatically sync code and documents into recipes</p>
      </div>

      {/* Create Data Source Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? "outline" : "default"}
          className="min-w-[180px]">
          <Plus className="h-4 w-4 mr-2" />
          {showCreateForm ? "Cancel" : "Create Data Source"}
        </Button>
      </div>

      {/* Add Data Source Form - Collapsible */}
      {showCreateForm && (
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create New Data Source</CardTitle>
              <CardDescription>
                Connect external repositories or document sources to automatically import content as recipes
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
                                  value={repoField.state.value}
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
                                  value={branchField.state.value}
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
                        Sync Interval (minutes)
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
                      <p className="text-xs text-muted-foreground">
                        How often to check for updates and sync new content
                      </p>
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
                          Paste your SSH private key here. It will be stored securely.
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

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Data Source
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      {dataSources.length > 0 && (
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search data sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Data Sources Grid */}
      {filteredDataSources.length === 0 && !showCreateForm ? (
        <div className="text-center py-12">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No data sources yet</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "No data sources match your search."
              : "Create your first data source to start syncing content automatically."}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Data Source
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDataSources.map((dataSource) => {
            const syncStatus = getSyncStatus(dataSource);
            const StatusIcon = syncStatus.icon;

            return (
              <Card key={dataSource.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {dataSource.type === "git" ? (
                          <GitBranch className="h-5 w-5 text-primary" />
                        ) : (
                          <Database className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{dataSource.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {dataSource.type.toUpperCase()}
                          </Badge>
                          {!dataSource.isActive && (
                            <Badge variant="destructive" className="text-xs">
                              INACTIVE
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Repository Info */}
                    {dataSource.type === "git" && (dataSource.config as Record<string, any>)?.repositoryUrl && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Repository</p>
                        <p className="text-xs text-muted-foreground font-mono break-all">
                          {(dataSource.config as Record<string, any>).repositoryUrl}
                        </p>
                      </div>
                    )}

                    {/* Project Count */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Projects</p>
                      <p className="text-sm text-muted-foreground">
                        {dataSource.projects?.length || 0} projects linked
                      </p>
                    </div>

                    {/* Sync Status */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Sync Status</p>
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
                      {dataSource.lastSyncAt && (
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(new Date(dataSource.lastSyncAt))}
                        </p>
                      )}
                    </div>

                    {/* Sync Interval */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Sync Frequency</p>
                      <p className="text-sm text-muted-foreground">
                        Every{" "}
                        {dataSource.syncIntervalMinutes >= 60
                          ? `${Math.floor(dataSource.syncIntervalMinutes / 60)} hour${Math.floor(dataSource.syncIntervalMinutes / 60) !== 1 ? "s" : ""}`
                          : `${dataSource.syncIntervalMinutes} minutes`}
                      </p>
                    </div>

                    {/* Error Message */}
                    {dataSource.lastError && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-destructive">Last Error</p>
                        <p className="text-xs text-muted-foreground break-all">{dataSource.lastError}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Link to={`/data-sources/${dataSource.id}` as any}>View Details</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Link to={`/data-sources/${dataSource.id}/edit` as any}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
