import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
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
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { getUserDetails } from "~/lib/auth-server-user";
import { Users } from "~/lib/data/users";
import { userIdSchema, userUpdateSchema } from "~/lib/dataValidators";

const getUser = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => userIdSchema.parse(data))
  .handler(async (ctx) => {
    if (ctx.context.user?.role !== "admin") {
      throw new Error("User not authorized to edit this user");
    }

    const user = await Users.read(ctx.data.userId);
    if (!user) {
      throw new Error("User not found or incorrect permissions");
    }
    return user;
  });

const updateUser = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => {
    const parsed = data as { userId: string; userData: unknown };
    return {
      userId: parsed.userId,
      userData: userUpdateSchema.parse(parsed.userData),
    };
  })
  .handler(async (ctx) => {
    if (ctx.context.user?.role !== "admin") {
      throw new Error("User not authorized to edit this user");
    }

    return Users.update(ctx.data.userId, ctx.data.userData);
  });

export const Route = createFileRoute("/users/$userId/edit")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  component: UserEdit,
  loader: async ({ context, params }) => {
    if (context?.user?.role !== "admin") {
      throw new Error("User not authorized to edit this user");
    }

    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: `/users/${params.userId}/edit` },
      });
    }

    return getUser({ data: { userId: params.userId } });
  },
});

function UserEdit() {
  const router = useRouter();
  const user = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      name: user.name || "",
      role: user.role || "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await updateUser({
          data: {
            userId: user.id,
            userData: {
              name: value.name,
              role: value.role || undefined,
            },
          },
        });
        toast.success("User updated successfully!");
        router.navigate({ to: "/users/$userId", params: { userId: user.id } });
      } catch (error) {
        console.error("Failed to update user:", error);
        toast.error("Failed to update user. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

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
            <BreadcrumbLink>
              <Link to="/users/$userId" params={{ userId: user.id }}>
                {user.name || user.email}
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
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
          <p className="text-muted-foreground">Update user information</p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Update the details for this user account</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-6">
            {/* Email Display (Read-only) */}
            <div className="space-y-2">
              <label htmlFor="email-display" className="text-sm font-medium text-muted-foreground">
                Email Address (cannot be changed)
              </label>
              <Input
                id="email-display"
                type="email"
                value={user.email}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <div className="text-xs text-muted-foreground">
                Email addresses cannot be modified for security reasons
              </div>
            </div>

            {/* Name Field */}
            <form.Field name="name">
              {(field) => {
                const charCount = field.state.value.length;
                const maxChars = 100;
                const isNearLimit = charCount > 80;
                const isAtLimit = charCount >= maxChars;

                return (
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Display Name *
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter display name..."
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isSubmitting}
                      className={field.state.meta.errors?.length ? "border-destructive" : ""}
                    />

                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        {field.state.meta.errors?.length ? (
                          <div className="text-sm text-destructive">{field.state.meta.errors.join(", ")}</div>
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

            {/* Role Field */}
            <form.Field name="role">
              {(field) => {
                return (
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">
                      Role
                    </label>
                    <select
                      id="role"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isSubmitting}
                      className={`flex h-9 w-full border border-input bg-white/40 px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${
                        field.state.meta.errors?.length ? "border-destructive" : ""
                      }`}>
                      <option value="">None</option>
                      <option value="admin">Admin</option>
                    </select>

                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        {field.state.meta.errors?.length ? (
                          <div className="text-sm text-destructive">{field.state.meta.errors.join(", ")}</div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Select a role for this user</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }}
            </form.Field>

            <div className="flex justify-end space-x-2">
              <Link to="/users/$userId" params={{ userId: user.id }}>
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
