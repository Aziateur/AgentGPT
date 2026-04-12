import { useAppStore } from "@/store/app-store";
import { PROJECT_TEMPLATES } from "./project-templates";
import type { Project } from "@/types";

export async function applyProjectTemplate(
  templateId: string,
  projectName: string
): Promise<Project | null> {
  const store = useAppStore.getState();
  const tpl = PROJECT_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return null;

  const project = await store.createProject({
    name: projectName,
    color: tpl.color,
    icon: tpl.icon,
    description: tpl.description,
  });

  // createProject seeds default sections — replace with template sections.
  const existingSections = useAppStore.getState().getProjectSections(project.id);
  for (const s of existingSections) {
    await store.deleteSection(s.id);
  }

  const newSections: { id: string; name: string }[] = [];
  for (let i = 0; i < tpl.sections.length; i++) {
    const s = await store.createSection({
      name: tpl.sections[i],
      projectId: project.id,
    });
    newSections.push({ id: s.id, name: s.name });
  }

  for (const t of tpl.tasks) {
    const target = newSections[t.sectionIdx];
    if (!target) continue;
    await store.createTask({
      title: t.title,
      projectId: project.id,
      sectionId: target.id,
    });
  }

  return project;
}
