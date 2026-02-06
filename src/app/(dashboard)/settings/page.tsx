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

export default function OrgSettingsPage() {
  const { can } = usePermissions();
  const { data: settings, isLoading } = trpc.orgSettings.get.useQuery();
  const utils = trpc.useUtils();

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
        const raw = (settings as any)[tab.key];
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
      field: activeListTab as any,
      items: updated,
    });
  };

  const removeItem = (id: string) => {
    const updated = currentList.filter((item) => item.id !== id);
    setListItems({ ...listItems, [activeListTab]: updated });
    updateListMutation.mutate({
      field: activeListTab as any,
      items: updated,
    });
  };

  const toggleItem = (id: string) => {
    const updated = currentList.map((item) =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );
    setListItems({ ...listItems, [activeListTab]: updated });
    updateListMutation.mutate({
      field: activeListTab as any,
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
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary-500" />
          Organization Settings
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Manage your organization preferences and configuration
        </p>
      </div>

      {/* Organization Details */}
      <div className="neu-card space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
          <Building2 className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Organization</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Timezone
            </label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="neu-input">
              <option value="America/Boise">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Date Format
            </label>
            <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="neu-input">
              <option value="MMM DD, YYYY">MMM DD, YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Configurable Lists */}
      <div className="neu-card space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
          <List className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Configurable Lists</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {LIST_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveListTab(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                activeListTab === tab.key
                  ? "bg-primary-500 text-white"
                  : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-surface-400">
          {LIST_TABS.find((t) => t.key === activeListTab)?.description}
        </p>
        <div className="space-y-2">
          {currentList.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg border transition-colors",
                item.isActive
                  ? "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900"
                  : "border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                {item.color && (
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                )}
                <span
                  className={cn(
                    "text-sm",
                    item.isActive
                      ? "text-surface-900 dark:text-surface-100"
                      : "text-surface-400 line-through"
                  )}
                >
                  {item.label}
                </span>
                {item.isDefault && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary-50 text-primary-600">
                    Default
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    "text-xs px-2 py-1 rounded",
                    item.isActive
                      ? "text-amber-600 hover:bg-amber-50"
                      : "text-emerald-600 hover:bg-emerald-50"
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
            className="neu-input flex-1"
          />
          <button
            onClick={addItem}
            disabled={!newItemLabel.trim()}
            className="neu-button-primary flex items-center gap-1 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="neu-card space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
          <Bell className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Notifications</h2>
        </div>
        {[
          { label: "Email notifications for task assignments", checked: emailNotifs, onChange: setEmailNotifs, icon: Mail },
          { label: "Daily digest summary", checked: dailyDigest, onChange: setDailyDigest, icon: Mail },
          { label: "Weekly progress report", checked: weeklyReport, onChange: setWeeklyReport, icon: Mail },
          { label: "Transition day real-time alerts", checked: transitionAlerts, onChange: setTransitionAlerts, icon: Bell },
        ].map((n, i) => (
          <label key={i} className="flex items-center justify-between py-1 cursor-pointer">
            <span className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300">
              <n.icon className="w-4 h-4 text-surface-400" />
              {n.label}
            </span>
            <input
              type="checkbox"
              checked={n.checked}
              onChange={(e) => n.onChange(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-surface-300 dark:border-surface-600 text-primary-500 focus:ring-primary-500"
            />
          </label>
        ))}
      </div>

      {/* Security */}
      <div className="neu-card space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
          <Shield className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Security</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Session Timeout</p>
              <p className="text-xs text-surface-400">Auto-logout after inactivity</p>
            </div>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Number(e.target.value))}
              className="neu-input w-auto py-1.5 text-xs"
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
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">API Keys</p>
              <p className="text-xs text-surface-400">Manage integration API keys</p>
            </div>
            <button className="flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors">
              <Key className="w-3 h-3" />
              Manage
            </button>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="neu-card space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
          <Database className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Data &amp; Storage</h2>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Export All Data</p>
            <p className="text-xs text-surface-400">Download complete organization data as JSON</p>
          </div>
          <button className="flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors">
            <Database className="w-3 h-3" />
            Export
          </button>
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
          className="neu-button-primary flex items-center gap-2 disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Settings
        </button>
      </div>
    </div>
  );
}
