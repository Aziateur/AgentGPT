import type { AIProviderConfig } from "@/types";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOpts {
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  id: string;
  label: string;
  chat(messages: ChatMessage[], opts?: ChatOpts): Promise<string>;
}

// ---------------------------------------------------------------------------
// Anthropic
// ---------------------------------------------------------------------------

class AnthropicProvider implements AIProvider {
  id: string;
  label: string;
  private apiKey: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.id = config.id;
    this.label = config.label;
    this.apiKey = config.apiKey || "";
    this.model = config.model || "claude-3-5-sonnet-latest";
  }

  async chat(messages: ChatMessage[], opts?: ChatOpts): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Anthropic API key is not configured.");
    }
    const systemParts = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content);
    const conv = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: opts?.maxTokens ?? 1024,
      messages: conv,
    };
    if (systemParts.length) body.system = systemParts.join("\n\n");
    if (typeof opts?.temperature === "number") body.temperature = opts.temperature;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Anthropic error ${res.status}: ${txt}`);
    }
    const data: any = await res.json();
    const first = Array.isArray(data?.content) ? data.content[0] : null;
    const text: string = (first && typeof first.text === "string") ? first.text : "";
    return text;
  }
}

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------

class OpenAIProvider implements AIProvider {
  id: string;
  label: string;
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private requireKey: boolean;

  constructor(config: AIProviderConfig, opts?: { baseUrl?: string; requireKey?: boolean }) {
    this.id = config.id;
    this.label = config.label;
    this.apiKey = config.apiKey || "";
    this.model = config.model || "gpt-4o-mini";
    this.baseUrl = (opts?.baseUrl ?? config.baseUrl ?? "https://api.openai.com/v1").replace(/\/+$/, "");
    this.requireKey = opts?.requireKey ?? true;
  }

  async chat(messages: ChatMessage[], opts?: ChatOpts): Promise<string> {
    if (this.requireKey && !this.apiKey) {
      throw new Error("OpenAI API key is not configured.");
    }
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (this.apiKey) headers["authorization"] = `Bearer ${this.apiKey}`;

    const body: Record<string, unknown> = {
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };
    if (typeof opts?.temperature === "number") body.temperature = opts.temperature;
    if (typeof opts?.maxTokens === "number") body.max_tokens = opts.maxTokens;

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${txt}`);
    }
    const data: any = await res.json();
    const msg = data?.choices?.[0]?.message?.content;
    return typeof msg === "string" ? msg : "";
  }
}

// ---------------------------------------------------------------------------
// OpenAI-compatible (custom baseUrl, optional key)
// ---------------------------------------------------------------------------

class OpenAICompatibleProvider extends OpenAIProvider {
  constructor(config: AIProviderConfig) {
    if (!config.baseUrl) {
      throw new Error("OpenAI-compatible provider requires a baseUrl.");
    }
    super(config, { baseUrl: config.baseUrl, requireKey: false });
  }
}

// ---------------------------------------------------------------------------
// Ollama (local)
// ---------------------------------------------------------------------------

class OllamaProvider implements AIProvider {
  id: string;
  label: string;
  private model: string;
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    this.id = config.id;
    this.label = config.label;
    this.model = config.model || "llama3";
    this.baseUrl = (config.baseUrl || "http://localhost:11434").replace(/\/+$/, "");
  }

  async chat(messages: ChatMessage[], opts?: ChatOpts): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
    };
    const options: Record<string, unknown> = {};
    if (typeof opts?.temperature === "number") options.temperature = opts.temperature;
    if (typeof opts?.maxTokens === "number") options.num_predict = opts.maxTokens;
    if (Object.keys(options).length) body.options = options;

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Ollama error ${res.status}: ${txt}`);
    }
    const data: any = await res.json();
    const content = data?.message?.content;
    return typeof content === "string" ? content : "";
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function getProvider(config: AIProviderConfig): AIProvider {
  switch (config.type) {
    case "anthropic":
      return new AnthropicProvider(config);
    case "openai":
      return new OpenAIProvider(config);
    case "openai_compatible":
      return new OpenAICompatibleProvider(config);
    case "ollama":
      return new OllamaProvider(config);
    default:
      throw new Error(`Unknown AI provider type: ${(config as AIProviderConfig).type}`);
  }
}
