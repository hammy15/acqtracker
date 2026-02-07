"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Bell,
  Shield,
  Database,
  Key,
  Save,
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  List,
  AlertTriangle,
  Building,
  FileText,
  Users,
  MessageSquare,
  Activity,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

const LIST_TABS = [
  { key: "customWorkstreams", label: "Workstreams", description: "Task organization categories" },
  { key: "customFacilityTypes", label: "Facility Types", description: "Types of healthcare facilities" },
  { key: "customTaskPhases", label: "Task Phases", description: "Timeline phases for task organization" },
  { key: "customDealStatuses", label: "Deal Statuses", description: "Pipeline stages for deals" },
  { key: "customRoles", label: "Team Roles", description: "Custom team roles and positions" },
] as const;

const COLORS = [
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b",
  "#10b981", "#ec4899", "#6366f1", "#f97316", "#06b6d4",
];

interface CustomItem {
  id: string;
  label: string;
  color?: string;
  icon?: string;
  isDefault: boolean;
  isActive: boolean;
}

const SETTINGS_TABS = [
  { key: "general", label: "General", icon: Settings },
  { key: "data", label: "Data Management", icon: Database },
] as const;

// ── Status badge colors ──────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PIPELINE: "bg-gray-100 text-gray-600",
  LOI: "bg-blue-100 text-blue-700",
  DUE_DILIGENCE: "bg-indigo-100 text-indigo-700",
  CHOW_FILED: "bg-purple-100 text-purple-700",
  CLOSING: "bg-amber-100 text-amber-700",
  TRANSITION_DAY: "bg-orange-100 text-orange-700",
  WEEK_1: "bg-teal-100 text-teal-700",
  WEEK_2: "bg-emerald-100 text-emerald-700",
  POST_CLOSE: "bg-green-100 text-green-700",
  ARCHIVED: "bg-gray-200 text-gray-500",
};

function formatStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function OrgSettingsPage() {
  const { can, role } = usePermissions();
  const { data: settings, isLoading } = trpc.orgSettings.get.useQuery();
  const utils = trpc.useUtils();

  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN";

  const [activeTab, setActiveTab] = useState<string>("general");
  const [timezone, setTimezone] = useState("America/Boise");
  const [dateFormat, setDateFormat] = useState("MMM DD, YYYY");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [transitionAlerts, setTransitionAlerts] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [saved, setSaved] = useState(false);
  const [activeListTab, setActiveListTab] = useState<string>("customWorkstreams");
  const [listItems, setListItems] = useState<Record<string, CustomItem[]>>({});
  const [newItemLabel, setNewItemLabel] = useState("");

  // Data management state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [purgeConfirm, setPurgeConfirm] = useState("");
  const [purgeSuccess, setPurgeSuccess] = useState(false);

  // Admin data queries
  const { data: dataCounts, refetch: refetchCounts } =
    trpc.orgSettings.getDataCounts.useQuery(undefined, { enabled: isAdmin && activeTab === "data" });
  const { data: adminDeals, refetch: refetchDeals } =
    trpc.orgSettings.listDealsForAdmin.useQuery(undefined, { enabled: isAdmin && activeTab === "data" });

  const deleteDealMutation = trpc.orgSettings.deleteDeal.useMutation({
    onSuccess: () => {
      refetchCounts();
      refetchDeals();
      setDeleteConfirm(null);
    },
  });

  const purgeMutation = trpc.orgSettings.purgeAllContent.useMutation({
    onSuccess: () => {
      refetchCounts();
      refetchDeals();
      setPurgeConfirm("");
      setPurgeSuccess(true);
      setTimeout(() => setPurgeSuccess(false), 5000);
    },
  });

  // Populate from server data
  useEffect(() => {
    if (settings) {
      setTimezone(settings.timezone);
      setDateFormat(settings.dateFormat);
      setEmailNotifs(settings.emailNotifications);
      setDailyDigest(settings.dailyDigest);
      setWeeklyReport(settings.weeklyReport);
      setTransitionAlerts(settings.transitionAlerts);
      setSessionTimeout(settings.sessionTimeoutMinutes);
      // Load custom lists
      const lists: Record<string, CustomItem[]> = {};
      for (const tab of LIST_TABS) {
        const raw = (settings as Record<string, unknown>)[tab.key];
        lists[tab.key] = Array.isArray(raw) ? raw : [];
      }
      setListItems(lists);
    }
  }, [settings]);

  const updateMutation = trpc.orgSettings.update.useMutation({
    onSuccess: () => {
      setSaved(true);
      utils.orgSettings.get.invalidate();
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const updateListMutation = trpc.orgSettings.updateCustomList.useMutation({
    onSuccess: () => {
      utils.orgSettings.get.invalidate();
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      timezone,
      dateFormat,
      emailNotifications: emailNotifs,
      dailyDigest,
      weeklyReport,
      transitionAlerts,
      sessionTimeoutMinutes: sessionTimeout,
    });
  };

  const currentList = listItems[activeListTab] ?? [];

  const addItem = () => {
    if (!newItemLabel.trim()) return;
    const updated = [
      ...currentList,
      {
        id: crypto.randomUUID(),
        label: newItemLabel.trim(),
        color: COLORS[currentList.length % COLORS.length],
        isDefault: false,
        isActive: true,
      },
    ];
    setListItems({ ...listItems, [activeListTab]: updated });
    setNewItemLabel("");
    updateListMutation.mutate({
      field: activeListTab as "customWorkstreams",
      items: updated,
    });
  };

  const removeItem = (id: string) => {
    const updated = currentList.filter((item) => item.id !== id);
    setListItems({ ...listItems, [activeListTab]: updated });
    updateListMutation.mutate({
      field: activeListTab as "customWorkstreams",
      items: updated,
    });
  };

  const toggleItem = (id: string) => {
    const updated = currentList.map((item) =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );
    setListItems({ ...listItems, [activeListTab]: updated });
    updateListMutation.mutate({
      field: activeListTab as "customWorkstreams",
      items: updated,
    });
  };

  if (!can("org:settings")) {
    return (
      <div className="max-w-lg mx-auto mt-20">
        <div className="neu-card text-center py-12">
          <Shield className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            You do not have permission to view organization settings. Contact an administrator if you need access.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="w-6 h-6 text-teal-500" />
          Organization Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your organization preferences and configuration
        </p>
      </div>

      {/* Tab bar */}
      {isAdmin && (
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ══════════════ GENERAL TAB ══════════════ */}
      {activeTab === "general" && (
        <>
          {/* Organization Details */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <Building2 className="w-5 h-5 text-teal-500" />
              <h2 className="text-lg font-semibold text-gray-900">Organization</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-300">
                  <option value="America/Boise">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Format</label>
                <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-300">
                  <option value="MMM DD, YYYY">MMM DD, YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Configurable Lists */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <List className="w-5 h-5 text-teal-500" />
              <h2 className="text-lg font-semibold text-gray-900">Configurable Lists</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {LIST_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveListTab(tab.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                    activeListTab === tab.key
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              {LIST_TABS.find((t) => t.key === activeListTab)?.description}
            </p>
            <div className="space-y-2">
              {currentList.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg border transition-colors",
                    item.isActive
                      ? "border-gray-200 bg-white"
                      : "border-gray-100 bg-gray-50 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {item.color && (
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    )}
                    <span className={cn("text-sm", item.isActive ? "text-gray-900" : "text-gray-400 line-through")}>
                      {item.label}
                    </span>
                    {item.isDefault && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal-50 text-teal-600">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={cn(
                        "text-xs px-2 py-1 rounded",
                        item.isActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                      )}
                    >
                      {item.isActive ? "Disable" : "Enable"}
                    </button>
                    {!item.isDefault && (
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                placeholder={`Add new ${LIST_TABS.find((t) => t.key === activeListTab)?.label.toLowerCase().slice(0, -1) ?? "item"}...`}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-300"
              />
              <button
                onClick={addItem}
                disabled={!newItemLabel.trim()}
                className="flex items-center gap-1 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <Bell className="w-5 h-5 text-teal-500" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            </div>
            {[
              { label: "Email notifications for task assignments", checked: emailNotifs, onChange: setEmailNotifs, icon: Mail },
              { label: "Daily digest summary", checked: dailyDigest, onChange: setDailyDigest, icon: Mail },
              { label: "Weekly progress report", checked: weeklyReport, onChange: setWeeklyReport, icon: Mail },
              { label: "Transition day real-time alerts", checked: transitionAlerts, onChange: setTransitionAlerts, icon: Bell },
            ].map((n, i) => (
              <label key={i} className="flex items-center justify-between py-1 cursor-pointer">
                <span className="flex items-center gap-2 text-sm text-gray-700">
                  <n.icon className="w-4 h-4 text-gray-400" />
                  {n.label}
                </span>
                <input
                  type="checkbox"
                  checked={n.checked}
                  onChange={(e) => n.onChange(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-gray-300 text-teal-500 focus:ring-teal-500"
                />
              </label>
            ))}
          </div>

          {/* Security */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <Shield className="w-5 h-5 text-teal-500" />
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Session Timeout</p>
                  <p className="text-xs text-gray-400">Auto-logout after inactivity</p>
                </div>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(Number(e.target.value))}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-500/30"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={240}>4 hours</option>
                  <option value={480}>8 hours</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">API Keys</p>
                  <p className="text-xs text-gray-400">Manage integration API keys</p>
                </div>
                <button className="flex items-center gap-1 text-xs font-medium text-teal-500 hover:text-teal-600 transition-colors">
                  <Key className="w-3 h-3" />
                  Manage
                </button>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-end gap-3">
            {saved && (
              <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Settings saved!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Settings
            </button>
          </div>
        </>
      )}

      {/* ══════════════ DATA MANAGEMENT TAB ══════════════ */}
      {activeTab === "data" && isAdmin && (
        <>
          {/* Data Overview */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <Database className="w-5 h-5 text-teal-500" />
              <h2 className="text-lg font-semibold text-gray-900">Data Overview</h2>
            </div>
            {dataCounts ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Deals", value: dataCounts.deals, icon: Building, color: "text-blue-500 bg-blue-50" },
                  { label: "Tasks", value: dataCounts.tasks, icon: CheckCircle2, color: "text-teal-500 bg-teal-50" },
                  { label: "Templates", value: dataCounts.templates, icon: FileText, color: "text-purple-500 bg-purple-50" },
                  { label: "Users", value: dataCounts.users, icon: Users, color: "text-amber-500 bg-amber-50" },
                  { label: "Files", value: dataCounts.files, icon: FileText, color: "text-indigo-500 bg-indigo-50" },
                  { label: "OTA Docs", value: dataCounts.otaDocs, icon: FileText, color: "text-pink-500 bg-pink-50" },
                  { label: "AI Chats", value: dataCounts.aiConversations, icon: MessageSquare, color: "text-emerald-500 bg-emerald-50" },
                  { label: "Activity Logs", value: dataCounts.activityLogs, icon: Activity, color: "text-gray-500 bg-gray-100" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", stat.color)}>
                        <stat.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs text-gray-500">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {/* Manage Deals */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <Building className="w-5 h-5 text-teal-500" />
              <h2 className="text-lg font-semibold text-gray-900">Manage Deals</h2>
              <span className="text-xs text-gray-400 ml-auto">{adminDeals?.length ?? 0} deals</span>
            </div>
            {adminDeals && adminDeals.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {adminDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{deal.name}</p>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", STATUS_COLORS[deal.status] ?? "bg-gray-100 text-gray-600")}>
                          {formatStatus(deal.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {deal.facilityType} &bull; {deal._count.tasks} tasks &bull; Created {new Date(deal.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {deleteConfirm === deal.id ? (
                      <div className="flex items-center gap-2 ml-3">
                        <span className="text-xs text-red-500 font-medium">Delete?</span>
                        <button
                          onClick={() => deleteDealMutation.mutate({ dealId: deal.id })}
                          disabled={deleteDealMutation.isPending}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                          {deleteDealMutation.isPending ? "..." : "Yes"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(deal.id)}
                        className="ml-3 flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : adminDeals ? (
              <p className="text-sm text-gray-400 text-center py-8">No deals found.</p>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {/* Danger Zone */}
          {isSuperAdmin && (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
              </div>
              <div>
                <p className="text-sm text-red-700 font-medium">Purge All Content</p>
                <p className="text-xs text-red-500 mt-1 mb-4">
                  This will permanently delete all deals, tasks, templates, files, OTA documents, AI conversations, and activity logs.
                  Users and organization settings will be preserved.
                </p>
                {purgeSuccess ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium py-2">
                    <CheckCircle2 className="w-4 h-4" />
                    All content has been purged successfully.
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={purgeConfirm}
                      onChange={(e) => setPurgeConfirm(e.target.value)}
                      placeholder='Type "DELETE_ALL_CONTENT" to confirm'
                      className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-700 placeholder:text-red-300 outline-none focus:ring-2 focus:ring-red-300"
                    />
                    <button
                      onClick={() => purgeMutation.mutate({ confirm: "DELETE_ALL_CONTENT" })}
                      disabled={purgeConfirm !== "DELETE_ALL_CONTENT" || purgeMutation.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
                    >
                      {purgeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Purge All
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
