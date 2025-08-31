import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AlertCircle, CheckCircle2, Clock, Database, GitBranch, Loader2, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { getUserDetails } from "~/lib/auth-server-user";
import { DataSources } from "~/lib/data/dataSources";
import type { DataSourceConfig } from "~/lib/dataValidators";
import { formatDateTime } from "~/lib/dateUtils";

const getDataSources = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .handler(async () => {
    const dataSources = await DataSources.list();
    // Ensure config is properly typed for serialization
    return dataSources.map((ds) => ({
      ...ds,
      config: ds.config as DataSourceConfig,
    }));
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDataSources = useMemo(() => {
    if (!searchQuery.trim()) return dataSources;
    return dataSources.filter(
      (ds) =>
        ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ds.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ds.config as DataSourceConfig)?.repositoryUrl?.toLowerCase().includes(searchQuery.toLowerCase()),
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
        <Button onClick={() => router.navigate({ to: "/data-sources/new" })} className="min-w-[180px]">
          <Plus className="h-4 w-4 mr-2" />
          Create Data Source
        </Button>
      </div>

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
      {filteredDataSources.length === 0 ? (
        <div className="text-center py-12">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No data sources yet</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "No data sources match your search."
              : "Create your first data source to start syncing content automatically."}
          </p>
          {!searchQuery && (
            <Button onClick={() => router.navigate({ to: "/data-sources/new" })}>
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
                    {dataSource.type === "git" &&
                      (dataSource.config as { [x: string]: {}; repositoryUrl?: string; branch?: string })
                        ?.repositoryUrl && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Repository</p>
                          <p className="text-xs text-muted-foreground font-mono break-all">
                            {
                              (dataSource.config as { [x: string]: {}; repositoryUrl?: string; branch?: string })
                                .repositoryUrl
                            }
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
                        <Link to="/data-sources/$id" params={{ id: dataSource.id }}>
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Link to="/data-sources/$id/edit" params={{ id: dataSource.id }}>
                          Edit
                        </Link>
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
