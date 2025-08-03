import type { ReactNode } from "react";
import { useState } from "react";
import { Navigation } from "./Navigation";
import { ThemeProvider } from "./ThemeProvider";
import { Toaster } from "./ui/sonner";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isWideLayout, setIsWideLayout] = useState(false);

  const toggleWidth = () => {
    setIsWideLayout(!isWideLayout);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <Navigation isWide={isWideLayout} onToggleWidth={toggleWidth} />
        <main
          className={`@container mx-auto py-8 ${
            isWideLayout ? "px-4 sm:px-6 lg:px-8" : "container px-4 sm:px-6 lg:px-8"
          }`}>
          {children}
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
