import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MarkdownRenderer } from "~/components/MarkdownRenderer";
import { Button } from "~/components/ui/button";
import { helpFileSchema } from "~/lib/dataValidators";

interface HelpContent {
  content: string;
  filename: string;
}

export const Route = createFileRoute("/help/$helpFile")({
  beforeLoad: ({ params }) => {
    // Validate the helpFile parameter
    const result = helpFileSchema.safeParse({ helpFile: params.helpFile });
    if (!result.success) {
      throw new Error("Invalid help file name");
    }
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
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help Page Not Found</h1>
          <p className="text-muted-foreground">The requested help page could not be found.</p>
        </div>

        <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link to="/help/home">
            <Button>Return to Help Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-muted-foreground mb-4">
          <Link to="/help/home" className="hover:text-foreground">
            Help
          </Link>
          {content.filename !== "home" && (
            <>
              <span className="mx-2">/</span>
              <span>{content.filename}</span>
            </>
          )}
        </nav>
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <MarkdownRenderer content={content.content} />
      </div>
    </div>
  );
}
