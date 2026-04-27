"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  Pencil,
  Palette,
  Link as LinkIcon,
  Copy,
  FileText,
  FolderPlus,
  Upload,
  Download,
  Archive,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { Project } from "@/types";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { duplicateProject } from "@/lib/duplicate-project";
import { StatusPill } from "@/components/projects/status-pill";
import { StatusUpdateEditor } from "@/components/projects/status-update-editor";
import { ColorIconPicker } from "@/components/projects/color-icon-picker";
import { MembersRow } from "@/components/projects/members-row";
import { ShareDialog } from "@/components/projects/share-dialog";
import { AddTabDialog } from "@/components/projects/add-tab-dialog";

const COLOR_SWATCHES = [
  "#4f46e5",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#64748b",
];

const ICON_NAMES = [
  "folder",
  "briefcase",
  "star",
  "rocket",
  "flag",
  "target",
  "zap",
  "heart",
  "bookmark",
  "box",
  "layers",
  "compass",
];

export default function ProjectLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams?.get("id") as string;
  const {
    projects,
    portfoliosExt,
    portfolioProjects,
    updateProject,
    deleteProject,
    createTask,
    getProjectTasks,
    getProjectSections,
    addProjectToPortfolio,
  } = useAppStore();

  const project = projects.find((p) => p.id === id);

  // Inline name editing
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [colorIconOpen, setColorIconOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusEditorOpen, setStatusEditorOpen] = useState(false);
  const [statusEditorStatus, setStatusEditorStatus] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [addTabOpen, setAddTabOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // Edit form fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("#4f46e5");
  const [formIcon, setFormIcon] = useState("folder");
  const [formStartDate, setFormStartDate] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formVisibility, setFormVisibility] = useState("public");

  // CSV input ref
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!project) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-6 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Project</h2>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    );
  }

  const projectName = project.name;
  const projectColor = project.color ?? "#4f46e5";
  const archived = Boolean(project.archived);
  const isTemplate = Boolean((project as Record<string, unknown>).isTemplate);

  // Parent portfolios
  const parentPortfolios = portfoliosExt.filter((pf) =>
    portfolioProjects.some(
      (link) => link.portfolioId === pf.id && link.projectId === project.id
    )
  );

  function openEditModal() {
    setFormName(project!.name ?? "");
    setFormDescription((project!.description as string) ?? "");
    setFormColor(project!.color ?? "#4f46e5");
    setFormIcon(project!.icon ?? "folder");
    setFormStartDate(((project as Record<string, unknown>).startDate as string) ?? "");
    setFormDueDate(((project as Record<string, unknown>).dueDate as string) ?? "");
    setFormVisibility(
      ((project as Record<string, unknown>).privacy as string) ?? "public"
    );
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    await updateProject(project!.id, {
      name: formName,
      description: formDescription || null,
      color: formColor,
      icon: formIcon,
      startDate: formStartDate || null,
      dueDate: formDueDate || null,
      privacy: formVisibility,
    } as Partial<Project>);
    setEditOpen(false);
    setToast("Project updated");
  }

  async function handleSaveColorIcon() {
    await updateProject(project!.id, {
      color: formColor,
      icon: formIcon,
    });
    setColorIconOpen(false);
    setToast("Color & icon updated");
  }

  function openColorIconModal() {
    setFormColor(project!.color ?? "#4f46e5");
    setFormIcon(project!.icon ?? "folder");
    setColorIconOpen(true);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast("Link copied");
    } catch {
      setToast("Copy failed");
    }
  }

  async function handleDuplicate() {
    const newId = await duplicateProject(project!.id);
    if (newId) {
      setToast("Project duplicated");
      router.push(`/project?id=${newId}`);
    }
  }

  async function handleSaveAsTemplate() {
    await updateProject(project!.id, {
      isTemplate: !isTemplate,
    } as Partial<Project>);
    setToast(isTemplate ? "Removed from templates" : "Saved as template");
  }

  async function handleAddToPortfolio(portfolioId: string) {
    await addProjectToPortfolio(portfolioId, project!.id);
    setToast("Added to portfolio");
  }

  async function handleExportCSV() {
    const tasks = getProjectTasks(project!.id);
    const sections = getProjectSections(project!.id);
    const sectionMap = new Map(sections.map((s) => [s.id, s.name]));
    const header = [
      "title",
      "description",
      "priority",
      "taskType",
      "dueDate",
      "section",
      "completed",
    ];
    const rows = tasks.map((t) =>
      [
        t.title,
        t.description ?? "",
        t.priority ?? "",
        t.taskType ?? "",
        t.dueDate ?? "",
        t.sectionId ? sectionMap.get(t.sectionId) ?? "" : "",
        t.completed ? "true" : "false",
      ]
        .map((v) => String(v).replace(/[\r\n,]/g, " "))
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project!.name || "project"}-tasks.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast("Exported CSV");
  }

  function triggerImportCSV() {
    csvInputRef.current?.click();
  }

  async function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setToast("CSV is empty");
      e.target.value = "";
      return;
    }
    const header = lines[0].split(",").map((h) => h.trim());
    const titleIdx = header.findIndex((h) => h.toLowerCase() === "title");
    const descIdx = header.findIndex((h) => h.toLowerCase() === "description");
    const prioIdx = header.findIndex((h) => h.toLowerCase() === "priority");
    const dueIdx = header.findIndex((h) => h.toLowerCase() === "duedate");
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const title = (titleIdx >= 0 ? cols[titleIdx] : cols[0]) ?? "";
      if (!title.trim()) continue;
      await createTask({
        title: title.trim(),
        description: descIdx >= 0 ? cols[descIdx]?.trim() || null : null,
        priority: prioIdx >= 0 ? cols[prioIdx]?.trim() || null : null,
        dueDate: dueIdx >= 0 ? cols[dueIdx]?.trim() || null : null,
        projectId: project!.id,
      });
      count++;
    }
    e.target.value = "";
    setToast(`Imported ${count} task${count !== 1 ? "s" : ""}`);
  }

  async function handleArchiveToggle() {
    await updateProject(project!.id, { archived: !archived });
    setToast(archived ? "Project unarchived" : "Project archived");
  }

  async function handleDelete() {
    await deleteProject(project!.id);
    setDeleteOpen(false);
    router.push("/projects");
  }

  function startEditName() {
    setNameDraft(project!.name);
    setEditingName(true);
  }

  async function commitName() {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== project!.name) {
      await updateProject(project!.id, { name: trimmed });
    }
    setEditingName(false);
  }

  function cancelEditName() {
    setEditingName(false);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Hidden CSV input */}
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImportCSV}
      />

      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        {/* Portfolio breadcrumb */}
        {parentPortfolios.length > 0 && (
          <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
            {parentPortfolios.map((pf, idx) => (
              <React.Fragment key={pf.id}>
                {idx > 0 && <span className="text-gray-300">,</span>}
                <Link
                  href="/portfolios"
                  className="inline-flex items-center gap-1 hover:text-indigo-600 hover:underline"
                >
                  <span
                    className="h-2 w-2 rounded"
                    style={{ backgroundColor: pf.color || "#4c6ef5" }}
                  />
                  {pf.name}
                </Link>
              </React.Fragment>
            ))}
            <ChevronRight className="h-3 w-3 text-gray-300" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded"
            style={{ backgroundColor: projectColor }}
          />

          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                else if (e.key === "Escape") cancelEditName();
              }}
              className="min-w-0 rounded border border-indigo-400 bg-white px-2 py-0.5 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <button
              type="button"
              onClick={startEditName}
              className="rounded px-1 text-sm font-semibold text-gray-900 hover:bg-gray-100"
              title="Click to rename"
            >
              {projectName}
            </button>
          )}

          {archived && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
              Archived
            </span>
          )}
          {isTemplate && (
            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
              Template
            </span>
          )}

          <DropdownMenu>
            <DropdownTrigger asChild>
              <button
                type="button"
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Project menu"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownTrigger>
            <DropdownContent align="start" className="min-w-[220px]">
              <DropdownItem onSelect={() => openEditModal()}>
                <Pencil className="h-4 w-4" />
                Edit project settings
              </DropdownItem>
              <DropdownItem onSelect={() => openColorIconModal()}>
                <Palette className="h-4 w-4" />
                Set color & icon
              </DropdownItem>
              <DropdownItem onSelect={() => handleCopyLink()}>
                <LinkIcon className="h-4 w-4" />
                Copy project link
              </DropdownItem>
              <DropdownItem onSelect={() => handleDuplicate()}>
                <Copy className="h-4 w-4" />
                Duplicate project
              </DropdownItem>
              <DropdownItem onSelect={() => handleSaveAsTemplate()}>
                <FileText className="h-4 w-4" />
                {isTemplate ? "Remove from templates" : "Save as template"}
              </DropdownItem>
              <DropdownSeparator />
              {portfoliosExt.length > 0 && (
                <>
                  <DropdownLabel>
                    <span className="inline-flex items-center gap-2">
                      <FolderPlus className="h-3.5 w-3.5" />
                      Add to portfolio
                    </span>
                  </DropdownLabel>
                  {portfoliosExt.map((pf) => (
                    <DropdownItem
                      key={pf.id}
                      onSelect={() => handleAddToPortfolio(pf.id)}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded"
                        style={{ backgroundColor: pf.color || "#4c6ef5" }}
                      />
                      {pf.name}
                    </DropdownItem>
                  ))}
                  <DropdownSeparator />
                </>
              )}
              <DropdownItem onSelect={() => triggerImportCSV()}>
                <Upload className="h-4 w-4" />
                Import CSV
              </DropdownItem>
              <DropdownItem onSelect={() => handleExportCSV()}>
                <Download className="h-4 w-4" />
                Export CSV
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem onSelect={() => handleArchiveToggle()}>
                <Archive className="h-4 w-4" />
                {archived ? "Unarchive" : "Archive"} project
              </DropdownItem>
              <DropdownItem
                destructive
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete project
              </DropdownItem>
            </DropdownContent>
          </DropdownMenu>

          <StatusPill
            status={(project.status as string) ?? "on_track"}
            onSelect={(s) => {
              setStatusEditorStatus(s);
              setStatusEditorOpen(true);
            }}
          />

          <div className="ml-auto flex items-center gap-2">
            <MembersRow projectId={project.id} />
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Share
            </button>
          </div>
        </div>

        {/* Tabs row */}
        <div className="mt-2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAddTabOpen(true)}
            className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            + Add tab
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">{children}</div>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Edit settings modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit project settings"
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormColor(c)}
                  className={
                    "h-7 w-7 rounded-md border-2 transition " +
                    (formColor === c
                      ? "border-gray-900"
                      : "border-transparent hover:border-gray-300")
                  }
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_NAMES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFormIcon(n)}
                  className={
                    "rounded-md border px-2 py-1 text-xs transition " +
                    (formIcon === n
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50")
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start date"
              type="date"
              value={formStartDate ? formStartDate.slice(0, 10) : ""}
              onChange={(e) => setFormStartDate(e.target.value)}
            />
            <Input
              label="Due date"
              type="date"
              value={formDueDate ? formDueDate.slice(0, 10) : ""}
              onChange={(e) => setFormDueDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Visibility
            </label>
            <select
              value={formVisibility}
              onChange={(e) => setFormVisibility(e.target.value)}
              className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="public">Public to team</option>
              <option value="private">Private</option>
              <option value="workspace">Workspace</option>
            </select>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Color & icon modal */}
      <Modal
        open={colorIconOpen}
        onClose={() => setColorIconOpen(false)}
        title="Set color & icon"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormColor(c)}
                  className={
                    "h-8 w-8 rounded-md border-2 transition " +
                    (formColor === c
                      ? "border-gray-900"
                      : "border-transparent hover:border-gray-300")
                  }
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_NAMES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFormIcon(n)}
                  className={
                    "rounded-md border px-2 py-1 text-xs transition " +
                    (formIcon === n
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50")
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setColorIconOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveColorIcon}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete project?"
        description="This action cannot be undone. All tasks and sections in this project will be permanently deleted."
        size="sm"
      >
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete project
          </Button>
        </div>
      </Modal>

      {statusEditorOpen && (
        <StatusUpdateEditor
          open={statusEditorOpen}
          project={project}
          initialStatus={(statusEditorStatus ?? "on_track") as any}
          onClose={() => setStatusEditorOpen(false)}
        />
      )}
      {shareOpen && (
        <ShareDialog
          open={shareOpen}
          projectId={project.id}
          onClose={() => setShareOpen(false)}
        />
      )}
      {addTabOpen && (
        <AddTabDialog
          open={addTabOpen}
          projectId={project.id}
          onClose={() => setAddTabOpen(false)}
        />
      )}
    </div>
  );
}
