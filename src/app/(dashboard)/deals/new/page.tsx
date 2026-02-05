"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Building2 } from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const FACILITY_TYPES = ["SNF", "ALF", "ILF", "Hospice", "In-Home"];

const TEMPLATES = [
  { id: "1", name: "Standard SNF Acquisition" },
  { id: "2", name: "Standard ALF Acquisition" },
  { id: "3", name: "Idaho CHOW Template" },
  { id: "4", name: "Montana CHOW Template" },
];

const TEAM_MEMBERS = [
  { id: "1", name: "Owen Richardson" },
  { id: "2", name: "Steve Anderson" },
  { id: "3", name: "Doug Martinez" },
  { id: "4", name: "Sarah Chen" },
  { id: "5", name: "Tim Brooks" },
  { id: "6", name: "James Peterson" },
];

export default function NewDealPage() {
  const [formData, setFormData] = useState({
    facilityName: "",
    facilityType: "",
    state: "",
    city: "",
    bedCount: "",
    currentOwner: "",
    targetCloseDate: "",
    purchasePrice: "",
    template: "",
    dealLead: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/deals"
          className="p-2 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-surface-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Create New Deal
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Set up a new facility acquisition
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="neu-card space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
          <Building2 className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            Facility Information
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Facility Name */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Facility Name
            </label>
            <input
              type="text"
              placeholder="e.g. Cedar Ridge Skilled Nursing Facility"
              value={formData.facilityName}
              onChange={(e) => handleChange("facilityName", e.target.value)}
              className="neu-input"
            />
          </div>

          {/* Facility Type */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Facility Type
            </label>
            <select
              value={formData.facilityType}
              onChange={(e) => handleChange("facilityType", e.target.value)}
              className="neu-input"
            >
              <option value="">Select type...</option>
              {FACILITY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              State
            </label>
            <select
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
              className="neu-input"
            >
              <option value="">Select state...</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              City
            </label>
            <input
              type="text"
              placeholder="e.g. Boise"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className="neu-input"
            />
          </div>

          {/* Bed Count */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Bed Count
            </label>
            <input
              type="number"
              placeholder="e.g. 120"
              value={formData.bedCount}
              onChange={(e) => handleChange("bedCount", e.target.value)}
              className="neu-input"
            />
          </div>

          {/* Current Owner */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Current Owner
            </label>
            <input
              type="text"
              placeholder="e.g. Sunrise Healthcare Group"
              value={formData.currentOwner}
              onChange={(e) => handleChange("currentOwner", e.target.value)}
              className="neu-input"
            />
          </div>

          {/* Target Close Date */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Target Close Date
            </label>
            <input
              type="date"
              value={formData.targetCloseDate}
              onChange={(e) => handleChange("targetCloseDate", e.target.value)}
              className="neu-input"
            />
          </div>

          {/* Purchase Price */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Purchase Price
            </label>
            <input
              type="text"
              placeholder="e.g. $4,500,000"
              value={formData.purchasePrice}
              onChange={(e) => handleChange("purchasePrice", e.target.value)}
              className="neu-input"
            />
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Template
            </label>
            <select
              value={formData.template}
              onChange={(e) => handleChange("template", e.target.value)}
              className="neu-input"
            >
              <option value="">Select template...</option>
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Deal Lead */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Deal Lead
            </label>
            <select
              value={formData.dealLead}
              onChange={(e) => handleChange("dealLead", e.target.value)}
              className="neu-input"
            >
              <option value="">Select lead...</option>
              {TEAM_MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-800">
          <Link
            href="/deals"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
          >
            Cancel
          </Link>
          <button className="neu-button-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Deal
          </button>
        </div>
      </div>
    </div>
  );
}
