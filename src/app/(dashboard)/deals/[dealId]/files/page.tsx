"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  FolderOpen,
  FileText,
  FileSpreadsheet,
  Image,
  Upload,
  Search,
  Download,
  MoreVertical,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "xlsx" | "docx" | "png" | "jpg";
  size: string;
  uploadedBy: string;
  date: string;
}

interface FileGroup {
  workstream: string;
  files: FileItem[];
}

const fileIcon: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-red-500" />,
  xlsx: <FileSpreadsheet className="w-5 h-5 text-emerald-500" />,
  docx: <FileText className="w-5 h-5 text-blue-500" />,
  png: <Image className="w-5 h-5 text-purple-500" />,
  jpg: <Image className="w-5 h-5 text-purple-500" />,
};

const mockFileGroups: FileGroup[] = [
  {
    workstream: "Administration",
    files: [
      { id: "1", name: "Articles_of_Incorporation.pdf", type: "pdf", size: "245 KB", uploadedBy: "Owen Richardson", date: "Jan 15, 2026" },
      { id: "2", name: "Operating_Agreement_v3.pdf", type: "pdf", size: "1.2 MB", uploadedBy: "Steve Anderson", date: "Feb 01, 2026" },
      { id: "3", name: "Medicare_License_App.pdf", type: "pdf", size: "890 KB", uploadedBy: "Steve Anderson", date: "Feb 15, 2026" },
      { id: "4", name: "Insurance_Policy_Summary.xlsx", type: "xlsx", size: "156 KB", uploadedBy: "Owen Richardson", date: "Feb 05, 2026" },
    ],
  },
  {
    workstream: "Operations",
    files: [
      { id: "5", name: "Employee_Benefits_Comparison.xlsx", type: "xlsx", size: "340 KB", uploadedBy: "Tim Brooks", date: "Feb 12, 2026" },
      { id: "6", name: "Current_Employee_Handbook.pdf", type: "pdf", size: "2.1 MB", uploadedBy: "Tim Brooks", date: "Jan 20, 2026" },
      { id: "7", name: "Rate_Structure_Analysis.xlsx", type: "xlsx", size: "89 KB", uploadedBy: "Doug Martinez", date: "Feb 18, 2026" },
    ],
  },
  {
    workstream: "Accounting",
    files: [
      { id: "8", name: "Financial_Statements_2024.pdf", type: "pdf", size: "3.4 MB", uploadedBy: "Sarah Chen", date: "Jan 10, 2026" },
      { id: "9", name: "Tax_Returns_2023.pdf", type: "pdf", size: "5.7 MB", uploadedBy: "Sarah Chen", date: "Jan 10, 2026" },
      { id: "10", name: "Accounts_Receivable_Aging.xlsx", type: "xlsx", size: "210 KB", uploadedBy: "Sarah Chen", date: "Feb 03, 2026" },
    ],
  },
  {
    workstream: "Due Diligence",
    files: [
      { id: "11", name: "Building_Exterior_Front.jpg", type: "jpg", size: "4.2 MB", uploadedBy: "James Peterson", date: "Jan 25, 2026" },
      { id: "12", name: "Phase1_Environmental_Report.pdf", type: "pdf", size: "8.9 MB", uploadedBy: "James Peterson", date: "Feb 08, 2026" },
      { id: "13", name: "Property_Appraisal.pdf", type: "pdf", size: "1.8 MB", uploadedBy: "Doug Martinez", date: "Feb 14, 2026" },
    ],
  },
];

export default function FilesPage() {
  const params = useParams();
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (name: string) => {
    const next = new Set(collapsedGroups);
    next.has(name) ? next.delete(name) : next.add(name);
    setCollapsedGroups(next);
  };

  const totalFiles = mockFileGroups.reduce((sum, g) => sum + g.files.length, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
            <FolderOpen className="w-6 h-6 text-primary-500" />
            Files
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {totalFiles} files across {mockFileGroups.length} workstreams
          </p>
        </div>
        <button className="neu-button-primary flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="neu-input pl-10"
        />
      </div>

      {/* File Groups */}
      <div className="space-y-4">
        {mockFileGroups.map((group) => {
          const isCollapsed = collapsedGroups.has(group.workstream);
          const filtered = group.files.filter((f) =>
            !search || f.name.toLowerCase().includes(search.toLowerCase())
          );

          if (search && filtered.length === 0) return null;

          return (
            <div key={group.workstream} className="neu-card p-0 overflow-hidden">
              <button
                onClick={() => toggleGroup(group.workstream)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-900/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-surface-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-surface-400" />
                  )}
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-surface-700 dark:text-surface-200">
                    {group.workstream}
                  </h3>
                </div>
                <span className="text-xs text-surface-400">
                  {filtered.length} file{filtered.length !== 1 ? "s" : ""}
                </span>
              </button>

              {!isCollapsed && (
                <div className="border-t border-surface-200 dark:border-surface-800 divide-y divide-surface-100 dark:divide-surface-800/50">
                  {filtered.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 px-6 py-3 hover:bg-surface-50 dark:hover:bg-surface-900/20 transition-colors"
                    >
                      <div className="shrink-0">{fileIcon[file.type]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-surface-400">
                          {file.uploadedBy} &middot; {file.date}
                        </p>
                      </div>
                      <span className="text-xs text-surface-400 shrink-0">
                        {file.size}
                      </span>
                      <button className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
                        <Download className="w-4 h-4 text-surface-400" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
                        <MoreVertical className="w-4 h-4 text-surface-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
