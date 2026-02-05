"use client";

import { useState } from "react";
import {
  Settings,
  Building2,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Key,
  Save,
  Mail,
} from "lucide-react";

export default function OrgSettingsPage() {
  const [orgName, setOrgName] = useState("Hammy Healthcare Acquisitions");
  const [timezone, setTimezone] = useState("America/Boise");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [transitionAlerts, setTransitionAlerts] = useState(true);

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
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            Organization Name
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="neu-input"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="neu-input"
            >
              <option value="America/Boise">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Date Format
            </label>
            <select className="neu-input">
              <option>MMM DD, YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
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
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Two-Factor Authentication</p>
              <p className="text-xs text-surface-400">Require 2FA for all team members</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              Enabled
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Session Timeout</p>
              <p className="text-xs text-surface-400">Auto-logout after inactivity</p>
            </div>
            <select className="neu-input w-auto py-1.5 text-xs">
              <option>30 minutes</option>
              <option selected>1 hour</option>
              <option>4 hours</option>
              <option>8 hours</option>
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
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Storage Used</p>
              <p className="text-xs text-surface-400">Files and attachments</p>
            </div>
            <span className="text-sm text-surface-500">2.4 GB / 10 GB</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
            <div className="h-full rounded-full bg-primary-500" style={{ width: "24%" }} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Export All Data</p>
              <p className="text-xs text-surface-400">Download complete organization data as JSON</p>
            </div>
            <button className="flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors">
              <Globe className="w-3 h-3" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button className="neu-button-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
