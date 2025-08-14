import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { signIn, useSession } from "~/lib/auth-client";
import { type LoginInput, loginSchema } from "~/lib/dataValidators";

const loginSearchSchema = z.object({
  redirect: z.string().optional().default("/"),
});

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: zodValidator(loginSearchSchema),
});

function LoginPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as LoginInput,
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      setLoginError(null);
      try {
        const result = await signIn.email({
          email: value.email,
          password: value.password,
        });

        if (result.error) {
          setLoginError("Invalid email or password. Please try again.");
        } else {
          // Navigate to the redirect URL or home page
          router.navigate({ to: redirect });
        }
      } catch (error) {
        console.error("Login error:", error);
        setLoginError("An error occurred during login. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Redirect if already authenticated
  if (session) {
    router.navigate({ to: redirect });
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your Neural Kitchen account</CardDescription>
        </CardHeader>
        <CardContent>
          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4">
            {/* Email Field */}
            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={isSubmitting}
                    className={field.state.meta.errors?.length ? "border-destructive" : ""}
                    autoComplete="email"
                    autoFocus
                  />
                  {field.state.meta.errors?.length ? (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors.map((error) => error?.message).join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>

            {/* Password Field */}
            <form.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isSubmitting}
                      className={`pr-10 ${field.state.meta.errors?.length ? "border-destructive" : ""}`}
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}>
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                  {field.state.meta.errors?.length ? (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors.map((error) => error?.message).join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting || !form.state.canSubmit} size="lg">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
