import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle, Settings } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

interface SettingsValidation {
  openaiApiKey: boolean;
}

const getSettingsValidation = createServerFn({ method: "GET" }).handler(async (): Promise<SettingsValidation> => {
  return {
    openaiApiKey: !!process.env.OPENAI_API_KEY,
  };
});

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  loader: () => {
    return getSettingsValidation();
  },
});

function SettingsPage() {
  const validation = Route.useLoaderData();

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