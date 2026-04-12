"use client";

import * as React from "react";
import { CheckCircle2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PublicForm {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  owner_id?: string | null;
  public_slug: string | null;
  enabled: boolean;
  settings: Record<string, unknown> | null;
}

interface PublicFormField {
  id: string;
  form_id: string;
  label: string;
  field_type: string;
  options: Record<string, unknown> | null;
  required: boolean;
  position: number;
}

interface FormSubmitProps {
  form: PublicForm;
  fields: PublicFormField[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getChoices(field: PublicFormField): string[] {
  const arr = field.options?.choices;
  return Array.isArray(arr) ? (arr as string[]) : [];
}

function evalShowIf(
  field: PublicFormField,
  answers: Record<string, string>
): boolean {
  const showIf = field.options?.showIf as
    | { fieldId?: string; operator?: string; value?: string }
    | undefined;
  if (!showIf?.fieldId) return true;
  const actual = answers[showIf.fieldId] ?? "";
  const expected = showIf.value ?? "";
  switch (showIf.operator) {
    case "neq":
      return actual !== expected;
    case "contains":
      return actual.includes(expected);
    case "eq":
    default:
      return actual === expected;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FormSubmit({ form, fields }: FormSubmitProps) {
  const sorted = React.useMemo(
    () => [...fields].sort((a, b) => a.position - b.position),
    [fields]
  );

  const [values, setValues] = React.useState<Record<string, string>>({});
  const [errors, setErrors] = React.useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const visibleFields = React.useMemo(
    () => sorted.filter((f) => evalShowIf(f, values)),
    [sorted, values]
  );

  const handleChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: false }));
  };

  const thankYou =
    (form.settings?.thankYouMessage as string | undefined) ||
    "Thanks! Your submission has been received.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    let hasError = false;
    visibleFields.forEach((field) => {
      if (field.required && !(values[field.id] ?? "").trim()) {
        newErrors[field.id] = true;
        hasError = true;
      }
    });
    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const payload: Record<string, string> = {};
    visibleFields.forEach((f) => {
      payload[f.id] = values[f.id] ?? "";
    });

    try {
      const nowIso = new Date().toISOString();
      const subId = crypto.randomUUID();
      const { error: subErr } = await supabase
        .from("form_submissions")
        .insert({
          id: subId,
          form_id: form.id,
          payload,
          submitted_at: nowIso,
        });
      if (subErr) throw subErr;

      // Derive task title from the first text field
      let title = "";
      const firstText = visibleFields.find(
        (f) => f.field_type === "text" || f.field_type === "paragraph"
      );
      if (firstText) title = (values[firstText.id] ?? "").trim();
      if (!title) title = `${form.title} submission`;

      // Build a simple markdown description from all answers
      const descLines: string[] = [];
      for (const f of visibleFields) {
        const v = values[f.id];
        if (v == null || v === "") continue;
        descLines.push(`**${f.label}**: ${v}`);
      }

      const taskId = crypto.randomUUID();
      const { error: taskErr } = await supabase.from("tasks").insert({
        id: taskId,
        title,
        description: descLines.join("\n\n") || null,
        project_id: form.project_id,
        creator_id: form.owner_id ?? "",
        position: 0,
        task_type: "task",
        created_at: nowIso,
        updated_at: nowIso,
      });
      if (taskErr) {
        // Submission was recorded; task creation failed (often missing creator_id FK).
        // Still show thank-you so the submitter isn't blocked.
        console.warn("Task creation failed:", taskErr.message);
      } else {
        // Link the task to the submission
        await supabase
          .from("form_submissions")
          .update({ task_id: taskId })
          .eq("id", subId);
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Submission failed. Try again.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Thank you!</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">{thankYou}</p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setSubmitted(false);
              setValues({});
              setErrors({});
            }}
          >
            Submit another response
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h1 className="text-xl font-semibold text-gray-900">{form.title}</h1>
          {form.description && (
            <p className="mt-1 text-sm text-gray-500">{form.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {visibleFields.map((field) => {
            const choices = getChoices(field);
            return (
              <div key={field.id}>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && (
                    <span className="ml-0.5 text-red-500">*</span>
                  )}
                </label>

                {field.field_type === "text" && (
                  <input
                    value={values[field.id] ?? ""}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={cn(
                      "h-9 w-full rounded-lg border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
                      errors[field.id] ? "border-red-500" : "border-gray-300"
                    )}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                  />
                )}

                {field.field_type === "paragraph" && (
                  <textarea
                    rows={4}
                    value={values[field.id] ?? ""}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
                      errors[field.id] ? "border-red-500" : "border-gray-300"
                    )}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                  />
                )}

                {field.field_type === "number" && (
                  <input
                    type="number"
                    value={values[field.id] ?? ""}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={cn(
                      "h-9 w-full rounded-lg border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
                      errors[field.id] ? "border-red-500" : "border-gray-300"
                    )}
                    placeholder="0"
                  />
                )}

                {field.field_type === "date" && (
                  <input
                    type="date"
                    value={values[field.id] ?? ""}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={cn(
                      "h-9 w-full rounded-lg border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
                      errors[field.id] ? "border-red-500" : "border-gray-300"
                    )}
                  />
                )}

                {field.field_type === "single_select" && (
                  <select
                    value={values[field.id] ?? ""}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={cn(
                      "h-9 w-full rounded-lg border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
                      errors[field.id] ? "border-red-500" : "border-gray-300",
                      !values[field.id] && "text-gray-400"
                    )}
                  >
                    <option value="">Select an option...</option>
                    {choices.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {field.field_type === "multi_select" && (
                  <div className="space-y-1.5">
                    {choices.map((opt) => (
                      <label
                        key={opt}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={(values[field.id] ?? "")
                            .split(",")
                            .filter(Boolean)
                            .includes(opt)}
                          onChange={(e) => {
                            const current = (values[field.id] ?? "")
                              .split(",")
                              .filter(Boolean);
                            const next = e.target.checked
                              ? [...current, opt]
                              : current.filter((v) => v !== opt);
                            handleChange(field.id, next.join(","));
                          }}
                          className="rounded border-gray-300"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {errors[field.id] && (
                  <p className="mt-1 text-xs text-red-600">
                    This field is required.
                  </p>
                )}
              </div>
            );
          })}

          {submitError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={submitting}
            icon={<Send className="h-4 w-4" />}
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </div>
    </div>
  );
}
