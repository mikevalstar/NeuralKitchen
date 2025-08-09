import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle, Edit, MessageSquare, Settings } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Prompts } from "~/lib/data/prompts";
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

const getSettingsValidation = createServerFn({ method: "GET" }).handler(async (): Promise<SettingsValidation> => {
  return {
    openaiApiKey: !!process.env.OPENAI_API_KEY,
  };
});

const getPromptStatuses = createServerFn({ method: "GET" }).handler(async (): Promise<PromptStatus[]> => {
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

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
  loader: async () => {
    const [validation, promptStatuses] = await Promise.all([
      getSettingsValidation(),
      getPromptStatuses(),
    ]);
    return { validation, promptStatuses };
  },
});

function SettingsPage() {
  const { validation, promptStatuses } = Route.useLoaderData();

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
                  The OPENAI_API_KEY environment variable is not set. This will disable:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>AI-generated recipe summaries</li>
                    <li>Vector embeddings for semantic search</li>
                    <li>Enhanced search functionality</li>
                  </ul>
                  Please set the OPENAI_API_KEY environment variable to enable these features.
                </AlertDescription>
              </Alert>
            )}

            {validation.openaiApiKey && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Environment Configuration Valid</AlertTitle>
                <AlertDescription>
                  All required environment variables are properly configured. AI features are enabled.
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
                          prompt.isUsingDefault
                            ? "bg-gray-100 text-gray-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
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
              <span>General Settings</span>
            </CardTitle>
            <CardDescription>Configure your general preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">Settings configuration coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
