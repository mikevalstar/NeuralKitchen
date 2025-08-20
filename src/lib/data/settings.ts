import { z } from "zod";
import { type AppSettingInput, appSettingSchema } from "../dataValidators";
import prisma from "../prisma";

// Settings configuration schema - defines all available settings with types and defaults
export const settingsConfigSchema = z.object({
  APP_URL: z
    .string()
    .default("http://localhost:3000")
    .describe("The URL of the app that is presented to the user (Used for authentication)"),
  OPENAI_API_KEY: z
    .string()
    .default("")
    .describe("The API key for the OpenAI API (Used for content summarization and vector embeddings)"),
});

export type SettingsConfig = z.infer<typeof settingsConfigSchema>;

export namespace AppSettings {
  /**
   * Get all non-deleted settings
   */
  export async function list() {
    return prisma.appSetting.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        key: "asc",
      },
    });
  }

  /**
   * Get a single setting by key
   */
  export async function read(key: string) {
    return prisma.appSetting.findFirst({
      where: {
        key,
        deletedAt: null,
      },
    });
  }

  /**
   * Upsert a setting (create if doesn't exist, update if it does)
   */
  export async function upsert(data: AppSettingInput, userId?: string) {
    const validatedData = appSettingSchema.parse(data);

    return prisma.appSetting.upsert({
      where: { key: validatedData.key },
      update: {
        value: validatedData.value?.trim(),
        description: validatedData.description?.trim(),
        type: validatedData.type,
        modifiedBy: userId,
        updatedAt: new Date(),
        deletedAt: null, // Restore if it was deleted
      },
      create: {
        key: validatedData.key.trim(),
        value: validatedData.value?.trim(),
        description: validatedData.description?.trim(),
        type: validatedData.type,
        createdBy: userId,
        modifiedBy: userId,
      },
    });
  }
}

/**
 * Settings singleton class that manages application settings with in-memory cache
 */
class SettingsManager {
  private static instance: SettingsManager;
  private settings: SettingsConfig = {} as SettingsConfig;
  private isLoaded = false;

  private constructor() {}

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
      SettingsManager.instance.loadSettings();
    }
    return SettingsManager.instance;
  }

  /**
   * Load all settings from database into memory
   */
  public async loadSettings(): Promise<void> {
    try {
      const dbSettings = await AppSettings.list();

      // Create object with database values
      const rawSettings: Record<string, string> = {};
      for (const setting of dbSettings) {
        if (setting.value !== null) {
          rawSettings[setting.key] = setting.value;
        }
      }

      // Parse and validate settings with defaults
      this.settings = settingsConfigSchema.parse(rawSettings);
      this.isLoaded = true;

      // Populate any missing settings with defaults
      await this.populateDefaultSettings();

      console.log(`Loaded ${dbSettings.length} settings into memory`);
    } catch (error) {
      console.error("Failed to load settings:", error);
      // Use defaults if loading fails
      this.settings = settingsConfigSchema.parse({});
      this.isLoaded = true;

      // Still try to populate defaults even if loading failed
      try {
        await this.populateDefaultSettings();
      } catch (populateError) {
        console.error("Failed to populate default settings:", populateError);
      }
    }
  }

  /**
   * Get typed settings object (always from memory)
   */
  public getSettings(): SettingsConfig {
    if (!this.isLoaded) {
      throw new Error("Settings not loaded yet. Call loadSettings() first.");
    }
    return this.settings;
  }

  /**
   * Get a specific setting value
   */
  public get<K extends keyof SettingsConfig>(key: K): SettingsConfig[K] {
    return this.getSettings()[key];
  }

  /**
   * Set a setting value and persist to database
   */
  public async set<K extends keyof SettingsConfig>(
    key: K,
    value: SettingsConfig[K],
    description?: string,
    userId?: string,
  ): Promise<void> {
    try {
      // Update database
      await AppSettings.upsert(
        {
          key: key as string,
          value: String(value),
          description,
          type: this.detectType(value),
        },
        userId,
      );

      // Update memory
      this.settings[key] = value;
    } catch (error) {
      console.error(`Failed to set setting "${String(key)}":`, error);
      throw error;
    }
  }

  /**
   * Check if settings are loaded
   */
  public isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Refresh settings from database
   */
  public async refresh(): Promise<void> {
    await this.loadSettings();
  }

  /**
   * Populate any missing settings with their default values
   */
  private async populateDefaultSettings(): Promise<void> {
    try {
      // Get the default values from the schema
      const defaultSettings = settingsConfigSchema.parse({});

      // Check which settings are missing from the database
      const existingSettings = await AppSettings.list();
      const existingKeys = new Set(existingSettings.map((s) => s.key));

      const missingSettings: Array<{ key: string; value: unknown }> = [];

      for (const [key, defaultValue] of Object.entries(defaultSettings)) {
        if (!existingKeys.has(key)) {
          missingSettings.push({ key, value: defaultValue });
        }
      }

      if (missingSettings.length > 0) {
        console.log(
          `Populating ${missingSettings.length} missing settings with defaults:`,
          missingSettings.map((s) => s.key),
        );

        // Insert missing settings with their defaults
        for (const { key, value } of missingSettings) {
          // Get the description from the schema
          const fieldSchema = settingsConfigSchema.shape[key as keyof SettingsConfig];
          const description = fieldSchema?.description || `Default value for ${key}`;

          await AppSettings.upsert({
            key,
            value: String(value),
            description,
            type: this.detectType(value),
          });
        }

        // Update memory with the new defaults
        for (const { key, value } of missingSettings) {
          (this.settings as Record<string, unknown>)[key] = value;
        }
      }
    } catch (error) {
      console.error("Failed to populate default settings:", error);
    }
  }

  private detectType(value: unknown): "string" | "number" | "boolean" | "json" {
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (typeof value === "object" && value !== null) return "json";
    return "string";
  }
}

// Export singleton instance
export const Settings = SettingsManager.getInstance();
