"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Settings,
  Building2,
  Users,
  Bell,
  Trash2,
  Archive,
  Save,
} from "lucide-react";

export default function DealSettingsPage() {
  const params = useParams();
  const [dealName, setDealName] = useState("Cedar Ridge SNF Acquisition");
  const [facilityName, setFacilityName] = useState("Cedar Ridge Skilled Nursing Facility");
  const [notifyOnTask, setNotifyOnTask] = useState(true);
  const [notifyOnFile, setNotifyOnFile] = useState(true);
  const [notifyOnChat, setNotifyOnChat] = useState(false);
  const [notifyOnBlocked, setNotifyOnBlocked] = useState(true);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary-500" />
          Deal Settings
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Manage deal configuration and preferences
        </p>
      </div>

      {/* General */}
      <div className="neu-card space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
          <Building2 className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">General</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            Deal Name
          </label>
          <input
            type="text"
            value={dealName}
            onChange={(e) => setDealName(e.target.value)}
            className="neu-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            Facility Name
          </label>
          <input
            type="text"
            value={facilityName}
            onChange={(e) => setFacilityName(e.target.value)}
            className="neu-input"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Deal Status
            </label>
            <select className="neu-input">
              <option>Pipeline</option>
              <option>LOI</option>
              <option>Due Diligence</option>
              <option selected>CHOW Filed</option>
              <option>Closing</option>
              <option>Transition Day</option>
              <option>Post-Close</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Deal Lead
            </label>
            <select className="neu-input">
              <option selected>Owen Richardson</option>
              <option>Steve Anderson</option>
              <option>Doug Martinez</option>
              <option>Sarah Chen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Team Access */}
      <div className="neu-card space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
          <Users className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Team Access</h2>
        </div>
        <div className="space-y-3">
          {[
            { name: "Owen Richardson", role: "Owner", email: "owen@company.com" },
            { name: "Steve Anderson", role: "Admin", email: "steve@company.com" },
            { name: "Doug Martinez", role: "Member", email: "doug@company.com" },
            { name: "Sarah Chen", role: "Member", email: "sarah@company.com" },
            { name: "Tim Brooks", role: "Member", email: "tim@company.com" },
            { name: "James Peterson", role: "Member", email: "james@company.com" },
          ].map((m, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{m.name}</p>
                <p className="text-xs text-surface-400">{m.email}</p>
              </div>
              <select className="neu-input w-auto py-1.5 text-xs">
                <option selected={m.role === "Owner"}>Owner</option>
                <option selected={m.role === "Admin"}>Admin</option>
                <option selected={m.role === "Member"}>Member</option>
                <option>Viewer</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="neu-card space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
          <Bell className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Notifications</h2>
        </div>
        {[
          { label: "Task completions", checked: notifyOnTask, onChange: setNotifyOnTask },
          { label: "File uploads", checked: notifyOnFile, onChange: setNotifyOnFile },
          { label: "Chat messages", checked: notifyOnChat, onChange: setNotifyOnChat },
          { label: "Blocked items", checked: notifyOnBlocked, onChange: setNotifyOnBlocked },
        ].map((n, i) => (
          <label key={i} className="flex items-center justify-between py-1 cursor-pointer">
            <span className="text-sm text-surface-700 dark:text-surface-300">{n.label}</span>
            <input
              type="checkbox"
              checked={n.checked}
              onChange={(e) => n.onChange(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-surface-300 dark:border-surface-600 text-primary-500 focus:ring-primary-500"
            />
          </label>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
            <Archive className="w-4 h-4" />
            Archive Deal
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete Deal
          </button>
        </div>
        <button className="neu-button-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}
