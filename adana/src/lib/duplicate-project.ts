"use client";

import { useAppStore } from "@/store/app-store";

export async function duplicateProject(projectId: string): Promise<string | null> {
  const store = useAppStore.getState();
  const src = store.projects.find((p) => p.id === projectId);
  if (!src) return null;

  const copy = await store.createProject({
    name: src.name + " (copy)",
    description: src.description ?? null,
    color: src.color,
    icon: src.icon,
  });

  // createProject creates default sections — wipe and clone originals
  const origSections = store.getProjectSections(projectId);
  const newDefaults = store.getProjectSections(copy.id);
  for (const s of newDefaults) await store.deleteSection(s.id);

  const sectionIdMap = new Map<string, string>();
  for (const s of origSections) {
    const ns = await store.createSection({ name: s.name, projectId: copy.id });
    sectionIdMap.set(s.id, ns.id);
  }

  const origTasks = store.getProjectTasks(projectId);
  for (const t of origTasks) {
    await store.createTask({
      title: t.title,
      description: t.description,
      priority: t.priority,
      taskType: t.taskType,
      projectId: copy.id,
      sectionId: t.sectionId ? sectionIdMap.get(t.sectionId) ?? null : null,
    });
  }

  return copy.id;
}
