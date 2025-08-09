import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  variant?: "default" | "compact" | "search";
  className?: string;
}

export function MarkdownRenderer({ content, variant = "default", className = "" }: MarkdownRendererProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "compact":
        return "prose prose-sm prose-slate dark:prose-invert max-w-none";
      case "search":
        return "prose prose-sm prose-slate dark:prose-invert max-w-none";
      default:
        return "prose prose-slate dark:prose-invert max-w-none";
    }
  };

  const getComponents = () => {
    switch (variant) {
      case "compact":
        return {
          h1: ({ children }: { children: React.ReactNode }) => (
            <h1 className="text-base font-semibold mb-2">{children}</h1>
          ),
          h2: ({ children }: { children: React.ReactNode }) => <h2 className="text-sm font-medium mb-2">{children}</h2>,
          h3: ({ children }: { children: React.ReactNode }) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
          p: ({ children }: { children: React.ReactNode }) => (
            <p className="text-sm mb-2 last:mb-0 leading-relaxed text-muted-foreground">{children}</p>
          ),
          ul: ({ children }: { children: React.ReactNode }) => (
            <ul className="list-disc pl-4 mb-2 text-sm space-y-1">{children}</ul>
          ),
          ol: ({ children }: { children: React.ReactNode }) => (
            <ol className="list-decimal pl-4 mb-2 text-sm space-y-1">{children}</ol>
          ),
          li: ({ children }: { children: React.ReactNode }) => (
            <li className="leading-relaxed text-muted-foreground">{children}</li>
          ),
          code: ({ inline, children }: { inline?: boolean; children: React.ReactNode }) =>
            inline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
            ) : (
              <code className="block bg-muted p-3 rounded text-xs font-mono overflow-x-auto">{children}</code>
            ),
          pre: ({ children }: { children: React.ReactNode }) => (
            <pre className="bg-muted p-3 rounded overflow-x-auto mb-2">{children}</pre>
          ),
          blockquote: ({ children }: { children: React.ReactNode }) => (
            <blockquote className="border-l-4 border-primary pl-3 italic text-muted-foreground mb-2">
              {children}
            </blockquote>
          ),
          a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
            <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        };
      case "search":
        return {
          h1: ({ children }: { children: React.ReactNode }) => (
            <h1 className="text-sm font-semibold mb-1">{children}</h1>
          ),
          h2: ({ children }: { children: React.ReactNode }) => <h2 className="text-sm font-medium mb-1">{children}</h2>,
          h3: ({ children }: { children: React.ReactNode }) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
          p: ({ children }: { children: React.ReactNode }) => (
            <p className="text-sm mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),
          ul: ({ children }: { children: React.ReactNode }) => (
            <ul className="list-disc pl-4 mb-2 text-sm space-y-0.5">{children}</ul>
          ),
          ol: ({ children }: { children: React.ReactNode }) => (
            <ol className="list-decimal pl-4 mb-2 text-sm space-y-0.5">{children}</ol>
          ),
          li: ({ children }: { children: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
          code: ({ inline, children }: { inline?: boolean; children: React.ReactNode }) =>
            inline ? (
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
            ) : (
              <code className="block bg-muted p-2 rounded text-xs font-mono overflow-x-auto">{children}</code>
            ),
          pre: ({ children }: { children: React.ReactNode }) => (
            <pre className="bg-muted p-2 rounded overflow-x-auto mb-2 text-xs">{children}</pre>
          ),
          blockquote: ({ children }: { children: React.ReactNode }) => (
            <blockquote className="border-l-2 border-primary pl-3 italic text-muted-foreground mb-2 text-sm">
              {children}
            </blockquote>
          ),
          a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
            <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        };
      default:
        return {
          h1: ({ children }: { children: React.ReactNode }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
          h2: ({ children }: { children: React.ReactNode }) => (
            <h2 className="text-xl font-semibold mb-3 mt-6">{children}</h2>
          ),
          h3: ({ children }: { children: React.ReactNode }) => (
            <h3 className="text-lg font-medium mb-2 mt-4">{children}</h3>
          ),
          p: ({ children }: { children: React.ReactNode }) => <p className="mb-3 leading-relaxed">{children}</p>,
          ul: ({ children }: { children: React.ReactNode }) => (
            <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>
          ),
          ol: ({ children }: { children: React.ReactNode }) => (
            <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>
          ),
          li: ({ children }: { children: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
          code: ({ inline, children }: { inline?: boolean; children: React.ReactNode }) =>
            inline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
            ) : (
              <code className="block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">{children}</code>
            ),
          pre: ({ children }: { children: React.ReactNode }) => (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
          ),
          blockquote: ({ children }: { children: React.ReactNode }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-3">
              {children}
            </blockquote>
          ),
          a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
            <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        };
    }
  };

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={getComponents()}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
