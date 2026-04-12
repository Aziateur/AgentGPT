"use client";

import AISettings from "@/components/settings/ai-settings";

export default function AISettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">AI Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure AI providers and smart features used throughout Adana.
        </p>
      </header>
      <AISettings />
    </div>
  );
}
