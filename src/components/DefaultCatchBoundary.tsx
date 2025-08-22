import type { ErrorComponentProps } from "@tanstack/react-router";
import { ErrorComponent, Link, rootRouteId, useMatch, useRouter } from "@tanstack/react-router";
// Browser-side logging using console

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  // Comprehensive error logging (SSR-safe)
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "unknown";
  const currentUrl = typeof window !== "undefined" ? window.location.href : "unknown";
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";

  console.error("[WEB] Application error caught by error boundary", {
    error: errorMessage,
    stack: errorStack,
    errorType: error instanceof Error ? error.constructor.name : "Unknown",
    path: currentPath,
    url: currentUrl,
    userAgent,
    isRootRoute: isRoot,
    timestamp: new Date().toISOString(),
  });

  console.error("DefaultCatchBoundary Error:", error);

  return (
    <div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6">
      <ErrorComponent error={error} />
      <div className="flex gap-2 items-center flex-wrap">
        <button
          type="button"
          onClick={() => {
            console.info("[WEB] User attempted recovery from error boundary", {
              action: "try_again",
              path: currentPath,
              errorType: error instanceof Error ? error.constructor.name : "Unknown",
            });
            router.invalidate();
          }}
          className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`}>
          Try Again
        </button>
        {isRoot ? (
          <Link
            to="/"
            className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`}
            onClick={() => {
              console.info("[WEB] User navigated from error boundary", {
                action: "go_home",
                path: currentPath,
                errorType: error instanceof Error ? error.constructor.name : "Unknown",
              });
            }}>
            Home
          </Link>
        ) : (
          <Link
            to="/"
            className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`}
            onClick={(e) => {
              e.preventDefault();
              console.info("[WEB] User navigated from error boundary", {
                action: "go_back",
                path: currentPath,
                errorType: error instanceof Error ? error.constructor.name : "Unknown",
              });
              if (typeof window !== "undefined") {
                window.history.back();
              }
            }}>
            Go Back
          </Link>
        )}
      </div>
    </div>
  );
}
