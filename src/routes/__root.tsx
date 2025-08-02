import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { Layout } from "~/components/Layout";
import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: "stylesheet", href: appCss }],
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Neural Kitchen",
      },
    ],
    scripts: [
      {
        id: "theme-script",
        children: `
          (function() {
            try {
              const theme = localStorage.getItem('theme') || 'system';
              const resolvedTheme = theme === 'system' 
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : theme;
              document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
            } catch (e) {}
          })();
        `,
      },
    ],
  }),
  component: RootComponent,
  errorComponent: DefaultCatchBoundary,
});

function RootComponent() {
  return (
    <RootDocument>
      <Layout>
        <Outlet />
      </Layout>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}
