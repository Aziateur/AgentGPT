import type { AIProvider, ChatMessage } from "./provider";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractJsonBlock(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) return fenced[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text.trim();
}

function tryParseJson<T = any>(text: string): T | null {
  try {
    return JSON.parse(extractJsonBlock(text)) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Smart summary
// ---------------------------------------------------------------------------

export async function smartSummary(
  provider: AIProvider,
  items: { type: "task" | "project"; title: string; description?: string; status?: string }[]
): Promise<string> {
  const list = items
    .map((it, i) => {
      const parts = [`${i + 1}. [${it.type}] ${it.title}`];
      if (it.status) parts.push(`status=${it.status}`);
      if (it.description) parts.push(`— ${it.description}`);
      return parts.join(" ");
    })
    .join("\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a concise project management assistant. Summarize the provided work items in 3-5 crisp bullet points focused on priorities, risks, and next steps. No preamble.",
    },
    {
      role: "user",
      content: `Summarize these items:\n\n${list}`,
    },
  ];
  const out = await provider.chat(messages, { maxTokens: 500, temperature: 0.3 });
  return out.trim();
}

// ---------------------------------------------------------------------------
// Smart status
// ---------------------------------------------------------------------------

export type SmartStatusResult = {
  status: "on_track" | "at_risk" | "off_track";
  text: string;
};

const VALID_STATUSES: SmartStatusResult["status"][] = ["on_track", "at_risk", "off_track"];

export async function smartStatus(
  provider: AIProvider,
  project: {
    name: string;
    tasks: { title: string; completed: boolean; dueDate?: string | null; assignee?: string }[];
  }
): Promise<SmartStatusResult> {
  const taskLines = project.tasks
    .map(
      (t) =>
        `- [${t.completed ? "x" : " "}] ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ""}${
          t.assignee ? ` — ${t.assignee}` : ""
        }`
    )
    .join("\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        'You evaluate project health. Return STRICT JSON ONLY with shape {"status":"on_track"|"at_risk"|"off_track","text":"one short paragraph explaining"}. No markdown, no prose, JSON only.',
    },
    {
      role: "user",
      content: `Project: ${project.name}\n\nTasks:\n${taskLines || "(none)"}\n\nToday: ${new Date()
        .toISOString()
        .slice(0, 10)}\n\nAssess overall project health.`,
    },
  ];

  const raw = await provider.chat(messages, { maxTokens: 400, temperature: 0.2 });
  const parsed = tryParseJson<SmartStatusResult>(raw);
  if (parsed && VALID_STATUSES.includes(parsed.status) && typeof parsed.text === "string") {
    return { status: parsed.status, text: parsed.text.trim() };
  }
  // Fallback: best-effort
  const lower = raw.toLowerCase();
  const status: SmartStatusResult["status"] = lower.includes("off_track")
    ? "off_track"
    : lower.includes("at_risk")
    ? "at_risk"
    : "on_track";
  return { status, text: raw.trim().slice(0, 500) };
}

// ---------------------------------------------------------------------------
// Smart field suggestion
// ---------------------------------------------------------------------------

export async function smartFieldSuggestion(
  provider: AIProvider,
  task: { title: string; description?: string },
  field: { name: string; type: string; options?: string[] }
): Promise<string> {
  const opts = field.options && field.options.length ? `\nAllowed options: ${field.options.join(", ")}` : "";
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You suggest the best value for a custom field on a task. Respond with the value ONLY, no quotes, no explanation. Keep it short. If options are provided, pick exactly one.",
    },
    {
      role: "user",
      content: `Task: ${task.title}${task.description ? `\nDescription: ${task.description}` : ""}\n\nField: ${field.name} (type=${field.type})${opts}\n\nSuggest a value:`,
    },
  ];
  const out = await provider.chat(messages, { maxTokens: 80, temperature: 0.2 });
  return out.trim().replace(/^["'`]+|["'`]+$/g, "");
}

// ---------------------------------------------------------------------------
// Smart rule creator
// ---------------------------------------------------------------------------

export type SmartRuleResult = {
  name: string;
  triggerType: string;
  triggerConfig: any;
  actions: any[];
};

const VALID_TRIGGERS = [
  "task_created",
  "task_completed",
  "task_moved",
  "due_date_approaching",
  "assignee_changed",
  "custom_field_changed",
  "comment_added",
  "form_submitted",
];

export async function smartRule(
  provider: AIProvider,
  naturalLanguage: string
): Promise<SmartRuleResult> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You convert a natural-language automation description into a strict JSON rule. Return JSON ONLY (no markdown, no prose) with shape:\n" +
        '{ "name": string, "triggerType": one of [' +
        VALID_TRIGGERS.map((t) => `"${t}"`).join(", ") +
        '], "triggerConfig": object, "actions": [ { "type": "assign"|"move_section"|"set_field"|"add_comment"|"complete"|"set_priority"|"add_tag"|"notify", "config": object } ] }\n' +
        "Use an empty object {} for triggerConfig when none needed.",
    },
    { role: "user", content: `Describe rule:\n${naturalLanguage}` },
  ];

  const raw = await provider.chat(messages, { maxTokens: 600, temperature: 0.2 });
  const parsed = tryParseJson<SmartRuleResult>(raw);
  if (!parsed) {
    throw new Error("AI did not return valid JSON for rule.");
  }

  const triggerType = VALID_TRIGGERS.includes(parsed.triggerType)
    ? parsed.triggerType
    : "task_created";
  const actions = Array.isArray(parsed.actions) ? parsed.actions : [];
  return {
    name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : "Untitled rule",
    triggerType,
    triggerConfig: parsed.triggerConfig ?? {},
    actions,
  };
}

// ---------------------------------------------------------------------------
// Smart chat
// ---------------------------------------------------------------------------

export async function smartChat(
  provider: AIProvider,
  contextMessages: ChatMessage[]
): Promise<string> {
  const out = await provider.chat(contextMessages, { maxTokens: 1024, temperature: 0.5 });
  return out.trim();
}
