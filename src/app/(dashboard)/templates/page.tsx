"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileStack,
  Plus,
  Search,
  CheckSquare,
  Building2,
  Star,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function TemplatesPage() {
  const [search, setSearch] = useState("");

  const { data: templates, isLoading } = trpc.templates.list.useQuery({
    search,
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
            <FileStack className="w-6 h-6 text-primary-500" />
            Templates
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {templates?.length ?? 0} checklist templates
          </p>
        </div>
        <PermissionGate permission="templates:create">
          <button className="neu-button-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </PermissionGate>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="neu-input pl-10"
        />
      </div>

      {/* Loading State */}
      {isLoading && <PageLoader />}

      {/* Empty State */}
      {!isLoading && templates?.length === 0 && (
        <EmptyState
          icon={FileStack}
          title="No templates found"
          description={
            search
              ? "No templates match your search. Try a different term."
              : "Create your first template to get started."
          }
        />
      )}

      {/* Template Grid */}
      {!isLoading && templates && templates.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/templates/${template.id}`}
              className="neu-card group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-primary-500 transition-colors flex items-center gap-2">
                    {template.name}
                    {template.isDefault && (
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    {template.templateType}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {template.state && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400">
                      {template.state}
                    </span>
                  )}
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                    {template.facilityType}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-surface-400 mt-4 pt-3 border-t border-surface-200 dark:border-surface-800">
                <span className="flex items-center gap-1">
                  <CheckSquare className="w-3 h-3" />
                  {template._count.templateTasks} tasks
                </span>
                {template.isDefault && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3" />
                    Default
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {template.facilityType}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
