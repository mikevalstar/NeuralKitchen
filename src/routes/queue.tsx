import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AlertCircle, CheckCircle, Clock, RefreshCw, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { getUserDetails } from "~/lib/auth-server-user";
import { Queue } from "~/lib/data/queue";
import { formatDateTime } from "~/lib/dateUtils";

// Server functions
const getQueueItems = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .handler(async () => {
    const [errors, pending, completed] = await Promise.all([
      Queue.getRecentErrors(10),
      Queue.getPending(20),
      Queue.getRecentCompleted(10),
    ]);
    return { errors, pending, completed };
  });

const retryQueueItem = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => {
    const parsed = data as { id: string };
    return { id: parsed.id };
  })
  .handler(async ({ data }) => {
    return Queue.retry(data.id);
  });

const retryAllErrors = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .handler(async () => {
    return Queue.retryAllErrors();
  });

export const Route = createFileRoute("/queue")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  component: QueuePage,
  loader: async ({ context }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: "/queue" },
      });
    }

    return getQueueItems();
  },
});

function QueuePage() {
  const { errors, pending, completed } = Route.useLoaderData();
  const [isRetrying, setIsRetrying] = useState<string | null>(null);
  const [isRetryingAll, setIsRetryingAll] = useState(false);

  const handleRetry = async (id: string) => {
    setIsRetrying(id);
    try {
      await retryQueueItem({ data: { id } });
      toast.success("Queue item retried successfully");
      // Refresh the page data
      window.location.reload();
    } catch (error) {
      console.error("Failed to retry queue item:", error);
      toast.error("Failed to retry queue item");
    } finally {
      setIsRetrying(null);
    }
  };

  const handleRetryAll = async () => {
    setIsRetryingAll(true);
    try {
      const result = await retryAllErrors();
      toast.success(`Retried ${result.count} queue items`);
      // Refresh the page data
      window.location.reload();
    } catch (error) {
      console.error("Failed to retry all errors:", error);
      toast.error("Failed to retry all errors");
    } finally {
      setIsRetryingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queue Management</h1>
          <p className="text-muted-foreground">Monitor and manage background processing queue</p>
        </div>
        {errors.length > 0 && (
          <Button
            onClick={handleRetryAll}
            disabled={isRetryingAll}
            variant="outline"
            className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950">
            <RotateCcw className="h-4 w-4 mr-2" />
            {isRetryingAll ? "Retrying All..." : `Retry All Errors (${errors.length})`}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{errors.length}</div>
            <p className="text-xs text-muted-foreground">Recent failed items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pending.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completed.length}</div>
            <p className="text-xs text-muted-foreground">Recently completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Items */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              Recent Errors
            </CardTitle>
            <CardDescription>Items that failed processing and can be retried</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errors.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Link
                        to="/recipes/$recipeId"
                        params={{ recipeId: item.recipeVersion.recipe.id }}
                        className="font-medium text-primary hover:underline">
                        {item.recipeVersion.title}
                      </Link>
                      <span className="text-sm text-muted-foreground">(v{item.recipeVersion.versionNumber})</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Failed: {formatDateTime(item.updatedAt)}</div>
                    {item.error && (
                      <div className="text-xs text-destructive mt-1 font-mono bg-destructive/10 p-2 rounded">
                        {item.error}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetry(item.id)}
                    disabled={isRetrying === item.id}
                    className="ml-4">
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying === item.id ? "animate-spin" : ""}`} />
                    {isRetrying === item.id ? "Retrying..." : "Retry"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Items */}
      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <Clock className="h-5 w-5 mr-2" />
              Pending Items
            </CardTitle>
            <CardDescription>Items waiting to be processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pending.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Link
                        to="/recipes/$recipeId"
                        params={{ recipeId: item.recipeVersion.recipe.id }}
                        className="font-medium text-primary hover:underline">
                        {item.recipeVersion.title}
                      </Link>
                      <span className="text-sm text-muted-foreground">(v{item.recipeVersion.versionNumber})</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Queued: {formatDateTime(item.createdAt)}</div>
                  </div>
                  <div className="flex items-center space-x-2 text-orange-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Pending</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Items */}
      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              Recently Completed
            </CardTitle>
            <CardDescription>Items that were successfully processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completed.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Link
                        to="/recipes/$recipeId"
                        params={{ recipeId: item.recipeVersion.recipe.id }}
                        className="font-medium text-primary hover:underline">
                        {item.recipeVersion.title}
                      </Link>
                      <span className="text-sm text-muted-foreground">(v{item.recipeVersion.versionNumber})</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Completed: {formatDateTime(item.updatedAt)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {errors.length === 0 && pending.length === 0 && completed.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Queue is Empty</h3>
            <p className="text-muted-foreground mb-4">No items currently in the processing queue.</p>
            <Link to="/recipes">
              <Button variant="outline">View Recipes</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
