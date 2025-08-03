import { Maximize, Minimize } from "lucide-react";
import { Button } from "./ui/button";

interface WidthToggleProps {
  isWide: boolean;
  onToggle: () => void;
}

export function WidthToggle({ isWide, onToggle }: WidthToggleProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="p-2"
      title={isWide ? "Switch to constrained width" : "Switch to full width"}
    >
      {isWide ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
    </Button>
  );
}