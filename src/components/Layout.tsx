import { useAtom } from "jotai";
import type { ReactNode } from "react";
import { isWideLayoutAtom } from "~/lib/atoms/ui";
import { Navigation } from "./Navigation";
import { ThemeEffect } from "./ThemeEffect";
import { ThreeBackground } from "./ThreeBackground";
import { Toaster } from "./ui/sonner";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isWideLayout] = useAtom(isWideLayoutAtom);

  return (
    <div className="min-h-screen bg-background relative">
      <ThemeEffect />
      <ThreeBackground />
      <Navigation />
      <main
        className={`@container mx-auto py-8 relative z-10 ${
          isWideLayout ? "px-4 sm:px-6 lg:px-8" : "container px-4 sm:px-6 lg:px-8"
        }`}>
        {children}
      </main>
      <Toaster />
    </div>
  );
}
