import type { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { ThemeProvider } from "./ThemeProvider";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </ThemeProvider>
  );
}
