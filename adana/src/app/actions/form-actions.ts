"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth-actions";

export async function getForms(projectId: string) {
  try {
    return prisma.form.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { fields: true, submissions: true } },
      },
    });
  } catch (error) {
    return [];
  }
}

export async function getForm(id: string) {
  try {
    return prisma.form.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { position: "asc" },
        },
        project: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
    });
  } catch (error) {
    return null;
  }
}

export async function createForm(data: {
  name: string;
  description?: string;
  projectId: string;
}) {
  try {
    const form = await prisma.form.create({
      data: {
        name: data.name,
        description: data.description,
        projectId: data.projectId,
      },
    });

    revalidatePath(`/projects/${data.projectId}`);
    return { form };
  } catch (error) {
    return { error: "Failed to create form" };
  }
}

export async function updateForm(
  id: string,
  data: {
    name?: string;
    description?: string;
    active?: boolean;
  }
) {
  try {
    const form = await prisma.form.update({
      where: { id },
      data,
    });

    revalidatePath(`/projects/${form.projectId}`);
    return { form };
  } catch (error) {
    return { error: "Failed to update form" };
  }
}

export async function addFormField(
  formId: string,
  data: {
    label: string;
    fieldType: string;
    required?: boolean;
    options?: string[];
  }
) {
  try {
    const lastField = await prisma.formField.findFirst({
      where: { formId },
      orderBy: { position: "desc" },
    });

    const field = await prisma.formField.create({
      data: {
        label: data.label,
        fieldType: data.fieldType,
        required: data.required || false,
        options: data.options ? JSON.stringify(data.options) : null,
        position: (lastField?.position ?? -1) + 1,
        formId,
      },
    });

    return { field };
  } catch (error) {
    return { error: "Failed to add form field" };
  }
}

export async function submitForm(
  formId: string,
  data: Record<string, unknown>
) {
  try {
    const user = await getCurrentUser();

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        fields: { orderBy: { position: "asc" } },
        project: { select: { id: true } },
      },
    });

    if (!form) return { error: "Form not found" };
    if (!form.active) return { error: "Form is not accepting submissions" };

    // Validate required fields
    for (const field of form.fields) {
      if (field.required && !data[field.id]) {
        return { error: `Field "${field.label}" is required` };
      }
    }

    // Create submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId,
        userId: user?.id,
        data: JSON.stringify(data),
      },
    });

    // Create a task from the submission
    const titleField = form.fields[0];
    const taskTitle = titleField ? String(data[titleField.id] || form.name) : form.name;

    const descParts: string[] = [];
    for (const field of form.fields) {
      if (data[field.id] !== undefined && data[field.id] !== null) {
        descParts.push(`**${field.label}:** ${data[field.id]}`);
      }
    }

    const lastTask = await prisma.task.findFirst({
      where: { projectId: form.project.id },
      orderBy: { position: "desc" },
    });

    const task = await prisma.task.create({
      data: {
        title: taskTitle,
        description: descParts.join("\n"),
        projectId: form.project.id,
        creatorId: user?.id || (await getOrCreateSystemUser()),
        position: (lastTask?.position ?? -1) + 1,
      },
    });

    revalidatePath(`/projects/${form.project.id}`);
    return { submission, task };
  } catch (error) {
    return { error: "Failed to submit form" };
  }
}

async function getOrCreateSystemUser(): Promise<string> {
  let systemUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (systemUser) return systemUser.id;

  systemUser = await prisma.user.create({
    data: {
      name: "System",
      email: "system@adana.dev",
      password: "system",
    },
  });
  return systemUser.id;
}

export async function getFormSubmissions(formId: string) {
  try {
    const submissions = await prisma.formSubmission.findMany({
      where: { formId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return submissions.map((s: (typeof submissions)[number]) => ({
      ...s,
      data: JSON.parse(s.data),
    }));
  } catch (error) {
    return [];
  }
}
