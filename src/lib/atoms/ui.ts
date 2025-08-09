import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Theme atom - supports light, dark, and system
export type Theme = "light" | "dark" | "system";

export const themeAtom = atomWithStorage<Theme>("theme", "system");

// Resolved theme atom - computed from theme atom and system preference
export const resolvedThemeAtom = atom<"light" | "dark">((get) => {
  const theme = get(themeAtom);
  
  if (theme === "system") {
    // Check system preference
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }
  
  return theme;
});

// Width toggle atom - boolean for wide layout
export const isWideLayoutAtom = atomWithStorage("layout-width", false, {
  getItem: (key) => {
    const value = localStorage.getItem(key);
    return value === "wide";
  },
  setItem: (key, value) => {
    localStorage.setItem(key, value ? "wide" : "constrained");
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
  },
});

// Background animation atom - boolean for Three.js background
export const isBackgroundEnabledAtom = atomWithStorage("background-enabled", true);