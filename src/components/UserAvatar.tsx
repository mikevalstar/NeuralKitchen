import { useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { Eye, EyeOff, LogOut, Maximize, Minimize, Monitor, Moon, Settings, Sun, ToggleLeft } from "lucide-react";
import { isBackgroundEnabledAtom, isWideLayoutAtom, resolvedThemeAtom, type Theme, themeAtom } from "~/lib/atoms/ui";
import { signOut, useSession } from "~/lib/auth-client";
import { getGravatarUrl } from "~/lib/gravatar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function UserAvatar() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  // Atoms for toggle states
  const [isWide, setIsWide] = useAtom(isWideLayoutAtom);
  const [isBackgroundEnabled, setIsBackgroundEnabled] = useAtom(isBackgroundEnabledAtom);
  const [theme, setTheme] = useAtom(themeAtom);
  const [resolvedTheme] = useAtom(resolvedThemeAtom);

  if (isPending) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email
      ? user.email[0].toUpperCase()
      : "U";

  const handleSignOut = () => {
    signOut();
    navigate({ to: "/login" });
  };

  const handleWidthToggle = () => {
    setIsWide(!isWide);
  };

  const handleBackgroundToggle = () => {
    setIsBackgroundEnabled(!isBackgroundEnabled);
  };

  const handleThemeToggle = () => {
    const themes: Array<Theme> = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    if (theme === "system") {
      return <Monitor className="h-4 w-4" />;
    }
    return theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  };

  const getThemeLabel = () => {
    if (theme === "system") {
      return `System (${resolvedTheme})`;
    }
    return theme === "dark" ? "Dark" : "Light";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getGravatarUrl(user.email, 32)} alt={user.name || "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleWidthToggle} className="flex items-center justify-between">
          <div className="flex items-center">
            <ToggleLeft className="mr-2 h-4 w-4" />
            <span>Layout Width</span>
          </div>
          <div className="flex items-center">
            {isWide ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleBackgroundToggle} className="flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="mr-2 h-4 w-4" />
            <span>Background</span>
          </div>
          <div className="flex items-center">
            {isBackgroundEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleThemeToggle} className="flex items-center justify-between">
          <div className="flex items-center">
            {getThemeIcon()}
            <span className="ml-2">Theme</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground">{getThemeLabel()}</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate({ to: "/preferences" })}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Preferences</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
