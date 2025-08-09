import { useAtom } from "jotai";
import { Eye, EyeOff } from "lucide-react";
import { isBackgroundEnabledAtom } from "~/lib/atoms/ui";
import { Button } from "./ui/button";

export function BackgroundToggle() {
  const [isEnabled, setIsEnabled] = useAtom(isBackgroundEnabledAtom);

  const toggleBackground = () => {
    setIsEnabled(!isEnabled);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleBackground}
      className="h-8 w-8 p-0"
      title={isEnabled ? "Disable background animation" : "Enable background animation"}>
      {isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      <span className="sr-only">Toggle background animation</span>
    </Button>
  );
}
