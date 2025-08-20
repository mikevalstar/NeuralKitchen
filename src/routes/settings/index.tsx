import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle, Edit, MessageSquare, Settings } from "lucide-react";
import { type AppSettingInfo, SettingEditor } from "~/components/SettingEditor";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { getUserDetails } from "~/lib/auth-server-user";
import { Prompts } from "~/lib/data/prompts";
import { Settings as AppSettings, type SettingsConfig, settingsConfigSchema } from "~/lib/data/settings";
import { DEFAULT_PROMPTS, PROMPT_METADATA, type PromptKey } from "~/lib/prompts";

interface SettingsValidation {
  openaiApiKey: boolean;
}

interface PromptStatus {
  key: PromptKey;
  title: string;
  description: string;
  hasCustomValue: boolean;
  isUsingDefault: boolean;
}

const getSettingsValidation = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .handler(async (): Promise<SettingsValidation> => {
    return {
      openaiApiKey: !!AppSettings.get("OPENAI_API_KEY"),
    };
  });

const getPromptStatuses = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .handler(async (): Promise<PromptStatus[]> => {
    const promptKeys = Object.keys(DEFAULT_PROMPTS) as PromptKey[];
    const statuses: PromptStatus[] = [];

    for (const key of promptKeys) {
      const record = await Prompts.getRecordByKey(key);
      const metadata = PROMPT_METADATA[key];

      statuses.push({
        key,
        title: metadata.title,
        description: metadata.description,
        hasCustomValue: !!record,
        isUsingDefault: !record || !record.content.trim(),
      });
    }

    return statuses;
  });

const getAppSettings = createServerFn({ method: "GET" })
  .middleware([authMiddlewareEnsure])
  .handler(async (): Promise<AppSettingInfo[]> => {
    const allSettings = AppSettings.getSettings();
    const schema = settingsConfigSchema.shape;

    const settings: AppSettingInfo[] = [];

    for (const [key, value] of Object.entries(allSettings)) {
      const fieldSchema = schema[key as keyof SettingsConfig];
      const description = fieldSchema?.description || `Setting: ${key}`;

      settings.push({
        key: key as keyof SettingsConfig,
        value: String(value),
        description,
        type: typeof value === "boolean" ? "boolean" : typeof value === "number" ? "number" : "string",
      });
    }

    return settings;
  });

export const Route = createFileRoute("/settings/")({
  beforeLoad: async () => {
    const user = await getUserDetails();
    return { user };
  },
  component: SettingsPage,
  loader: async ({ context }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: "/settings" },
      });
    }

    const [validation, promptStatuses, appSettings] = await Promise.all([
      getSettingsValidation(),
      getPromptStatuses(),
      getAppSettings(),
    ]);
    return { validation, promptStatuses, appSettings };
  },
});

function SettingsPage() {
  const { validation, promptStatuses, appSettings } = Route.useLoaderData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-lg">Configure your Neural Kitchen preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Environment Validation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Environment Configuration</span>
            </CardTitle>
            <CardDescription>Check your environment configuration for AI features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!validation.openaiApiKey && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>OpenAI API Key Missing</AlertTitle>
                <AlertDescription>
                  The OPENAI_API_KEY setting is not configured. This will disable:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>AI-generated recipe summaries</li>
                    <li>Vector embeddings for semantic search</li>
                    <li>Enhanced search functionality</li>
                  </ul>
                  Please configure the OPENAI_API_KEY setting to enable these features.
                </AlertDescription>
              </Alert>
            )}

            {validation.openaiApiKey && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Environment Configuration Valid</AlertTitle>
                <AlertDescription>
                  All required settings are properly configured. AI features are enabled.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* AI Prompts Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>AI Prompts</span>
            </CardTitle>
            <CardDescription>
              Customize the prompts used by AI features. Changes will take effect immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Caution</AlertTitle>
              <AlertDescription>
                Modifying AI prompts may break functionality if not done carefully. Test changes thoroughly.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {promptStatuses.map((prompt) => (
                <div key={prompt.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{prompt.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{prompt.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          prompt.isUsingDefault ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-600"
                        }`}>
                        {prompt.isUsingDefault ? "Using Default" : "Custom"}
                      </span>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/settings/prompts/$promptKey" params={{ promptKey: prompt.key }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Application Settings</span>
            </CardTitle>
            <CardDescription>Configure core application settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appSettings.map((setting) => (
                <SettingEditor key={setting.key} setting={setting} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
