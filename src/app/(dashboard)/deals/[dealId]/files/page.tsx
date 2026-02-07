"use client";

import { useState, useMemo } from "react";
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
  File,
  FileArchive,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

function getFileIcon(fileType: string, isPhoto: boolean) {
  if (isPhoto) return <Image className="w-5 h-5 text-purple-500" />;

  const ext = fileType.toLowerCase();
  if (ext === "pdf" || ext === "application/pdf")
    return <FileText className="w-5 h-5 text-red-500" />;
  if (
    ext === "xlsx" ||
    ext === "xls" ||
    ext === "csv" ||
    ext.includes("spreadsheet") ||
    ext.includes("excel")
  )
    return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
  if (
    ext === "docx" ||
    ext === "doc" ||
    ext.includes("word") ||
    ext.includes("document")
  )
    return <FileText className="w-5 h-5 text-blue-500" />;
  if (
    ext === "png" ||
    ext === "jpg" ||
    ext === "jpeg" ||
    ext === "gif" ||
    ext === "webp" ||
    ext.includes("image")
  )
    return <Image className="w-5 h-5 text-purple-500" />;
  if (ext === "zip" || ext === "rar" || ext === "tar" || ext.includes("archive"))
    return <FileArchive className="w-5 h-5 text-amber-500" />;

  return <File className="w-5 h-5 text-surface-400" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function FilesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((group) => (
        <div key={group} className="neu-card p-0 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="border-t border-surface-200 dark:border-surface-800">
            {[1, 2, 3].map((file) => (
              <div
                key={file}
                className="flex items-center gap-4 px-6 py-3 border-b border-surface-100 dark:border-surface-800/50"
              >
                <Skeleton className="w-5 h-5 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-60" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FilesPage() {
  const params = useParams();
  const dealId = params.dealId as string;
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const { data: files, isLoading } = trpc.files.listByDeal.useQuery(
    { dealId, search: search || undefined },
    { enabled: !!dealId }
  );

  const toggleGroup = (name: string) => {
    const next = new Set(collapsedGroups);
    if (next.has(name)) { next.delete(name); } else { next.add(name); }
    setCollapsedGroups(next);
  };

  // Group files by tags (first tag) or "Uncategorized"
  const groupedFiles = useMemo(() => {
    if (!files) return [];

    const groups: Record<string, typeof files> = {};

    for (const file of files) {
      const groupName =
        file.task?.workstream ??
        (file.tags && file.tags.length > 0 ? file.tags[0] : "Uncategorized");
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(file);
    }

    return Object.entries(groups).map(([name, groupFiles]) => ({
      name,
      files: groupFiles,
    }));
  }, [files]);

  const totalFiles = files?.length ?? 0;
  const totalGroups = groupedFiles.length;

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
            {isLoading
              ? "Loading files..."
              : `${totalFiles} file${totalFiles !== 1 ? "s" : ""} across ${totalGroups} ${totalGroups === 1 ? "group" : "groups"}`}
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

      {/* Loading */}
      {isLoading && <FilesSkeleton />}

      {/* Empty */}
      {!isLoading && totalFiles === 0 && (
        <div className="neu-card text-center py-12">
          <FolderOpen className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
          <p className="text-surface-500 dark:text-surface-400">
            {search ? "No files matching your search." : "No files uploaded yet."}
          </p>
        </div>
      )}

      {/* File Groups */}
      {!isLoading && (
        <div className="space-y-4">
          {groupedFiles.map((group) => {
            const isCollapsed = collapsedGroups.has(group.name);

            return (
              <div key={group.name} className="neu-card p-0 overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-surface-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-surface-400" />
                    )}
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-surface-700 dark:text-surface-200">
                      {group.name}
                    </h3>
                  </div>
                  <span className="text-xs text-surface-400">
                    {group.files.length} file{group.files.length !== 1 ? "s" : ""}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="border-t border-surface-200 dark:border-surface-800 divide-y divide-surface-100 dark:divide-surface-800/50">
                    {group.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-4 px-6 py-3 hover:bg-surface-50 dark:hover:bg-surface-900/20 transition-colors"
                      >
                        <div className="shrink-0">
                          {getFileIcon(file.fileType, file.isPhoto)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-surface-400">
                            {file.uploadedBy?.name ?? "Unknown"} &middot;{" "}
                            {formatDate(file.createdAt)}
                          </p>
                        </div>
                        <span className="text-xs text-surface-400 shrink-0">
                          {typeof file.fileSize === "number"
                            ? formatFileSize(file.fileSize)
                            : file.fileSize}
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
      )}
    </div>
  );
}
