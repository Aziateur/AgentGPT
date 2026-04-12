"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, Trash2, FileText, Image as ImageIcon, File as FileIcon, Paperclip } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { AttachmentFile } from "@/types";

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
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

type FileCategory = "all" | "images" | "docs" | "other";

function classify(att: AttachmentFile): Exclude<FileCategory, "all"> {
  const mime = (att.mimeType ?? "").toLowerCase();
  const name = att.filename.toLowerCase();
  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|bmp)$/.test(name)) return "images";
  if (
    mime.startsWith("text/") ||
    mime.includes("pdf") ||
    mime.includes("word") ||
    mime.includes("excel") ||
    mime.includes("sheet") ||
    mime.includes("presentation") ||
    mime === "application/json" ||
    /\.(pdf|docx?|xlsx?|pptx?|csv|md|txt|rtf)$/.test(name)
  ) {
    return "docs";
  }
  return "other";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FilesViewClient() {
  const searchParams = useSearchParams();
  const projectId = (searchParams?.get("id") as string) ?? "";

  const attachments = useAppStore((s) => s.attachments);
  const tasks = useAppStore((s) => s.tasks);
  const users = useAppStore((s) => s.users);
  const deleteAttachment = useAppStore((s) => s.deleteAttachment);

  const [filter, setFilter] = useState<FileCategory>("all");

  const projectTaskIds = useMemo(
    () => new Set(tasks.filter((t) => t.projectId === projectId).map((t) => t.id)),
    [tasks, projectId],
  );

  const projectAttachments = useMemo(
    () =>
      attachments.filter((a) => {
        if (a.projectId === projectId) return true;
        if (a.taskId && projectTaskIds.has(a.taskId)) return true;
        return false;
      }),
    [attachments, projectTaskIds, projectId],
  );

  const categorized = useMemo(() => {
    const buckets = { images: [] as AttachmentFile[], docs: [] as AttachmentFile[], other: [] as AttachmentFile[] };
    for (const a of projectAttachments) {
      buckets[classify(a)].push(a);
    }
    return buckets;
  }, [projectAttachments]);

  const visible =
    filter === "all"
      ? projectAttachments
      : categorized[filter];

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this file?")) return;
    await deleteAttachment(id);
  }

  const TABS: { key: FileCategory; label: string; count: number }[] = [
    { key: "all", label: "All", count: projectAttachments.length },
    { key: "images", label: "Images", count: categorized.images.length },
    { key: "docs", label: "Documents", count: categorized.docs.length },
    { key: "other", label: "Other", count: categorized.other.length },
  ];

  return (
    <div className="flex h-full flex-col">
      <ViewNav projectId={projectId} active="files" />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Files</h2>
            <span className="text-sm text-gray-500">
              {projectAttachments.length} file{projectAttachments.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Category tabs */}
          <div className="mb-4 flex gap-2 border-b border-gray-200">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`relative px-3 py-2 text-sm font-medium transition ${
                  filter === t.key ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}{" "}
                <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                  {t.count}
                </span>
                {filter === t.key && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-indigo-600" />
                )}
              </button>
            ))}
          </div>

          {/* List */}
          {visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
              <Paperclip className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">
                No files attached to this project yet.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
                  <tr>
                    <th className="px-4 py-2.5">File</th>
                    <th className="px-4 py-2.5">Size</th>
                    <th className="px-4 py-2.5">Uploaded by</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Task</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((a) => {
                    const cat = classify(a);
                    const uploader = a.uploaderId ? userById.get(a.uploaderId) : null;
                    const task = a.taskId ? taskById.get(a.taskId) : null;
                    return (
                      <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {cat === "images" && a.publicUrl ? (
                              // Small image thumbnail
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={a.publicUrl}
                                alt={a.filename}
                                className="h-10 w-10 shrink-0 rounded border border-gray-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-100 text-gray-500">
                                {cat === "images" ? (
                                  <ImageIcon className="h-5 w-5" />
                                ) : cat === "docs" ? (
                                  <FileText className="h-5 w-5" />
                                ) : (
                                  <FileIcon className="h-5 w-5" />
                                )}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="truncate font-medium text-gray-900">{a.filename}</div>
                              <div className="truncate text-xs text-gray-500">
                                {a.mimeType ?? "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatBytes(a.sizeBytes)}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {uploader ? uploader.name : "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(a.createdAt)}</td>
                        <td className="px-4 py-3">
                          {task ? (
                            <span
                              className="truncate text-indigo-600 hover:underline"
                              title={task.title}
                            >
                              {task.title}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {a.publicUrl && (
                              <a
                                href={a.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={a.filename}
                                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Download
                              </a>
                            )}
                            <button
                              onClick={() => handleDelete(a.id)}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
