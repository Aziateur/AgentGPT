"use client";

import * as React from "react";
import { Send, Trash2, Sparkles, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/lib/ai/provider";
import { getDefaultProvider } from "@/lib/ai/settings";
import { smartChat } from "@/lib/ai/features";
import { Button } from "@/components/ui/button";

export interface SmartChatProps {
  contextSystemPrompt?: string;
  title?: string;
  placeholder?: string;
  className?: string;
  suggestedPrompts?: string[];
}

type UIMessage = { role: "user" | "assistant"; content: string };

export function SmartChat({
  contextSystemPrompt,
  title = "Adana AI",
  placeholder = "Ask me anything about your tasks or projects…",
  className,
  suggestedPrompts,
}: SmartChatProps) {
  const [messages, setMessages] = React.useState<UIMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [providerReady, setProviderReady] = React.useState<boolean | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setProviderReady(getDefaultProvider() != null);
  }, []);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    const provider = getDefaultProvider();
    if (!provider) {
      setProviderReady(false);
      return;
    }
    setError(null);
    const next: UIMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);

    const ctx: ChatMessage[] = [];
    if (contextSystemPrompt && contextSystemPrompt.trim()) {
      ctx.push({ role: "system", content: contextSystemPrompt.trim() });
    }
    for (const m of next) ctx.push({ role: m.role, content: m.content });

    try {
      const reply = await smartChat(provider, ctx);
      setMessages((curr) => [...curr, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    setMessages([]);
    setError(null);
  }

  return (
    <div
      className={
        "flex flex-col h-full w-full bg-white border border-gray-200 rounded-lg overflow-hidden " +
        (className || "")
      }
    >
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <Button size="sm" variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={handleClear}>
          Clear
        </Button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {providerReady === false && (
          <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
            Configure an AI provider in Settings → AI to start chatting.
          </div>
        )}

        {messages.length === 0 && providerReady !== false && (
          <div className="text-sm text-gray-500 text-center py-8">
            Start a conversation. Shift+Enter for newline.
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap " +
                (m.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-900")
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-900 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-3 bg-gray-50">
        {suggestedPrompts && suggestedPrompts.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {suggestedPrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInput(p)}
                disabled={sending || providerReady === false}
                className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            className="flex-1 resize-none rounded-lg border border-gray-300 bg-white text-sm p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] max-h-40"
            rows={1}
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending || providerReady === false}
          />
          <Button
            variant="primary"
            icon={<Send className="h-4 w-4" />}
            onClick={handleSend}
            disabled={sending || !input.trim() || providerReady === false}
            loading={sending}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SmartChat;
