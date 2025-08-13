import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowLeft, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { getUserDetails } from "~/lib/auth-server-user";
import { Prompts } from "~/lib/data/prompts";
import { DEFAULT_PROMPTS, PROMPT_METADATA, type PromptKey } from "~/lib/prompts";

interface PromptEditData {
  key: PromptKey;
  title: string;
  description: string;
  defaultContent: string;
  currentContent: string;
  hasCustomValue: boolean;
  isUsingDefault: boolean;
}

const promptEditSchema = z.object({
  content: z.string().min(1, "Content is required"),
});

const getPromptData = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => z.object({ promptKey: z.string() }).parse(data))
  .handler(async (ctx): Promise<PromptEditData> => {
    const key = ctx.data.promptKey as PromptKey;

    // Check if the key exists in the constants (not the database)
    if (!(key in DEFAULT_PROMPTS)) {
      throw new Error(`Invalid prompt key: ${ctx.data.promptKey}`);
    }

    const record = await Prompts.getRecordByKey(key);
    const metadata = PROMPT_METADATA[key];
    const defaultContent = DEFAULT_PROMPTS[key];
    const currentContent = record?.content || defaultContent;

    return {
      key,
      title: metadata.title,
      description: metadata.description,
      defaultContent,
      currentContent,
      hasCustomValue: !!record,
      isUsingDefault: !record || !record.content.trim(),
    };
  });

const savePrompt = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => {
    const parsed = data as { promptKey: string; data: unknown };
    return {
      promptKey: parsed.promptKey,
      data: promptEditSchema.parse(parsed.data),
    };
  })
  .handler(async (ctx) => {
    const key = ctx.data.promptKey as PromptKey;

    // Check if the key exists in the constants (not the database)
    if (!(key in DEFAULT_PROMPTS)) {
      throw new Error(`Invalid prompt key: ${ctx.data.promptKey}`);
    }

    const metadata = PROMPT_METADATA[key];
    await Prompts.upsert(key, {
      name: metadata.title,
      description: metadata.description,
      content: ctx.data.data.content,
    });

    return { success: true };
  });

const resetPrompt = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator((data: unknown) => z.object({ promptKey: z.string() }).parse(data))
  .handler(async (ctx) => {
    const key = ctx.data.promptKey as PromptKey;

    // Check if the key exists in the constants (not the database)
    if (!(key in DEFAULT_PROMPTS)) {
      throw new Error(`Invalid prompt key: ${ctx.data.promptKey}`);
    }

    const record = await Prompts.getRecordByKey(key);
    if (record) {
      await Prompts.deletePrompt(record.id);
    }

    return { success: true };
  });

export const Route = createFileRoute("/settings/prompts/$promptKey")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  component: PromptEditPage,
  loader: async ({ context, params }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: `/settings/prompts/${params.promptKey}` },
      });
    }

    console.log("Route params:", params); // Debug log
    if (!params.promptKey) {
      throw new Error("Prompt key parameter is missing");
    }
    return getPromptData({ data: { promptKey: params.promptKey } });
  },
});

function PromptEditPage() {
  const navigate = useNavigate();
  const promptData = Route.useLoaderData();
  const params = Route.useParams();

  const form = useForm({
    defaultValues: {
      content: promptData.currentContent,
    },
    validators: {
      onChange: promptEditSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await savePrompt({ data: { promptKey: params.promptKey, data: value } });
        navigate({ to: "/settings" });
      } catch (error) {
        console.error("Error saving prompt:", error);
        toast.error(`Error saving prompt: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    },
  });

  const handleReset = async () => {
    try {
      await resetPrompt({ data: { promptKey: params.promptKey } });
      navigate({ to: "/settings" });
    } catch (error) {
      console.error("Error resetting prompt:", error);
      toast.error(`Error resetting prompt: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const isUsingDefaultAfterChange = form.state.values.content === promptData.defaultContent;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/settings/" })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Prompt</h1>
          <p className="text-muted-foreground">{promptData.title}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Warning */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning: Critical System Component</AlertTitle>
          <AlertDescription>
            This prompt is used by AI features throughout the application. Modifying it may break functionality if not
            done carefully. Test your changes thoroughly and consider the impact on:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Recipe summarization accuracy</li>
              <li>AI agent behavior and responses</li>
              <li>Template variable replacement</li>
              <li>Integration with external AI services</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Status Info */}
        <Alert>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Current Status:</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  promptData.isUsingDefault ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-600"
                }`}>
                {promptData.isUsingDefault ? "Using Default" : "Custom"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Key: <code className="bg-muted px-1 py-0.5 rounded text-xs">{promptData.key}</code>
            </p>
          </div>
        </Alert>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Prompt Content</CardTitle>
            <CardDescription>Customize the prompt content. Leave blank or reset to use the default.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-6">
              {/* Display Name (Read-only) */}
              <div className="space-y-2">
                <Label>Display Name</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm">{promptData.title}</div>
              </div>

              {/* Description (Read-only) */}
              <div className="space-y-2">
                <Label>Description</Label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                  {promptData.description}
                </div>
              </div>

              {/* Content Field */}
              <form.Field name="content">
                {(field) => (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={field.name}>Prompt Content</Label>
                      {isUsingDefaultAfterChange && (
                        <span className="text-xs text-green-600 font-medium">Will use default</span>
                      )}
                    </div>
                    <Textarea
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter prompt content"
                      className="min-h-[300px] font-mono text-sm"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600">
                        {field.state.meta.errors.map((error) => error?.message).join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Use placeholders like {`{title}`} and {`{content}`} for template variables.
                    </p>
                  </div>
                )}
              </form.Field>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <div className="flex space-x-2">
                  {promptData.hasCustomValue && (
                    <Button type="button" variant="outline" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Default
                    </Button>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => navigate({ to: "/settings/" })}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.state.isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {form.state.isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Default Content Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Default Content</CardTitle>
            <CardDescription>This is the original default content for reference.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md text-sm font-mono whitespace-pre-wrap overflow-x-auto">
              {promptData.defaultContent}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
