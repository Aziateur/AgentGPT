"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { FormSubmit } from "@/components/forms/form-submit";

interface FormRow {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  owner_id?: string | null;
  public_slug: string | null;
  enabled: boolean;
  settings: Record<string, unknown> | null;
}

interface FieldRow {
  id: string;
  form_id: string;
  label: string;
  field_type: string;
  options: Record<string, unknown> | null;
  required: boolean;
  position: number;
}

export default function PublicFormPage() {
  const [form, setForm] = React.useState<FormRow | null>(null);
  const [fields, setFields] = React.useState<FieldRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    if (!slug) {
      setError("Missing form link.");
      setLoading(false);
      return;
    }
    (async () => {
      const { data: f, error: fe } = await supabase
        .from("forms")
        .select("*")
        .eq("public_slug", slug)
        .maybeSingle();
      if (fe || !f) {
        setError("Form not found.");
        setLoading(false);
        return;
      }
      if (!f.enabled) {
        setError("This form is not accepting submissions.");
        setLoading(false);
        return;
      }
      const { data: ff } = await supabase
        .from("form_fields")
        .select("*")
        .eq("form_id", f.id)
        .order("position");
      setForm(f as FormRow);
      setFields((ff ?? []) as FieldRow[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-sm rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-base font-semibold text-gray-900">
            Form unavailable
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {error ?? "Something went wrong."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4">
      <FormSubmit form={form} fields={fields} />
    </div>
  );
}
