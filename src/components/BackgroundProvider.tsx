import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

interface BackgroundContextType {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("background-enabled");
      // Default to true if no preference is saved
      return saved === null ? true : saved === "true";
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("background-enabled", isEnabled.toString());
    }
  }, [isEnabled]);

  return <BackgroundContext.Provider value={{ isEnabled, setIsEnabled }}>{children}</BackgroundContext.Provider>;
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error("useBackground must be used within a BackgroundProvider");
  }
  return context;
}
