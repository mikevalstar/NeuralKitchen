import { Link } from "@tanstack/react-router";
import { Activity, BookOpen, FolderOpen, HelpCircle, Search, Tags } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { WidthToggle } from "./WidthToggle";

interface NavigationProps {
  isWide: boolean;
  onToggleWidth: () => void;
}

export function Navigation({ isWide, onToggleWidth }: NavigationProps) {
  const navItems = [
    { href: "/recipes", label: "Recipes", icon: BookOpen },
    { href: "/search", label: "Search", icon: Search },
    { href: "/projects", label: "Projects", icon: FolderOpen },
    { href: "/tags", label: "Tags", icon: Tags },
    { href: "/queue", label: "Queue", icon: Activity },
    { href: "/help", label: "Help", icon: HelpCircle },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-10">
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${isWide ? "" : "container"}`}>
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-foreground">Neural Kitchen</span>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                activeProps={{
                  className: "flex items-center space-x-2 text-sm font-medium text-foreground",
                }}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Right side - Width Toggle, Theme Toggle and Mobile Menu */}
          <div className="flex items-center space-x-2">
            <WidthToggle isWide={isWide} onToggle={onToggleWidth} />
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" className="p-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
