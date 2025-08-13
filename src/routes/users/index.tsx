import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Edit, Eye, EyeOff, Plus, Search, Users as UsersIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { getUserDetails } from "~/lib/auth-server-user";
import { Users } from "~/lib/data/users";
import { userCreateSchema } from "~/lib/dataValidators";
import { formatDateOnly } from "~/lib/dateUtils";

const getUsers = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .handler(async () => {
    return Users.list();
  });

const createUser = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => userCreateSchema.parse(data))
  .handler(async (ctx) => {
    return Users.create(ctx.data);
  });

export const Route = createFileRoute("/users/")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  component: UsersPage,
  loader: async ({ context }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: "/users" },
      });
    }

    return getUsers();
  },
});

function UsersPage() {
  const router = useRouter();
  const users = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "" as string | undefined,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await createUser({
          data: {
            email: value.email,
            password: value.password,
            name: value.name || undefined,
          },
        });
        // Clear the form
        form.reset();
        // Hide the create form
        setShowCreateForm(false);
        // Refresh the data to show the new user
        router.invalidate();
        toast.success("User created successfully!");
      } catch (error) {
        console.error("Failed to create user:", error);
        toast.error("Failed to create user. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [users, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-lg">Manage user accounts and permissions</p>
      </div>

      {/* Create User Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? "outline" : "default"}
          className="min-w-[160px]">
          <Plus className="h-4 w-4 mr-2" />
          {showCreateForm ? "Cancel" : "Create User"}
        </Button>
      </div>

      {/* Add User Form - Collapsible */}
      {showCreateForm && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <CardDescription>Add a new user account to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="space-y-4">
                {/* Email Field */}
                <form.Field name="email">
                  {(field) => {
                    const charCount = field.state.value.length;
                    const maxChars = 255;
                    const isNearLimit = charCount > 200;
                    const isAtLimit = charCount >= maxChars;

                    return (
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          Email Address *
                        </label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter email address..."
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          disabled={isSubmitting}
                          className={field.state.meta.errors?.length ? "border-destructive" : ""}
                        />
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex-1">
                            {field.state.meta.errors?.length ? (
                              <span className="text-destructive">{field.state.meta.errors.join(", ")}</span>
                            ) : null}
                          </div>
                          <span
                            className={
                              isAtLimit
                                ? "text-destructive font-medium"
                                : isNearLimit
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                            }>
                            {charCount}/{maxChars}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                </form.Field>

                {/* Password Field */}
                <form.Field name="password">
                  {(field) => {
                    const charCount = field.state.value.length;
                    const maxChars = 255;
                    const isNearLimit = charCount > 200;
                    const isAtLimit = charCount >= maxChars;

                    return (
                      <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">
                          Password *
                        </label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password..."
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            disabled={isSubmitting}
                            className={field.state.meta.errors?.length ? "border-destructive" : ""}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex-1">
                            {field.state.meta.errors?.length ? (
                              <span className="text-destructive">{field.state.meta.errors.join(", ")}</span>
                            ) : (
                              <span className="text-muted-foreground">Minimum 8 characters required</span>
                            )}
                          </div>
                          <span
                            className={
                              isAtLimit
                                ? "text-destructive font-medium"
                                : isNearLimit
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                            }>
                            {charCount}/{maxChars}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                </form.Field>

                {/* Name Field */}
                <form.Field name="name">
                  {(field) => {
                    const charCount = field.state.value?.length || 0;
                    const maxChars = 100;
                    const isNearLimit = charCount > 80;
                    const isAtLimit = charCount >= maxChars;

                    return (
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                          Display Name (optional)
                        </label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter display name..."
                          value={field.state.value || ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value || undefined)}
                          disabled={isSubmitting}
                          className={field.state.meta.errors?.length ? "border-destructive" : ""}
                        />
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex-1">
                            {field.state.meta.errors?.length ? (
                              <span className="text-destructive">{field.state.meta.errors.join(", ")}</span>
                            ) : (
                              <span className="text-muted-foreground">If not provided, email prefix will be used</span>
                            )}
                          </div>
                          <span
                            className={
                              isAtLimit
                                ? "text-destructive font-medium"
                                : isNearLimit
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground"
                            }>
                            {charCount}/{maxChars}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                </form.Field>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !form.state.canSubmit} className="min-w-[120px]">
                    {isSubmitting ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users List with Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users ({users.length})</CardTitle>
              <CardDescription>Manage and view all user accounts</CardDescription>
            </div>
            <div className="w-72">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <UsersIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No users yet</h3>
              <p className="text-muted-foreground">Create your first user to get started.</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No users found</h3>
              <p className="text-muted-foreground">No users match "{searchQuery}". Try a different search term.</p>
            </div>
          ) : (
            <div>
              {searchQuery && (
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
              )}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Email</th>
                      <th className="text-left p-4 font-medium">Role</th>
                      <th className="text-left p-4 font-medium">Created</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className={`border-b last:border-b-0 ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                        <td className="p-4 font-medium">
                          <Link
                            to="/users/$userId"
                            params={{ userId: user.id }}
                            className="hover:text-blue-600 transition-colors">
                            {user.name || user.email}
                          </Link>
                          {!user.name && (
                            <div className="text-xs italic text-muted-foreground mt-1">No display name</div>
                          )}
                        </td>
                        <td className="p-4 font-mono text-sm text-muted-foreground">{user.email}</td>
                        <td className="p-4 text-sm">
                          {user.role ? (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30">
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-700/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/30">
                              None
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{formatDateOnly(user.createdAt)}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Link to="/users/$userId/edit" params={{ userId: user.id }}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
