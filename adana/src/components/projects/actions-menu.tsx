"use client";

import * as React from "react";
import {
  Pencil,
  ShieldCheck,
  Palette,
  Link as LinkIcon,
  Copy,
  FileText,
  FolderPlus,
  Upload,
  Download,
  Archive,
  Trash2,
  Printer,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from "@/components/ui/dropdown";

export type ActionsMenuKey =
  | "edit"
  | "permissions"
  | "color-icon"
  | "copy-link"
  | "duplicate"
  | "save-template"
  | "add-portfolio"
  | "import-csv"
  | "export-tasks-csv"
  | "export-tasks-xlsx"
  | "export-time-csv"
  | "export-json"
  | "print"
  | "archive"
  | "delete";

interface ActionsMenuProps {
  trigger: React.ReactNode;
  archived: boolean;
  isTemplate: boolean;
  portfolios: { id: string; name: string; color?: string | null }[];
  onSelect: (key: ActionsMenuKey, payload?: { portfolioId?: string }) => void;
}

/**
 * Project chevron actions menu.
 *
 * Verbatim items (per spec):
 *  - Edit project settings
 *  - Manage project permissions       (stub modal — no permission writes)
 *  - Set color & icon ▶                (opens ColorIconPicker)
 *  - Copy project link
 *  - Duplicate
 *  - Save as template
 *  - Add to portfolio                 (uses store)
 *  - Import ▶  (Any file disabled / CSV / Email disabled)
 *  - Export or sync ▶                 (CSV / XLSX / Time CSV / JSON / disabled syncs / Print)
 *  - Archive
 *  - Delete project                   (red, confirm)
 */
export function ActionsMenu({
  trigger,
  archived,
  isTemplate,
  portfolios,
  onSelect,
}: ActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownTrigger asChild>{trigger}</DropdownTrigger>
      <DropdownContent align="start" className="min-w-[260px]">
        <DropdownItem onSelect={() => onSelect("edit")}>
          <Pencil className="h-4 w-4" />
          Edit project settings
        </DropdownItem>
        <DropdownItem onSelect={() => onSelect("permissions")}>
          <ShieldCheck className="h-4 w-4" />
          Manage project permissions
        </DropdownItem>
        <DropdownItem onSelect={() => onSelect("color-icon")}>
          <Palette className="h-4 w-4" />
          Set color &amp; icon
          <ChevronRight className="ml-auto h-3.5 w-3.5 text-gray-400" />
        </DropdownItem>
        <DropdownItem onSelect={() => onSelect("copy-link")}>
          <LinkIcon className="h-4 w-4" />
          Copy project link
        </DropdownItem>
        <DropdownItem onSelect={() => onSelect("duplicate")}>
          <Copy className="h-4 w-4" />
          Duplicate
        </DropdownItem>
        <DropdownItem onSelect={() => onSelect("save-template")}>
          <FileText className="h-4 w-4" />
          {isTemplate ? "Remove from templates" : "Save as template"}
        </DropdownItem>

        <DropdownSeparator />

        {portfolios.length > 0 ? (
          <>
            <DropdownLabel>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <FolderPlus className="h-3.5 w-3.5" />
                Add to portfolio
              </span>
            </DropdownLabel>
            {portfolios.map((pf) => (
              <DropdownItem
                key={pf.id}
                onSelect={() => onSelect("add-portfolio", { portfolioId: pf.id })}
              >
                <span
                  className="h-2.5 w-2.5 rounded"
                  style={{ backgroundColor: pf.color || "#4c6ef5" }}
                />
                {pf.name}
              </DropdownItem>
            ))}
          </>
        ) : (
          <DropdownItem disabled>
            <FolderPlus className="h-4 w-4" />
            <span className="text-gray-400">Add to portfolio (none)</span>
          </DropdownItem>
        )}

        <DropdownSeparator />

        {/* Import */}
        <DropdownLabel>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Upload className="h-3.5 w-3.5" />
            Import
          </span>
        </DropdownLabel>
        <DropdownItem disabled>
          <span className="text-gray-400">Any file (coming soon)</span>
        </DropdownItem>
        <DropdownItem onSelect={() => onSelect("import-csv")}>
          CSV
        </DropdownItem>
        <DropdownItem disabled>
          <span className="text-gray-400">Email (coming soon)</span>
        </DropdownItem>

        <DropdownSeparator />

        {/* Export or sync */}
        <DropdownLabel>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Download className="h-3.5 w-3.5" />
            Export or sync
          </span>
        </DropdownLabel>
        <DropdownItem onSelect={() => onSelect("export-tasks-csv")}>
          Project tasks (CSV)
        </DropdownItem>
        <DropdownItem onSelect={() => onSelect("export-tasks-xlsx")}>
          Project tasks (XLSX)
        </DropdownItem>
        <DropdownItem onSelect={() => onSelect("export-time-csv")}>
          Time entries (CSV)
        </DropdownItem>
        <DropdownItem onSelect={() => onSelect("export-json")}>
          JSON
        </DropdownItem>
        <DropdownItem disabled>
          <span className="text-gray-400">Sync to Google Sheets (coming soon)</span>
        </DropdownItem>
        <DropdownItem disabled>
          <span className="text-gray-400">Sync to Outlook (coming soon)</span>
        </DropdownItem>
        <DropdownItem disabled>
          <span className="text-gray-400">Sync to Google Calendar (coming soon)</span>
        </DropdownItem>
        <DropdownItem disabled>
          <span className="text-gray-400">Sync to iCal (coming soon)</span>
        </DropdownItem>
        <DropdownItem disabled>
          <span className="text-gray-400">Sync to Slack (coming soon)</span>
        </DropdownItem>
        <DropdownItem onSelect={() => onSelect("print")}>
          <Printer className="h-4 w-4" />
          Print
        </DropdownItem>

        <DropdownSeparator />

        <DropdownItem onSelect={() => onSelect("archive")}>
          <Archive className="h-4 w-4" />
          {archived ? "Unarchive" : "Archive"}
        </DropdownItem>
        <DropdownItem destructive onSelect={() => onSelect("delete")}>
          <Trash2 className="h-4 w-4" />
          Delete project
        </DropdownItem>
      </DropdownContent>
    </DropdownMenu>
  );
}

export default ActionsMenu;
