import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MarkdownRenderer } from "~/components/MarkdownRenderer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { getUserDetails } from "~/lib/auth-server-user";
import { helpFileSchema } from "~/lib/dataValidators";

interface HelpContent {
  content: string;
  filename: string;
}

export const Route = createFileRoute("/help/$helpFile")({
  beforeLoad: async ({ params }) => {
    // load the user details to check authentication
    const user = await getUserDetails();

    // Validate the helpFile parameter
    const result = helpFileSchema.safeParse({ helpFile: params.helpFile });
    if (!result.success) {
      throw new Error("Invalid help file name");
    }

    return { user };
  },
  loader: async ({ context, params }) => {
    if (!context?.user?.id) {
      throw redirect({
        to: "/login",
        search: { redirect: `/help/${params.helpFile}` },
      });
    }
    return context?.user;
  },
  component: HelpFile,
});

function HelpFile() {
  const { helpFile } = Route.useParams();
  const [content, setContent] = useState<HelpContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHelpContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate the filename again on the client side
        const result = helpFileSchema.safeParse({ helpFile });
        if (!result.success) {
          throw new Error("Invalid help file name");
        }

        const sanitizedFile = result.data.helpFile;

        // Fetch the markdown file from the public directory
        const response = await fetch(`/help/${sanitizedFile}.md`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Help page not found");
          }
          throw new Error("Failed to load help content");
        }

        const markdownContent = await response.text();

        setContent({
          content: markdownContent,
          filename: sanitizedFile,
        });
      } catch (err) {
        console.error("Error loading help content:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchHelpContent();
  }, [helpFile]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Help</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help Page Not Found</h1>
          <p className="text-muted-foreground">The requested help page could not be found.</p>
        </div>

        {/* Error Content */}
        <Card>
          <CardContent>
            <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Link to="/help/$helpFile" params={{ helpFile: "home" }}>
                <Button>Return to Help Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink>
              <Link to="/help/$helpFile" params={{ helpFile: "home" }}>
                Help
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {content.filename !== "home" && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{content.filename}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Content */}
      <Card>
        <CardContent>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <MarkdownRenderer content={content.content} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
