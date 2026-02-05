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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/shared/LoadingSpinner";

interface TaskFormData {
  title: string;
  description: string;
  workstream: string;
  section: string;
  defaultRole: string;
  daysOffset: number;
  indentLevel: number;
  isRequired: boolean;
  phase: string;
}

const emptyTaskForm: TaskFormData = {
  title: "",
  description: "",
  workstream: "",
  section: "",
  defaultRole: "",
  daysOffset: 0,
  indentLevel: 0,
  isRequired: true,
  phase: "",
};

export default function TemplateEditorPage() {
  const params = useParams();
  const templateId = params.templateId as string;

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>(emptyTaskForm);

  const utils = trpc.useUtils();

  const { data: template, isLoading } = trpc.templates.getById.useQuery({
    id: templateId,
  });

  const addTaskMutation = trpc.templates.addTask.useMutation({
    onSuccess: () => {
      utils.templates.getById.invalidate({ id: templateId });
      setAddingToSection(null);
      setTaskForm(emptyTaskForm);
    },
  });

  const updateTaskMutation = trpc.templates.updateTask.useMutation({
    onSuccess: () => {
      utils.templates.getById.invalidate({ id: templateId });
      setEditingTaskId(null);
      setTaskForm(emptyTaskForm);
    },
  });

  const deleteTaskMutation = trpc.templates.deleteTask.useMutation({
    onSuccess: () => {
      utils.templates.getById.invalidate({ id: templateId });
    },
  });

  const toggleSection = (key: string) => {
    const next = new Set(collapsedSections);
    next.has(key) ? next.delete(key) : next.add(key);
    setCollapsedSections(next);
  };

  // Group tasks by workstream, then by section
  const groupedTasks = (template?.templateTasks ?? []).reduce(
    (acc, task) => {
      const wsKey = task.workstream || "General";
      const secKey = task.section || "General";
      if (!acc[wsKey]) acc[wsKey] = {};
      if (!acc[wsKey][secKey]) acc[wsKey][secKey] = [];
      acc[wsKey][secKey].push(task);
      return acc;
    },
    {} as Record<string, Record<string, any[]>>
  );

  // Sort tasks within each section by sortOrder
  for (const ws of Object.values(groupedTasks)) {
    for (const sec of Object.keys(ws)) {
      ws[sec].sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }

  const handleAddTask = (workstream: string, section: string) => {
    addTaskMutation.mutate({
      templateId,
      title: taskForm.title,
      description: taskForm.description,
      workstream,
      section,
      defaultRole: taskForm.defaultRole,
      daysOffset: taskForm.daysOffset,
      indentLevel: taskForm.indentLevel,
      isRequired: taskForm.isRequired,
      phase: taskForm.phase as "PRE_CLOSE" | "DAY_OF" | "WEEK_1" | "WEEK_2" | undefined,
    });
  };

  const handleUpdateTask = (taskId: string) => {
    updateTaskMutation.mutate({
      id: taskId,
      title: taskForm.title,
      description: taskForm.description,
      defaultRole: taskForm.defaultRole,
      daysOffset: taskForm.daysOffset,
      indentLevel: taskForm.indentLevel,
      isRequired: taskForm.isRequired,
      phase: taskForm.phase as "PRE_CLOSE" | "DAY_OF" | "WEEK_1" | "WEEK_2" | undefined,
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate({ id: taskId });
  };

  const startEditing = (task: any) => {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      workstream: task.workstream || "",
      section: task.section || "",
      defaultRole: task.defaultRole || "",
      daysOffset: task.daysOffset,
      indentLevel: task.indentLevel,
      isRequired: task.isRequired,
      phase: task.phase || "",
    });
  };

  if (isLoading) return <PageLoader />;
  if (!template) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Link
            href="/templates"
            className="p-2 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-surface-500" />
          </Link>
          <p className="text-surface-500 dark:text-surface-400">
            Template not found
          </p>
        </div>
      </div>
    );
  }

  const totalTasks = template.templateTasks.length;
  const workstreamCount = Object.keys(groupedTasks).length;

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
              {template.name}
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1">
              Template Editor &middot; {totalTasks} tasks across{" "}
              {workstreamCount} workstreams
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
            <input
              type="text"
              defaultValue={template.name}
              className="neu-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">
              Facility Type
            </label>
            <select
              className="neu-input"
              defaultValue={template?.facilityType ?? undefined}
            >
              <option value="SNF">SNF</option>
              <option value="ALF">ALF</option>
              <option value="ILF">ILF</option>
              <option value="All">All</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">
              State
            </label>
            <input
              type="text"
              defaultValue={template.state || ""}
              className="neu-input"
              placeholder="e.g. ID, MT, OR"
            />
          </div>
        </div>
      </div>

      {/* Workstreams & Sections */}
      <div className="space-y-6">
        {Object.entries(groupedTasks).map(([workstream, sections]) => (
          <div key={workstream} className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-500">
              {workstream}
            </h2>

            {Object.entries(sections).map(([section, tasks]) => {
              const sectionKey = `${workstream}::${section}`;
              const isCollapsed = collapsedSections.has(sectionKey);
              const isAddingHere = addingToSection === sectionKey;

              return (
                <div
                  key={sectionKey}
                  className="neu-card p-0 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(sectionKey)}
                    className="w-full flex items-center justify-between px-6 py-3 hover:bg-surface-50 dark:hover:bg-surface-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-surface-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-surface-400" />
                      )}
                      <span className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                        {section}
                      </span>
                    </div>
                    <span className="text-xs text-surface-400">
                      {tasks.length} tasks
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="border-t border-surface-200 dark:border-surface-800 divide-y divide-surface-100 dark:divide-surface-800/50">
                      {tasks.map((task) => {
                        const isEditing = editingTaskId === task.id;

                        if (isEditing) {
                          return (
                            <div
                              key={task.id}
                              className="px-6 py-3 bg-surface-50 dark:bg-surface-900/20 space-y-3"
                            >
                              <div className="grid gap-3 sm:grid-cols-2">
                                <input
                                  type="text"
                                  value={taskForm.title}
                                  onChange={(e) =>
                                    setTaskForm({
                                      ...taskForm,
                                      title: e.target.value,
                                    })
                                  }
                                  className="neu-input"
                                  placeholder="Task title"
                                />
                                <input
                                  type="text"
                                  value={taskForm.defaultRole}
                                  onChange={(e) =>
                                    setTaskForm({
                                      ...taskForm,
                                      defaultRole: e.target.value,
                                    })
                                  }
                                  className="neu-input"
                                  placeholder="Default role"
                                />
                              </div>
                              <div className="grid gap-3 sm:grid-cols-3">
                                <input
                                  type="number"
                                  value={taskForm.daysOffset}
                                  onChange={(e) =>
                                    setTaskForm({
                                      ...taskForm,
                                      daysOffset: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="neu-input"
                                  placeholder="Days offset"
                                />
                                <input
                                  type="number"
                                  value={taskForm.indentLevel}
                                  onChange={(e) =>
                                    setTaskForm({
                                      ...taskForm,
                                      indentLevel:
                                        parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="neu-input"
                                  placeholder="Indent level"
                                />
                                <input
                                  type="text"
                                  value={taskForm.phase}
                                  onChange={(e) =>
                                    setTaskForm({
                                      ...taskForm,
                                      phase: e.target.value,
                                    })
                                  }
                                  className="neu-input"
                                  placeholder="Phase"
                                />
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleUpdateTask(task.id)}
                                  disabled={updateTaskMutation.isPending}
                                  className="neu-button-primary text-sm px-3 py-1.5"
                                >
                                  {updateTaskMutation.isPending
                                    ? "Saving..."
                                    : "Save"}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingTaskId(null);
                                    setTaskForm(emptyTaskForm);
                                  }}
                                  className="neu-button-secondary text-sm px-3 py-1.5"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 px-6 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-900/20 transition-colors group"
                          >
                            <GripVertical className="w-4 h-4 text-surface-300 dark:text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                            {task.indentLevel > 0 && (
                              <div
                                style={{ width: task.indentLevel * 24 }}
                                className="shrink-0"
                              />
                            )}
                            <span className="flex-1 text-sm text-surface-800 dark:text-surface-100">
                              {task.title}
                              {task.isRequired && (
                                <span className="text-red-400 ml-1">*</span>
                              )}
                            </span>
                            <span className="text-xs text-surface-400 w-24 text-right">
                              {task.defaultRole || "-"}
                            </span>
                            <span className="text-xs text-surface-400 w-20 text-right">
                              D-{task.daysOffset}
                            </span>
                            {task.phase && (
                              <span className="text-xs text-primary-400 w-20 text-right">
                                {task.phase}
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                startEditing(task);
                              }}
                              className="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Pencil className="w-3 h-3 text-surface-400" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteTask(task.id);
                              }}
                              disabled={deleteTaskMutation.isPending}
                              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        );
                      })}

                      {/* Add Task Form */}
                      {isAddingHere ? (
                        <div className="px-6 py-3 bg-surface-50 dark:bg-surface-900/20 space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <input
                              type="text"
                              value={taskForm.title}
                              onChange={(e) =>
                                setTaskForm({
                                  ...taskForm,
                                  title: e.target.value,
                                })
                              }
                              className="neu-input"
                              placeholder="Task title"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={taskForm.defaultRole}
                              onChange={(e) =>
                                setTaskForm({
                                  ...taskForm,
                                  defaultRole: e.target.value,
                                })
                              }
                              className="neu-input"
                              placeholder="Default role"
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <input
                              type="number"
                              value={taskForm.daysOffset}
                              onChange={(e) =>
                                setTaskForm({
                                  ...taskForm,
                                  daysOffset: parseInt(e.target.value) || 0,
                                })
                              }
                              className="neu-input"
                              placeholder="Days offset"
                            />
                            <input
                              type="number"
                              value={taskForm.indentLevel}
                              onChange={(e) =>
                                setTaskForm({
                                  ...taskForm,
                                  indentLevel: parseInt(e.target.value) || 0,
                                })
                              }
                              className="neu-input"
                              placeholder="Indent level"
                            />
                            <input
                              type="text"
                              value={taskForm.phase}
                              onChange={(e) =>
                                setTaskForm({
                                  ...taskForm,
                                  phase: e.target.value,
                                })
                              }
                              className="neu-input"
                              placeholder="Phase"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                handleAddTask(workstream, section)
                              }
                              disabled={
                                addTaskMutation.isPending || !taskForm.title
                              }
                              className="neu-button-primary text-sm px-3 py-1.5"
                            >
                              {addTaskMutation.isPending
                                ? "Adding..."
                                : "Add Task"}
                            </button>
                            <button
                              onClick={() => {
                                setAddingToSection(null);
                                setTaskForm(emptyTaskForm);
                              }}
                              className="neu-button-secondary text-sm px-3 py-1.5"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAddingToSection(sectionKey);
                            setTaskForm({
                              ...emptyTaskForm,
                              workstream,
                              section,
                            });
                          }}
                          className="w-full px-6 py-2.5 text-sm text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Task
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <button className="w-full neu-card text-center py-3 text-sm font-medium text-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/10 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>
    </div>
  );
}
