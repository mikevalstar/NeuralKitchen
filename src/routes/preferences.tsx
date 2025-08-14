import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, Key, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { changePassword } from "~/lib/auth-client";
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { getUserDetails } from "~/lib/auth-server-user";
import { Users } from "~/lib/data/users";
import { passwordChangeSchema, userNameUpdateSchema } from "~/lib/dataValidators";

const updateUserName = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => userNameUpdateSchema.parse(data))
  .handler(async ({ data, context }) => {
    try {
      const updatedUser = await Users.updateName(context.user.id, data);
      return { success: true, user: updatedUser };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update name");
    }
  });

export const Route = createFileRoute("/preferences")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  component: PreferencesPage,
  loader: async ({ context }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: "/preferences" },
      });
    }
    return { user: context.user };
  },
});

function PreferencesPage() {
  const { user } = Route.useLoaderData();
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const nameForm = useForm({
    defaultValues: {
      name: user.name || "",
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await updateUserName({ data: value });
        if (result.success) {
          toast.success("Name updated successfully");
          router.invalidate();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update name");
      }
    },
    validators: {
      onChange: userNameUpdateSchema,
    },
  });

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        });

        if (result.error) {
          toast.error(result.error.message || "Failed to change password");
        } else {
          toast.success("Password changed successfully");
          passwordForm.reset();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to change password");
      }
    },
    validators: {
      onChange: passwordChangeSchema,
    },
  });

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground text-lg">Manage your account settings and preferences</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nameForm.handleSubmit();
              }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <nameForm.Field name="name">
                    {(field) => (
                      <>
                        <Input
                          id="name"
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter your display name"
                        />
                        {field.state.meta.errors && (
                          <p className="text-sm text-red-600">{field.state.meta.errors.join(", ")}</p>
                        )}
                      </>
                    )}
                  </nameForm.Field>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={user.email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
                </div>

                <nameForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <Button type="submit" disabled={!canSubmit || isSubmitting}>
                      {isSubmitting ? "Updating..." : "Update Name"}
                    </Button>
                  )}
                </nameForm.Subscribe>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Change Password</span>
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                passwordForm.handleSubmit();
              }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <passwordForm.Field name="currentPassword">
                    {(field) => (
                      <>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            name={field.name}
                            type={showCurrentPassword ? "text" : "password"}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Enter your current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {field.state.meta.errors && (
                          <p className="text-sm text-red-600">
                            {field.state.meta.errors.map((error) => error?.message).join(", ")}
                          </p>
                        )}
                      </>
                    )}
                  </passwordForm.Field>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <passwordForm.Field name="newPassword">
                    {(field) => (
                      <>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            name={field.name}
                            type={showNewPassword ? "text" : "password"}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Enter your new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}>
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {field.state.meta.errors && (
                          <p className="text-sm text-red-600">
                            {field.state.meta.errors.map((error) => error?.message).join(", ")}
                          </p>
                        )}
                      </>
                    )}
                  </passwordForm.Field>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <passwordForm.Field name="confirmPassword">
                    {(field) => (
                      <>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            name={field.name}
                            type={showConfirmPassword ? "text" : "password"}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Confirm your new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {field.state.meta.errors && (
                          <p className="text-sm text-red-600">
                            {field.state.meta.errors.map((error) => error?.message).join(", ")}
                          </p>
                        )}
                      </>
                    )}
                  </passwordForm.Field>
                </div>

                <passwordForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <Button type="submit" disabled={!canSubmit || isSubmitting}>
                      {isSubmitting ? "Changing Password..." : "Change Password"}
                    </Button>
                  )}
                </passwordForm.Subscribe>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
