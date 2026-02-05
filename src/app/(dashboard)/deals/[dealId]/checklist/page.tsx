"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Paperclip,
  MessageCircle,
  Camera,
  Check,
  AlertTriangle,
  Clock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProgressBar } from "@/components/shared/ProgressBar";

interface Task {
  id: string;
  title: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETE" | "NA";
  assignee: string;
  dueDate: string;
  indent: number;
  files: number;
  comments: number;
  requiresPhoto: boolean;
}

interface Workstream {
  name: string;
  sections: {
    name: string;
    tasks: Task[];
  }[];
}

const mockWorkstreams: Workstream[] = [
  {
    name: "Administration",
    sections: [
      {
        name: "Organizational Documents",
        tasks: [
          { id: "1", title: "Articles of Incorporation", status: "COMPLETE", assignee: "Owen", dueDate: "Jan 15", indent: 0, files: 1, comments: 0, requiresPhoto: false },
          { id: "2", title: "Obtain TIN / Federal ID Number", status: "COMPLETE", assignee: "Owen", dueDate: "Jan 15", indent: 0, files: 1, comments: 0, requiresPhoto: false },
          { id: "3", title: "Operating Agreement", status: "COMPLETE", assignee: "Steve", dueDate: "Feb 01", indent: 0, files: 0, comments: 1, requiresPhoto: false },
          { id: "4", title: "Operations Transfer Agreement", status: "COMPLETE", assignee: "Steve", dueDate: "Feb 01", indent: 0, files: 2, comments: 0, requiresPhoto: false },
          { id: "5", title: "Register Assumed Business Name", status: "COMPLETE", assignee: "Owen", dueDate: "Feb 01", indent: 0, files: 0, comments: 0, requiresPhoto: false },
        ],
      },
      {
        name: "Licensing",
        tasks: [
          { id: "6", title: "Complete Medicare License Application", status: "COMPLETE", assignee: "Steve", dueDate: "Feb 15", indent: 0, files: 3, comments: 1, requiresPhoto: false },
          { id: "7", title: "Complete Seller's Medicare Application", status: "COMPLETE", assignee: "Steve", dueDate: "Feb 10", indent: 1, files: 1, comments: 0, requiresPhoto: false },
          { id: "8", title: "Complete Medicaid License Application", status: "IN_PROGRESS", assignee: "Steve", dueDate: "Mar 01", indent: 0, files: 0, comments: 2, requiresPhoto: false },
          { id: "9", title: "Identify Administrator", status: "NOT_STARTED", assignee: "Owen", dueDate: "Feb 20", indent: 1, files: 0, comments: 0, requiresPhoto: false },
          { id: "10", title: "Identify DNS", status: "NOT_STARTED", assignee: "Owen", dueDate: "Feb 20", indent: 1, files: 0, comments: 0, requiresPhoto: false },
          { id: "11", title: "Determine Name of Facility", status: "COMPLETE", assignee: "Owen", dueDate: "Jan 30", indent: 1, files: 0, comments: 0, requiresPhoto: false },
          { id: "12", title: "Identify Medical Director", status: "NOT_STARTED", assignee: "Owen", dueDate: "Feb 25", indent: 1, files: 0, comments: 0, requiresPhoto: false },
          { id: "13", title: "Complete CMS 671", status: "NOT_STARTED", assignee: "Steve", dueDate: "Mar 01", indent: 1, files: 0, comments: 0, requiresPhoto: false },
        ],
      },
      {
        name: "Insurance",
        tasks: [
          { id: "14", title: "Liability / Property — obtain building specifics", status: "COMPLETE", assignee: "Owen", dueDate: "Feb 01", indent: 0, files: 1, comments: 0, requiresPhoto: false },
          { id: "15", title: "Complete facility application", status: "COMPLETE", assignee: "Owen", dueDate: "Feb 05", indent: 1, files: 2, comments: 0, requiresPhoto: false },
          { id: "16", title: "Workers Comp — obtain payroll estimates", status: "COMPLETE", assignee: "Owen", dueDate: "Feb 10", indent: 0, files: 1, comments: 0, requiresPhoto: false },
          { id: "17", title: "Surety Bond — add new facility", status: "COMPLETE", assignee: "Owen", dueDate: "Feb 15", indent: 0, files: 1, comments: 0, requiresPhoto: false },
        ],
      },
    ],
  },
  {
    name: "Operations",
    sections: [
      {
        name: "Employee Benefits & HR",
        tasks: [
          { id: "18", title: "Obtain existing employee benefits / handbook", status: "COMPLETE", assignee: "Tim", dueDate: "Jan 20", indent: 0, files: 2, comments: 0, requiresPhoto: false },
          { id: "19", title: "Prepare comparison of benefits", status: "IN_PROGRESS", assignee: "Tim", dueDate: "Feb 15", indent: 0, files: 0, comments: 1, requiresPhoto: false },
          { id: "20", title: "Update employee handbooks", status: "NOT_STARTED", assignee: "Tim", dueDate: "Feb 28", indent: 0, files: 0, comments: 0, requiresPhoto: false },
          { id: "21", title: "Schedule employee orientation meetings", status: "NOT_STARTED", assignee: "Tim", dueDate: "Mar 01", indent: 0, files: 0, comments: 0, requiresPhoto: false },
          { id: "22", title: "Order new hire packets", status: "BLOCKED", assignee: "Tim", dueDate: "Feb 10", indent: 1, files: 0, comments: 3, requiresPhoto: false },
        ],
      },
      {
        name: "Rate Structure",
        tasks: [
          { id: "23", title: "Evaluate facility rate structure", status: "IN_PROGRESS", assignee: "Doug", dueDate: "Feb 20", indent: 0, files: 1, comments: 0, requiresPhoto: false },
          { id: "24", title: "Evaluate managed care contracts", status: "NOT_STARTED", assignee: "Doug", dueDate: "Mar 01", indent: 0, files: 0, comments: 0, requiresPhoto: false },
        ],
      },
    ],
  },
];

const statusIcons: Record<string, React.ReactNode> = {
  NOT_STARTED: <div className="w-5 h-5 rounded-md border-2 border-surface-300 dark:border-surface-600" />,
  IN_PROGRESS: <Clock className="w-5 h-5 text-primary-500" />,
  BLOCKED: <AlertTriangle className="w-5 h-5 text-red-500" />,
  COMPLETE: <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>,
  NA: <X className="w-5 h-5 text-surface-400" />,
};

export default function ChecklistPage() {
  const params = useParams();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [collapsedWorkstreams, setCollapsedWorkstreams] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const toggleWorkstream = (name: string) => {
    const next = new Set(collapsedWorkstreams);
    next.has(name) ? next.delete(name) : next.add(name);
    setCollapsedWorkstreams(next);
  };

  const toggleSection = (key: string) => {
    const next = new Set(collapsedSections);
    next.has(key) ? next.delete(key) : next.add(key);
    setCollapsedSections(next);
  };

  const getWorkstreamStats = (ws: Workstream) => {
    const tasks = ws.sections.flatMap((s) => s.tasks);
    const done = tasks.filter((t) => t.status === "COMPLETE" || t.status === "NA").length;
    return { done, total: tasks.length };
  };

  const getSectionStats = (tasks: Task[]) => {
    const done = tasks.filter((t) => t.status === "COMPLETE" || t.status === "NA").length;
    return { done, total: tasks.length };
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neu-input pl-10 py-2"
          />
        </div>
        <div className="flex gap-2">
          <select className="neu-input w-auto py-2 text-sm">
            <option>All Workstreams</option>
            <option>Administration</option>
            <option>Operations</option>
            <option>Accounting</option>
          </select>
          <select className="neu-input w-auto py-2 text-sm">
            <option>All Users</option>
            <option>Owen</option>
            <option>Steve</option>
            <option>Tim</option>
          </select>
          <select className="neu-input w-auto py-2 text-sm">
            <option>All Status</option>
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Blocked</option>
            <option>Complete</option>
          </select>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-4">
        {mockWorkstreams.map((ws) => {
          const stats = getWorkstreamStats(ws);
          const isCollapsed = collapsedWorkstreams.has(ws.name);

          return (
            <div key={ws.name} className="neu-card p-0 overflow-hidden">
              {/* Workstream Header */}
              <button
                onClick={() => toggleWorkstream(ws.name)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-900/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isCollapsed ? (
                    <ChevronRight className="w-5 h-5 text-surface-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-surface-400" />
                  )}
                  <h3 className="text-base font-bold uppercase tracking-wide text-surface-800 dark:text-surface-100">
                    {ws.name}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-surface-500 dark:text-surface-400">
                    {stats.done}/{stats.total}
                  </span>
                  <div className="w-24">
                    <ProgressBar value={stats.done} max={stats.total} size="sm" />
                  </div>
                  <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
                    {stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%
                  </span>
                </div>
              </button>

              {!isCollapsed && (
                <div className="border-t border-surface-200 dark:border-surface-800">
                  {ws.sections.map((section) => {
                    const sectionKey = `${ws.name}:${section.name}`;
                    const sectionCollapsed = collapsedSections.has(sectionKey);
                    const sStats = getSectionStats(section.tasks);
                    const allDone = sStats.done === sStats.total;

                    return (
                      <div key={sectionKey}>
                        {/* Section Header */}
                        <button
                          onClick={() => toggleSection(sectionKey)}
                          className="w-full flex items-center justify-between px-6 py-2.5 bg-surface-50 dark:bg-surface-900/30 hover:bg-surface-100 dark:hover:bg-surface-900/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {sectionCollapsed ? (
                              <ChevronRight className="w-4 h-4 text-surface-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-surface-400" />
                            )}
                            <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">
                              {section.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-surface-500 dark:text-surface-400">
                              {sStats.done}/{sStats.total}
                            </span>
                            {allDone && (
                              <Check className="w-4 h-4 text-emerald-500" />
                            )}
                          </div>
                        </button>

                        {/* Tasks */}
                        {!sectionCollapsed && (
                          <div className="divide-y divide-surface-100 dark:divide-surface-800/50">
                            {section.tasks.map((task) => (
                              <button
                                key={task.id}
                                onClick={() => setSelectedTask(task.id === selectedTask ? null : task.id)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-surface-50 dark:hover:bg-surface-900/20 transition-colors",
                                  task.status === "BLOCKED" && "bg-red-50/50 dark:bg-red-950/10",
                                  selectedTask === task.id && "bg-primary-50/50 dark:bg-primary-950/10"
                                )}
                              >
                                {/* Indent */}
                                {task.indent > 0 && (
                                  <div style={{ width: task.indent * 24 }} className="shrink-0" />
                                )}

                                {/* Status icon */}
                                <div className="shrink-0">
                                  {statusIcons[task.status]}
                                </div>

                                {/* Title */}
                                <span
                                  className={cn(
                                    "flex-1 text-sm",
                                    task.status === "COMPLETE"
                                      ? "line-through text-surface-400 dark:text-surface-500"
                                      : "text-surface-800 dark:text-surface-100"
                                  )}
                                >
                                  {task.title}
                                </span>

                                {/* Meta */}
                                <div className="hidden sm:flex items-center gap-3 shrink-0">
                                  <span className="text-xs text-surface-500 dark:text-surface-400 w-16 text-right">
                                    {task.assignee}
                                  </span>
                                  <span className="text-xs text-surface-400 w-14 text-right">
                                    {task.dueDate}
                                  </span>
                                  {task.files > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-surface-400">
                                      <Paperclip className="w-3 h-3" />
                                      {task.files}
                                    </span>
                                  )}
                                  {task.comments > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-surface-400">
                                      <MessageCircle className="w-3 h-3" />
                                      {task.comments}
                                    </span>
                                  )}
                                  {task.requiresPhoto && (
                                    <Camera className="w-3 h-3 text-surface-400" />
                                  )}
                                </div>
                              </button>
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
        })}
      </div>
    </div>
  );
}
