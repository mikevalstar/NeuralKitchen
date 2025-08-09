import { useAtom } from "jotai";
import { Monitor, Moon, Sun } from "lucide-react";
import { resolvedThemeAtom, themeAtom, type Theme } from "~/lib/atoms/ui";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom);
  const [resolvedTheme] = useAtom(resolvedThemeAtom);

  const toggleTheme = () => {
    const themes: Array<Theme> = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="h-4 w-4" />;
    }
    return theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (theme === "system") {
      return `System (${resolvedTheme})`;
    }
    return theme === "dark" ? "Dark" : "Light";
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-8 w-8 p-0" title={getLabel()}>
      {getIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
