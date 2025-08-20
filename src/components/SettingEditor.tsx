import { useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Edit, Save, X } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { authMiddlewareEnsure } from "~/lib/auth-middleware";
import { Settings as AppSettings, type SettingsConfig } from "~/lib/data/settings";

export interface AppSettingInfo {
  key: keyof SettingsConfig;
  value: string;
  description: string;
  type: string;
}

const updateSettingSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.string(),
});

const updateAppSetting = createServerFn({ method: "POST" })
  .middleware([authMiddlewareEnsure])
  .validator(updateSettingSchema)
  .handler(async ({ data, context }) => {
    // Ensure the key is valid for our settings config
    const validKey = data.key as keyof SettingsConfig;
    await AppSettings.set(validKey, data.value, undefined, context.user?.id);
    return { success: true };
  });

export function SettingEditor({ setting }: { setting: AppSettingInfo }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(setting.value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await updateAppSetting({ data: { key: setting.key, value } });
      setIsEditing(false);
      router.invalidate();
    } catch (err) {
      console.error("Failed to update setting:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update setting";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(setting.value);
    setIsEditing(false);
    setError(null);
  };

  const displayValue = (() => {
    if (setting.key === "OPENAI_API_KEY" && setting.value) {
      // Show only last 8 characters with a fixed number of asterisks to prevent overflow
      const lastChars = setting.value.slice(-8);
      return `••••••••••••${lastChars}`;
    }
    return setting.value;
  })();

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium">{setting.key}</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{setting.type}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
        {!isEditing ? (
          <div className="mt-2">
            <span className="text-sm font-mono bg-gray-50 px-2 py-1 rounded block overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
              {displayValue || "(empty)"}
            </span>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <Label htmlFor={`setting-${setting.key}`}>Value</Label>
            <Input
              id={`setting-${setting.key}`}
              type={setting.key === "OPENAI_API_KEY" ? "password" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter ${setting.key}`}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2 ml-4">
        {!isEditing ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsEditing(true);
              setError(null);
            }}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={isLoading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
