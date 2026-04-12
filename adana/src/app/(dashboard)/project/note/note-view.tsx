"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// View Nav
// ---------------------------------------------------------------------------

function ViewNav({ projectId, active }: { projectId: string; active: string }) {
  const views = [
    { key: "overview", label: "Overview" },
    { key: "list", label: "List" },
    { key: "board", label: "Board" },
    { key: "timeline", label: "Timeline" },
    { key: "calendar", label: "Calendar" },
    { key: "note", label: "Note" },
    { key: "files", label: "Files" },
    { key: "dashboard", label: "Dashboard" },
  ];
  return (
    <div className="flex gap-1 border-b border-gray-200 bg-white px-6">
      {views.map((v) => (
        <Link
          key={v.key}
          href={`/project/${v.key}?id=${projectId}`}
          className={`relative px-3 py-2.5 text-sm font-medium transition ${
            active === v.key ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {v.label}
          {active === v.key && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-600" />
          )}
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Minimal inline markdown renderer (**bold**, *italic*, # headings, - lists,
// and line breaks). Enough for a lightweight preview without a dependency.
// ---------------------------------------------------------------------------

function renderInline(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let key = 0;
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/;
  while (remaining.length > 0) {
    const match = pattern.exec(remaining);
    if (!match) {
      parts.push(remaining);
      break;
    }
    if (match.index > 0) parts.push(remaining.slice(0, match.index));
    if (match[1] !== undefined) {
      parts.push(<strong key={key++}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<em key={key++}>{match[2]}</em>);
    } else if (match[3] !== undefined) {
      parts.push(
        <code key={key++} className="rounded bg-gray-100 px-1 py-0.5 text-[0.85em] text-pink-600">
          {match[3]}
        </code>,
      );
    }
    remaining = remaining.slice(match.index + match[0].length);
  }
  return parts;
}

function renderMarkdown(md: string): JSX.Element {
  const lines = md.split(/\r?\n/);
  const blocks: JSX.Element[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  function flushList() {
    if (listBuffer.length > 0) {
      blocks.push(
        <ul key={key++} className="list-disc pl-6 space-y-1 my-2 text-gray-800">
          {listBuffer.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      listBuffer = [];
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*-\s+/.test(line)) {
      listBuffer.push(line.replace(/^\s*-\s+/, ""));
      continue;
    }
    flushList();
    if (/^###\s+/.test(line)) {
      blocks.push(
        <h3 key={key++} className="text-base font-semibold text-gray-900 mt-4 mb-1">
          {renderInline(line.replace(/^###\s+/, ""))}
        </h3>,
      );
    } else if (/^##\s+/.test(line)) {
      blocks.push(
        <h2 key={key++} className="text-lg font-semibold text-gray-900 mt-5 mb-2">
          {renderInline(line.replace(/^##\s+/, ""))}
        </h2>,
      );
    } else if (/^#\s+/.test(line)) {
      blocks.push(
        <h1 key={key++} className="text-xl font-bold text-gray-900 mt-6 mb-2">
          {renderInline(line.replace(/^#\s+/, ""))}
        </h1>,
      );
    } else if (line.trim() === "") {
      blocks.push(<div key={key++} className="h-2" />);
    } else {
      blocks.push(
        <p key={key++} className="text-sm text-gray-800 leading-relaxed">
          {renderInline(line)}
        </p>,
      );
    }
  }
  flushList();
  return <div>{blocks}</div>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type SaveState = "idle" | "saving" | "saved";

export default function NoteViewClient() {
  const searchParams = useSearchParams();
  const projectId = (searchParams?.get("id") as string) ?? "";

  const [noteId, setNoteId] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loaded, setLoaded] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load note
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("project_notes")
          .select("*")
          .eq("project_id", projectId)
          .maybeSingle();
        if (cancelled) return;
        if (!error && data) {
          setNoteId(data.id);
          setContent(data.content_md ?? "");
        }
      } catch (err) {
        console.error("Failed to load project note:", err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function handleSave() {
    if (!projectId) return;
    setSaveState("saving");
    const id = noteId ?? crypto.randomUUID();
    try {
      const { error } = await supabase
        .from("project_notes")
        .upsert(
          {
            id,
            project_id: projectId,
            content_md: content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "project_id" },
        );
      if (error) throw error;
      if (!noteId) setNoteId(id);
      setSaveState("saved");
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      console.error("Failed to save project note:", err);
      setSaveState("idle");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ViewNav projectId={projectId} active="note" />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Project Note</h2>
            <div className="flex items-center gap-2 text-xs">
              {saveState === "saving" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              )}
              {saveState === "saved" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-green-700">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              )}
            </div>
          </div>

          <textarea
            disabled={!loaded}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleSave}
            placeholder={
              "# Your project note\n\nUse markdown:\n- **bold**, *italic*, `code`\n- lists like this\n- # / ## / ### headings\n\nSaved automatically on blur."
            }
            className="min-h-[260px] w-full resize-y rounded-xl border border-gray-200 bg-white p-4 font-mono text-sm text-gray-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />

          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-gray-500">Preview</h3>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              {content.trim().length > 0 ? (
                renderMarkdown(content)
              ) : (
                <p className="text-sm italic text-gray-400">
                  Start typing above to see the markdown preview here.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
