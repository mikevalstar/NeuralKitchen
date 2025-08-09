import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BackgroundProvider } from "./BackgroundProvider";
import { Navigation } from "./Navigation";
import { ThemeProvider } from "./ThemeProvider";
import { ThreeBackground } from "./ThreeBackground";
import { Toaster } from "./ui/sonner";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isWideLayout, setIsWideLayout] = useState(false);

  // Load width preference from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem("layout-width");
    if (savedWidth === "wide") {
      setIsWideLayout(true);
    }
  }, []);

  const toggleWidth = () => {
    const newIsWide = !isWideLayout;
    setIsWideLayout(newIsWide);
    // Save preference to localStorage
    localStorage.setItem("layout-width", newIsWide ? "wide" : "constrained");
  };

  return (
    <ThemeProvider>
      <BackgroundProvider>
        <div className="min-h-screen bg-background relative">
          <ThreeBackground />
          <Navigation isWide={isWideLayout} onToggleWidth={toggleWidth} />
          <main
            className={`@container mx-auto py-8 relative z-10 ${
              isWideLayout ? "px-4 sm:px-6 lg:px-8" : "container px-4 sm:px-6 lg:px-8"
            }`}>
            {children}
          </main>
          <Toaster />
        </div>
      </BackgroundProvider>
    </ThemeProvider>
  );
}
