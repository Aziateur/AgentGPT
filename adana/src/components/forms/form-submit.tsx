"use client";

import * as React from "react";
import { CheckCircle2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormFieldType } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormFieldDef {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  description: string | null;
  options: string[] | null;
}

interface FormDefinition {
  id: string;
  name: string;
  description: string | null;
  fields: FormFieldDef[];
}

// ---------------------------------------------------------------------------
// Mock form definition
// ---------------------------------------------------------------------------

const mockForm: FormDefinition = {
  id: "form-1",
  name: "Bug Report",
  description:
    "Use this form to report bugs. Please provide as much detail as possible.",
  fields: [
    {
      id: "f1",
      label: "Summary",
      type: "text",
      required: true,
      description: "A brief summary of the issue",
      options: null,
    },
    {
      id: "f2",
      label: "Steps to Reproduce",
      type: "paragraph",
      required: true,
      description: "Detailed steps to reproduce the bug",
      options: null,
    },
    {
      id: "f3",
      label: "Severity",
      type: "single_select",
      required: true,
      description: null,
      options: ["Low", "Medium", "High", "Critical"],
    },
    {
      id: "f4",
      label: "When did you first notice it?",
      type: "date",
      required: false,
      description: null,
      options: null,
    },
    {
      id: "f5",
      label: "Affected Users (estimate)",
      type: "number",
      required: false,
      description: "Approximate number of affected users",
      options: null,
    },
  ],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FormSubmit({ form = mockForm }: { form?: FormDefinition }) {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [errors, setErrors] = React.useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const handleChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: false }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required
    const newErrors: Record<string, boolean> = {};
    let hasError = false;
    form.fields.forEach((field) => {
      if (field.required && !values[field.id]?.trim()) {
        newErrors[field.id] = true;
        hasError = true;
      }
    });
    if (hasError) {
      setErrors(newErrors);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Thank you!
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Your submission has been received. We&apos;ll get back to you soon.
          </p>
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
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-5">
          <h1 className="text-xl font-semibold text-gray-900">{form.name}</h1>
          {form.description && (
            <p className="mt-1 text-sm text-gray-500">{form.description}</p>
          )}
        </div>

        {/* Fields */}
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {form.fields.map((field) => (
            <div key={field.id}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && (
                  <span className="ml-0.5 text-red-500">*</span>
                )}
              </label>
              {field.description && (
                <p className="mb-1.5 text-xs text-gray-500">
                  {field.description}
                </p>
              )}

              {field.type === "text" && (
                <input
                  value={values[field.id] ?? ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className={cn(
                    "h-9 w-full rounded-lg border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
                    errors[field.id]
                      ? "border-red-500"
                      : "border-gray-300"
                  )}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                />
              )}

              {field.type === "paragraph" && (
                <textarea
                  rows={4}
                  value={values[field.id] ?? ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
                    errors[field.id]
                      ? "border-red-500"
                      : "border-gray-300"
                  )}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                />
              )}

              {field.type === "number" && (
                <input
                  type="number"
                  value={values[field.id] ?? ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className={cn(
                    "h-9 w-full rounded-lg border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
                    errors[field.id]
                      ? "border-red-500"
                      : "border-gray-300"
                  )}
                  placeholder="0"
                />
              )}

              {field.type === "date" && (
                <input
                  type="date"
                  value={values[field.id] ?? ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className={cn(
                    "h-9 w-full rounded-lg border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
                    errors[field.id]
                      ? "border-red-500"
                      : "border-gray-300"
                  )}
                />
              )}

              {field.type === "single_select" && (
                <select
                  value={values[field.id] ?? ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className={cn(
                    "h-9 w-full rounded-lg border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
                    errors[field.id]
                      ? "border-red-500"
                      : "border-gray-300",
                    !values[field.id] && "text-gray-400"
                  )}
                >
                  <option value="">Select an option...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {field.type === "multi_select" && (
                <div className="space-y-1.5">
                  {field.options?.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={(values[field.id] ?? "")
                          .split(",")
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
          ))}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            icon={<Send className="h-4 w-4" />}
          >
            Submit
          </Button>
        </form>
      </div>
    </div>
  );
}
