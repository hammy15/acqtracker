"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Building2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const FACILITY_TYPES = [
  { value: "SNF", label: "SNF" },
  { value: "ALF", label: "ALF" },
  { value: "ILF", label: "ILF" },
  { value: "HOSPICE", label: "Hospice" },
  { value: "IN_HOME", label: "In-Home" },
] as const;

export default function NewDealPage() {
  const router = useRouter();

  const { data: templates, isLoading: templatesLoading } = trpc.templates.list.useQuery({});
  const { data: users, isLoading: usersLoading } = trpc.users.list.useQuery({});

  const createDeal = trpc.deals.create.useMutation({
    onSuccess: (newDeal) => {
      router.push(`/deals/${newDeal.id}`);
    },
  });

  const [formData, setFormData] = useState({
    name: "",
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

  const handleSubmit = () => {
    createDeal.mutate({
      name: formData.name || formData.facilityName,
      facilityName: formData.facilityName,
      facilityType: formData.facilityType as "SNF" | "ALF" | "ILF" | "HOSPICE" | "IN_HOME",
      state: formData.state,
      city: formData.city,
      bedCount: formData.bedCount ? parseInt(formData.bedCount, 10) : undefined,
      currentOwner: formData.currentOwner || undefined,
      targetCloseDate: formData.targetCloseDate || undefined,
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
      templateId: formData.template || undefined,
      dealLeadId: formData.dealLead || undefined,
    });
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

      {/* Error message */}
      {createDeal.error && (
        <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {createDeal.error.message}
        </div>
      )}

      {/* Form */}
      <div className="neu-card space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-surface-200 dark:border-surface-800">
          <Building2 className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            Facility Information
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Deal Name */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Deal Name
            </label>
            <input
              type="text"
              placeholder="e.g. Cedar Ridge Acquisition"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="neu-input"
            />
          </div>

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
                <option key={t.value} value={t.value}>{t.label}</option>
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
              disabled={templatesLoading}
            >
              <option value="">
                {templatesLoading ? "Loading templates..." : "Select template..."}
              </option>
              {(templates ?? []).map((t: any) => (
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
              disabled={usersLoading}
            >
              <option value="">
                {usersLoading ? "Loading team members..." : "Select lead..."}
              </option>
              {(users?.users ?? []).map((m: any) => (
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
          <button
            onClick={handleSubmit}
            disabled={createDeal.isPending || !formData.facilityName || !formData.facilityType || !formData.state || !formData.city}
            className="neu-button-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createDeal.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {createDeal.isPending ? "Creating..." : "Create Deal"}
          </button>
        </div>
      </div>
    </div>
  );
}
