import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Edit, Mail, User } from "lucide-react";
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
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { getUserDetails } from "~/lib/auth-server-user";
import { Users } from "~/lib/data/users";
import { userIdSchema } from "~/lib/dataValidators";
import { formatDateTime } from "~/lib/dateUtils";

const getUser = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => userIdSchema.parse(data))
  .handler(async (ctx) => {
    const user = await Users.read(ctx.data.userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  });

export const Route = createFileRoute("/users/$userId/")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  component: UserDetail,
  loader: async ({ context, params }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: `/users/${params.userId}` },
      });
    }

    return { user: await getUser({ data: { userId: params.userId } }), currentUserRole: context?.user?.role };
  },
});

function UserDetail() {
  const { user, currentUserRole } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink>
              <Link to="/users">Users</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{user.name || user.email}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user.name || user.email}</h1>
          <p className="text-muted-foreground">User Details</p>
        </div>

        <div className="flex items-center space-x-2">
          {currentUserRole === "admin" && (
            <Link to="/users/$userId/edit" params={{ userId: user.id }}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main User Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Basic details about this user account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Display Name
                  </div>
                  {user.name ? (
                    <p className="text-lg font-medium">{user.name}</p>
                  ) : (
                    <p className="text-lg italic text-muted-foreground">No name set</p>
                  )}
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </div>
                  <p className="text-lg font-mono">{user.email}</p>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Role</div>
                {user.role ? (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-700/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/30">
                    None
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Account timestamps and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Account Created</div>
                <p className="text-base">{formatDateTime(user.createdAt)}</p>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                <p className="text-base">{formatDateTime(user.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
