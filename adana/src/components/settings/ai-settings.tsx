"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Check, Zap, Save } from "lucide-react";
import type { AIAppSettings, AIProviderConfig, AIProviderType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadAISettings, saveAISettings } from "@/lib/ai/settings";
import { getProvider } from "@/lib/ai/provider";

type ProviderDraft = {
  id: string;
  type: AIProviderType;
  label: string;
  apiKey?: string;
  baseUrl?: string;
  model: string;
};

const PROVIDER_TYPES: { value: AIProviderType; label: string; defaultModel: string }[] = [
  { value: "anthropic", label: "Anthropic Claude", defaultModel: "claude-3-5-sonnet-latest" },
  { value: "openai", label: "OpenAI", defaultModel: "gpt-4o-mini" },
  { value: "openai_compatible", label: "OpenAI-compatible (custom)", defaultModel: "gpt-4o-mini" },
  { value: "ollama", label: "Ollama (local)", defaultModel: "llama3" },
];

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `prov-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function emptyDraft(): ProviderDraft {
  return {
    id: newId(),
    type: "anthropic",
    label: "Anthropic Claude",
    apiKey: "",
    baseUrl: "",
    model: "claude-3-5-sonnet-latest",
  };
}

export function AISettings() {
  const [settings, setSettings] = React.useState<AIAppSettings | null>(null);
  const [editing, setEditing] = React.useState<ProviderDraft | null>(null);
  const [editingIsNew, setEditingIsNew] = React.useState(false);
  const [testResult, setTestResult] = React.useState<Record<string, { ok: boolean; msg: string }>>({});
  const [testing, setTesting] = React.useState<string | null>(null);
  const [savedFlash, setSavedFlash] = React.useState(false);

  React.useEffect(() => {
    setSettings(loadAISettings());
  }, []);

  if (!settings) {
    return <div className="text-sm text-gray-500">Loading settings…</div>;
  }

  function patchSettings(fn: (s: AIAppSettings) => AIAppSettings) {
    setSettings((curr) => (curr ? fn(curr) : curr));
  }

  function handleAdd() {
    setEditing(emptyDraft());
    setEditingIsNew(true);
  }

  function handleEdit(p: AIProviderConfig) {
    setEditing({
      id: p.id,
      type: p.type,
      label: p.label,
      apiKey: p.apiKey || "",
      baseUrl: p.baseUrl || "",
      model: p.model || "",
    });
    setEditingIsNew(false);
  }

  function handleDelete(id: string) {
    patchSettings((s) => {
      const providers = s.providers.filter((p) => p.id !== id);
      let defaultProviderId = s.defaultProviderId;
      if (defaultProviderId === id) {
        defaultProviderId = providers[0]?.id ?? null;
      }
      return { ...s, providers, defaultProviderId };
    });
  }

  function handleSetDefault(id: string) {
    patchSettings((s) => ({ ...s, defaultProviderId: id }));
  }

  function handleSaveDraft() {
    if (!editing) return;
    const draft: AIProviderConfig = {
      id: editing.id,
      type: editing.type,
      label: editing.label.trim() || PROVIDER_TYPES.find((t) => t.value === editing.type)?.label || "Provider",
      apiKey: editing.apiKey || undefined,
      baseUrl: editing.baseUrl || undefined,
      model: editing.model.trim() || PROVIDER_TYPES.find((t) => t.value === editing.type)?.defaultModel || "",
    };
    patchSettings((s) => {
      const exists = s.providers.some((p) => p.id === draft.id);
      const providers = exists
        ? s.providers.map((p) => (p.id === draft.id ? draft : p))
        : [...s.providers, draft];
      const defaultProviderId = s.defaultProviderId ?? draft.id;
      return { ...s, providers, defaultProviderId };
    });
    setEditing(null);
    setEditingIsNew(false);
  }

  async function handleTest(p: AIProviderConfig) {
    setTesting(p.id);
    setTestResult((prev) => ({ ...prev, [p.id]: { ok: false, msg: "Testing…" } }));
    try {
      const prov = getProvider(p);
      const reply = await prov.chat(
        [
          { role: "system", content: "Respond with a single short word." },
          { role: "user", content: "hi" },
        ],
        { maxTokens: 32, temperature: 0 }
      );
      const trimmed = (reply || "").trim().slice(0, 120);
      setTestResult((prev) => ({
        ...prev,
        [p.id]: { ok: true, msg: trimmed ? `OK — reply: "${trimmed}"` : "OK — (empty reply)" },
      }));
    } catch (e: any) {
      setTestResult((prev) => ({
        ...prev,
        [p.id]: { ok: false, msg: String(e?.message || e) },
      }));
    } finally {
      setTesting(null);
    }
  }

  function handleToggleFeature(
    key: keyof AIAppSettings["features"],
    value: boolean
  ) {
    patchSettings((s) => ({ ...s, features: { ...s.features, [key]: value } }));
  }

  function handlePersist() {
    if (!settings) return;
    saveAISettings(settings);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  }

  const showKey = editing && editing.type !== "ollama";
  const showBaseUrl = editing && (editing.type === "openai_compatible" || editing.type === "ollama");

  return (
    <div className="space-y-8">
      {/* Providers section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Providers</h2>
            <p className="text-sm text-gray-500">Plug in any AI backend. Keys are stored only in your browser (localStorage).</p>
          </div>
          <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
            Add provider
          </Button>
        </div>

        {settings.providers.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-500">
            No providers configured.
          </div>
        ) : (
          <ul className="space-y-3">
            {settings.providers.map((p) => {
              const isDefault = settings.defaultProviderId === p.id;
              const testInfo = testResult[p.id];
              return (
                <li
                  key={p.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{p.label}</span>
                        <span className="text-xs text-gray-500">({p.type})</span>
                        {isDefault && (
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        model: <span className="font-mono">{p.model || "(none)"}</span>
                        {p.baseUrl ? (
                          <>
                            {" · "}base: <span className="font-mono">{p.baseUrl}</span>
                          </>
                        ) : null}
                        {p.apiKey ? " · key set" : p.type === "ollama" ? "" : " · no key"}
                      </div>
                      {testInfo && (
                        <div
                          className={`text-xs mt-2 ${testInfo.ok ? "text-green-700" : "text-red-700"}`}
                        >
                          {testInfo.msg}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Zap className="h-4 w-4" />}
                        onClick={() => handleTest(p)}
                        loading={testing === p.id}
                      >
                        Test
                      </Button>
                      {!isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Check className="h-4 w-4" />}
                          onClick={() => handleSetDefault(p.id)}
                        >
                          Set default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Pencil className="h-4 w-4" />}
                        onClick={() => handleEdit(p)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => handleDelete(p.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Editor */}
        {editing && (
          <div className="mt-4 border border-indigo-200 bg-indigo-50/40 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              {editingIsNew ? "New provider" : "Edit provider"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Type</label>
                <select
                  className="h-9 px-3 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editing.type}
                  onChange={(e) => {
                    const newType = e.target.value as AIProviderType;
                    const defaults = PROVIDER_TYPES.find((t) => t.value === newType);
                    setEditing((d) =>
                      d
                        ? {
                            ...d,
                            type: newType,
                            model: d.model || defaults?.defaultModel || "",
                            label: d.label || defaults?.label || newType,
                          }
                        : d
                    );
                  }}
                >
                  {PROVIDER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Label"
                value={editing.label}
                onChange={(e) => setEditing((d) => (d ? { ...d, label: e.target.value } : d))}
                placeholder="My Anthropic"
              />

              <Input
                label="Model"
                value={editing.model}
                onChange={(e) => setEditing((d) => (d ? { ...d, model: e.target.value } : d))}
                placeholder="e.g. claude-3-5-sonnet-latest"
              />

              {showKey && (
                <Input
                  label="API Key"
                  type="password"
                  value={editing.apiKey || ""}
                  onChange={(e) => setEditing((d) => (d ? { ...d, apiKey: e.target.value } : d))}
                  placeholder="sk-…"
                />
              )}

              {showBaseUrl && (
                <Input
                  label="Base URL"
                  value={editing.baseUrl || ""}
                  onChange={(e) => setEditing((d) => (d ? { ...d, baseUrl: e.target.value } : d))}
                  placeholder={editing.type === "ollama" ? "http://localhost:11434" : "https://…/v1"}
                />
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveDraft}>
                {editingIsNew ? "Add" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Features */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Smart features</h2>
        <p className="text-sm text-gray-500 mb-3">Enable or disable AI capabilities across Adana.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { key: "smartSummary", label: "Smart summaries" },
            { key: "smartStatus", label: "Smart project status" },
            { key: "smartFields", label: "Smart field suggestions" },
            { key: "smartRuleCreator", label: "Smart rule creator (NL → automation)" },
            { key: "smartChat", label: "Smart chat assistant" },
          ].map((f) => {
            const key = f.key as keyof AIAppSettings["features"];
            const checked = settings.features[key];
            return (
              <label
                key={f.key}
                className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2 bg-white cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={checked}
                  onChange={(e) => handleToggleFeature(key, e.target.checked)}
                />
                <span className="text-sm text-gray-800">{f.label}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {savedFlash && <span className="text-sm text-green-700">Saved.</span>}
        <Button variant="primary" icon={<Save className="h-4 w-4" />} onClick={handlePersist}>
          Save settings
        </Button>
      </div>
    </div>
  );
}

export default AISettings;
