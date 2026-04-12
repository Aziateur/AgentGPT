import type { AIAppSettings, AIProviderConfig } from "@/types";
import { getProvider, type AIProvider } from "./provider";

const STORAGE_KEY = "adana:ai-settings";

export const DEFAULT_AI_SETTINGS: AIAppSettings = {
  providers: [
    {
      id: "default-anthropic",
      type: "anthropic",
      label: "Anthropic Claude",
      apiKey: "",
      model: "claude-3-5-sonnet-latest",
      isDefault: true,
    },
  ],
  defaultProviderId: "default-anthropic",
  features: {
    smartSummary: true,
    smartStatus: true,
    smartFields: true,
    smartRuleCreator: true,
    smartChat: true,
  },
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function clone<T>(v: T): T {
  // Structured-clone-ish via JSON is fine for our plain settings shape.
  return JSON.parse(JSON.stringify(v)) as T;
}

function sanitize(raw: any): AIAppSettings {
  const base = clone(DEFAULT_AI_SETTINGS);
  if (!raw || typeof raw !== "object") return base;

  const providers: AIProviderConfig[] = Array.isArray(raw.providers)
    ? raw.providers
        .filter((p: any) => p && typeof p.id === "string" && typeof p.type === "string")
        .map((p: any) => ({
          id: String(p.id),
          type: p.type,
          label: typeof p.label === "string" ? p.label : p.type,
          apiKey: typeof p.apiKey === "string" ? p.apiKey : undefined,
          baseUrl: typeof p.baseUrl === "string" ? p.baseUrl : undefined,
          model: typeof p.model === "string" ? p.model : "",
          isDefault: !!p.isDefault,
        }))
    : base.providers;

  const defaultProviderId =
    typeof raw.defaultProviderId === "string" && providers.some((p) => p.id === raw.defaultProviderId)
      ? raw.defaultProviderId
      : providers[0]?.id ?? null;

  const featuresRaw = raw.features && typeof raw.features === "object" ? raw.features : {};
  const features = {
    smartSummary: featuresRaw.smartSummary !== false,
    smartStatus: featuresRaw.smartStatus !== false,
    smartFields: featuresRaw.smartFields !== false,
    smartRuleCreator: featuresRaw.smartRuleCreator !== false,
    smartChat: featuresRaw.smartChat !== false,
  };

  return { providers, defaultProviderId, features };
}

export function loadAISettings(): AIAppSettings {
  if (!isBrowser()) return clone(DEFAULT_AI_SETTINGS);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(DEFAULT_AI_SETTINGS);
    return sanitize(JSON.parse(raw));
  } catch {
    return clone(DEFAULT_AI_SETTINGS);
  }
}

export function saveAISettings(settings: AIAppSettings): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota / serialization errors
  }
}

export function getDefaultProvider(): AIProvider | null {
  const settings = loadAISettings();
  const id = settings.defaultProviderId;
  if (!id) return null;
  const config = settings.providers.find((p) => p.id === id);
  if (!config) return null;
  try {
    return getProvider(config);
  } catch {
    return null;
  }
}
