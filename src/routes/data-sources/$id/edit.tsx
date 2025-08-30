import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { GitBranch, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
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
import { DataSources } from "~/lib/data/dataSources";
import { dataSourceInputSchema } from "~/lib/dataValidators";

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
      config: dataSource.config as any,
    };
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
      config: result.config as any,
    };
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

    return getDataSource({ data: { id: params.id } });
  },
});

function EditDataSourcePage() {
  const router = useRouter();
  const dataSource = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = dataSource.config as Record<string, any>;

  const form = useForm({
    defaultValues: {
      name: dataSource.name,
      type: dataSource.type as "git" | "confluence",
      syncIntervalMinutes: dataSource.syncIntervalMinutes,
      config: {
        repositoryUrl: config?.repositoryUrl || "",
        branch: config?.branch || "main",
      },
      sshPrivateKey: dataSource.sshPrivateKey || "",
      sshPublicKey: dataSource.sshPublicKey || "",
      isActive: dataSource.isActive,
    },
    validators: {
      onChange: ({ value }) => {
        const result = dataSourceInputSchema.partial().safeParse(value);
        if (!result.success) {
          return result.error.formErrors.fieldErrors;
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await updateDataSource({
          data: {
            id: dataSource.id,
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

        toast.success("Data source updated successfully!");
        router.navigate({ to: `/data-sources/${dataSource.id}` });
      } catch (error) {
        console.error("Failed to update data source:", error);
        toast.error("Failed to update data source. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/data-sources">Data Sources</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/data-sources/${dataSource.id}` as any}>{dataSource.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Data Source</h1>
        <p className="text-muted-foreground">Update the configuration for "{dataSource.name}"</p>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Data Source Configuration</CardTitle>
            <CardDescription>Modify the settings for this data source</CardDescription>
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
                      <Select value={field.state.value} onValueChange={field.handleChange}>
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
                    <Checkbox id="isActive" checked={field.state.value} onCheckedChange={field.handleChange} />
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
                        {dataSource.sshPrivateKey
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
                  onClick={() => router.navigate({ to: `/data-sources/${dataSource.id}` })}
                  disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
