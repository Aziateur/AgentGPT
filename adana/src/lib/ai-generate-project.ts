import { useAppStore } from "@/store/app-store";
import { getDefaultProvider } from "@/lib/ai/settings";

/**
 * Generate a new project (with sections + tasks) from a natural-language prompt
 * using the user's default AI provider. Returns the new project id on success.
 */
export async function generateProjectFromPrompt(prompt: string): Promise<string | null> {
  const provider = getDefaultProvider();
  if (!provider) throw new Error("No AI provider configured. Set one in /settings/ai");

  const system = `You design project management templates. Respond ONLY with strict JSON matching this schema:
{
  "name": "Project name",
  "description": "One-sentence description",
  "color": "#RRGGBB",
  "sections": ["Section 1", "Section 2", ...],
  "tasks": [{"title": "Task", "sectionIdx": 0, "priority": "high|medium|low"}, ...]
}
No prose, no markdown, no explanation.`;

  const reply = await provider.chat(
    [
      { role: "system", content: system },
      { role: "user", content: `Design a project plan for: ${prompt}` },
    ],
    { temperature: 0.4, maxTokens: 2000 }
  );

  // Extract JSON block (strips any accidental prose/fences)
  const jsonMatch = reply.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return JSON");

  let plan: {
    name?: string;
    description?: string | null;
    color?: string;
    sections?: string[];
    tasks?: { title: string; sectionIdx?: number; priority?: string }[];
  };
  try {
    plan = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  const store = useAppStore.getState();
  const project = await store.createProject({
    name: plan.name || "Untitled project",
    description: plan.description ?? null,
    color: plan.color || "#6366f1",
  });

  // Replace default sections with AI-generated ones
  const defaults = store.getProjectSections(project.id);
  for (const s of defaults) await store.deleteSection(s.id);

  const sectionRecords: { id: string }[] = [];
  for (const name of plan.sections || []) {
    const rec = await store.createSection({ name, projectId: project.id });
    sectionRecords.push(rec);
  }

  for (const t of plan.tasks || []) {
    const idx = typeof t.sectionIdx === "number" ? t.sectionIdx : 0;
    const priority =
      t.priority === "high" || t.priority === "medium" || t.priority === "low"
        ? t.priority
        : "medium";
    await store.createTask({
      title: t.title,
      projectId: project.id,
      sectionId: sectionRecords[idx]?.id ?? null,
      priority,
    });
  }

  return project.id;
}
