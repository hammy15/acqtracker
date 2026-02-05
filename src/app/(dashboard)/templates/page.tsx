"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileStack,
  Plus,
  Search,
  Copy,
  Pencil,
  Trash2,
  CheckSquare,
  Building2,
  MoreVertical,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  facilityType: string;
  workstreams: number;
  tasks: number;
  lastModified: string;
  createdBy: string;
  usedIn: number;
}

const mockTemplates: Template[] = [
  {
    id: "1",
    name: "Standard SNF Acquisition",
    description: "Complete checklist for skilled nursing facility change of ownership including licensing, operations, and accounting workstreams.",
    facilityType: "SNF",
    workstreams: 5,
    tasks: 187,
    lastModified: "Jan 28, 2026",
    createdBy: "Owen Richardson",
    usedIn: 8,
  },
  {
    id: "2",
    name: "Standard ALF Acquisition",
    description: "Assisted living facility acquisition template covering all regulatory and operational requirements.",
    facilityType: "ALF",
    workstreams: 4,
    tasks: 142,
    lastModified: "Jan 15, 2026",
    createdBy: "Owen Richardson",
    usedIn: 3,
  },
  {
    id: "3",
    name: "Idaho CHOW Template",
    description: "Idaho-specific CHOW requirements overlaid on standard SNF template for DHW compliance.",
    facilityType: "SNF",
    workstreams: 5,
    tasks: 205,
    lastModified: "Feb 02, 2026",
    createdBy: "Steve Anderson",
    usedIn: 2,
  },
  {
    id: "4",
    name: "Montana CHOW Template",
    description: "Montana DPHHS requirements for facility change of ownership.",
    facilityType: "SNF",
    workstreams: 5,
    tasks: 198,
    lastModified: "Dec 20, 2025",
    createdBy: "Steve Anderson",
    usedIn: 1,
  },
  {
    id: "5",
    name: "Transition Day Checklist",
    description: "Night-of-closing transition checklist for on-site team to execute during ownership transfer.",
    facilityType: "All",
    workstreams: 3,
    tasks: 64,
    lastModified: "Feb 01, 2026",
    createdBy: "Owen Richardson",
    usedIn: 4,
  },
  {
    id: "6",
    name: "Post-Close Week 1",
    description: "First week after closing task list covering employee orientation, system switchovers, and compliance filings.",
    facilityType: "All",
    workstreams: 4,
    tasks: 48,
    lastModified: "Jan 30, 2026",
    createdBy: "Tim Brooks",
    usedIn: 2,
  },
];

export default function TemplatesPage() {
  const [search, setSearch] = useState("");

  const filtered = mockTemplates.filter(
    (t) => !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

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
            {mockTemplates.length} checklist templates
          </p>
        </div>
        <button className="neu-button-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Template
        </button>
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

      {/* Template Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((template) => (
          <Link
            key={template.id}
            href={`/templates/${template.id}`}
            className="neu-card group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-primary-500 transition-colors">
                  {template.name}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">
                  {template.description}
                </p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300 shrink-0 ml-3">
                {template.facilityType}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-surface-400 mt-4 pt-3 border-t border-surface-200 dark:border-surface-800">
              <span className="flex items-center gap-1">
                <CheckSquare className="w-3 h-3" />
                {template.tasks} tasks
              </span>
              <span>{template.workstreams} workstreams</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Used in {template.usedIn} deals
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-surface-400">
              <span>By {template.createdBy}</span>
              <span>Modified {template.lastModified}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
