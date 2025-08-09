import { useAtom } from "jotai";
import { Maximize, Minimize } from "lucide-react";
import { isWideLayoutAtom } from "~/lib/atoms/ui";
import { Button } from "./ui/button";

export function WidthToggle() {
  const [isWide, setIsWide] = useAtom(isWideLayoutAtom);

  const toggleWidth = () => {
    setIsWide(!isWide);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleWidth}
      className="p-2"
      title={isWide ? "Switch to constrained width" : "Switch to full width"}>
      {isWide ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
    </Button>
  );
}
