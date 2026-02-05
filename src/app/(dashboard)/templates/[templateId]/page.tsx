"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileStack,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateTask {
  id: string;
  title: string;
  assigneeRole: string;
  daysBeforeClose: number;
  indent: number;
}

interface TemplateSection {
  name: string;
  tasks: TemplateTask[];
}

const mockSections: TemplateSection[] = [
  {
    name: "Organizational Documents",
    tasks: [
      { id: "1", title: "Articles of Incorporation", assigneeRole: "Deal Lead", daysBeforeClose: 60, indent: 0 },
      { id: "2", title: "Obtain TIN / Federal ID Number", assigneeRole: "Deal Lead", daysBeforeClose: 60, indent: 0 },
      { id: "3", title: "Operating Agreement", assigneeRole: "Legal", daysBeforeClose: 45, indent: 0 },
      { id: "4", title: "Operations Transfer Agreement", assigneeRole: "Legal", daysBeforeClose: 45, indent: 0 },
      { id: "5", title: "Register Assumed Business Name", assigneeRole: "Deal Lead", daysBeforeClose: 45, indent: 0 },
    ],
  },
  {
    name: "Licensing",
    tasks: [
      { id: "6", title: "Complete Medicare License Application", assigneeRole: "Licensing", daysBeforeClose: 30, indent: 0 },
      { id: "7", title: "Complete Seller's Medicare Application", assigneeRole: "Licensing", daysBeforeClose: 35, indent: 1 },
      { id: "8", title: "Complete Medicaid License Application", assigneeRole: "Licensing", daysBeforeClose: 30, indent: 0 },
      { id: "9", title: "Identify Administrator", assigneeRole: "Deal Lead", daysBeforeClose: 25, indent: 1 },
      { id: "10", title: "Identify DNS", assigneeRole: "Deal Lead", daysBeforeClose: 25, indent: 1 },
      { id: "11", title: "Determine Name of Facility", assigneeRole: "Deal Lead", daysBeforeClose: 40, indent: 1 },
    ],
  },
  {
    name: "Insurance",
    tasks: [
      { id: "12", title: "Liability / Property — obtain building specifics", assigneeRole: "Deal Lead", daysBeforeClose: 45, indent: 0 },
      { id: "13", title: "Complete facility application", assigneeRole: "Deal Lead", daysBeforeClose: 40, indent: 1 },
      { id: "14", title: "Workers Comp — obtain payroll estimates", assigneeRole: "Deal Lead", daysBeforeClose: 35, indent: 0 },
      { id: "15", title: "Surety Bond — add new facility", assigneeRole: "Deal Lead", daysBeforeClose: 30, indent: 0 },
    ],
  },
];

export default function TemplateEditorPage() {
  const params = useParams();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (name: string) => {
    const next = new Set(collapsedSections);
    next.has(name) ? next.delete(name) : next.add(name);
    setCollapsedSections(next);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/templates"
            className="p-2 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-surface-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
              <FileStack className="w-6 h-6 text-primary-500" />
              Standard SNF Acquisition
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1">
              Template Editor &middot; {mockSections.reduce((sum, s) => sum + s.tasks.length, 0)} tasks across {mockSections.length} sections
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <button className="neu-button-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Template
          </button>
        </div>
      </div>

      {/* Template Meta */}
      <div className="neu-card">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">
              Template Name
            </label>
            <input type="text" defaultValue="Standard SNF Acquisition" className="neu-input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">
              Facility Type
            </label>
            <select className="neu-input">
              <option selected>SNF</option>
              <option>ALF</option>
              <option>ILF</option>
              <option>All</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">
              Description
            </label>
            <input type="text" defaultValue="Complete checklist for SNF CHOW" className="neu-input" />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {mockSections.map((section) => {
          const isCollapsed = collapsedSections.has(section.name);
          return (
            <div key={section.name} className="neu-card p-0 overflow-hidden">
              <button
                onClick={() => toggleSection(section.name)}
                className="w-full flex items-center justify-between px-6 py-3 hover:bg-surface-50 dark:hover:bg-surface-900/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-surface-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-surface-400" />
                  )}
                  <span className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                    {section.name}
                  </span>
                </div>
                <span className="text-xs text-surface-400">{section.tasks.length} tasks</span>
              </button>

              {!isCollapsed && (
                <div className="border-t border-surface-200 dark:border-surface-800 divide-y divide-surface-100 dark:divide-surface-800/50">
                  {section.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 px-6 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-900/20 transition-colors group"
                    >
                      <GripVertical className="w-4 h-4 text-surface-300 dark:text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                      {task.indent > 0 && <div style={{ width: task.indent * 24 }} className="shrink-0" />}
                      <span className="flex-1 text-sm text-surface-800 dark:text-surface-100">
                        {task.title}
                      </span>
                      <span className="text-xs text-surface-400 w-24 text-right">{task.assigneeRole}</span>
                      <span className="text-xs text-surface-400 w-20 text-right">D-{task.daysBeforeClose}</span>
                      <button className="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil className="w-3 h-3 text-surface-400" />
                      </button>
                      <button className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  ))}
                  <button className="w-full px-6 py-2.5 text-sm text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5" />
                    Add Task
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <button className="w-full neu-card text-center py-3 text-sm font-medium text-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/10 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>
    </div>
  );
}
