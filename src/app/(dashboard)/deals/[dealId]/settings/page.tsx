"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Settings,
  Building2,
  Users,
  Bell,
  Trash2,
  Archive,
  Save,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";

const DEAL_STATUSES = [
  { value: "PIPELINE", label: "Pipeline" },
  { value: "LOI", label: "LOI" },
  { value: "DUE_DILIGENCE", label: "Due Diligence" },
  { value: "CHOW_FILED", label: "CHOW Filed" },
  { value: "CLOSING", label: "Closing" },
  { value: "TRANSITION_DAY", label: "Transition Day" },
  { value: "WEEK_1", label: "Week 1" },
  { value: "WEEK_2", label: "Week 2" },
  { value: "POST_CLOSE", label: "Post-Close" },
];

export default function DealSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.dealId as string;

  const { data: deal, isLoading } = trpc.deals.getById.useQuery(
    { id: dealId },
    { enabled: !!dealId }
  );

  const { data: teamData } = trpc.users.getTeamForDeal.useQuery(
    { dealId },
    { enabled: !!dealId }
  );

  const { data: allUsers } = trpc.users.list.useQuery({});

  const { can } = usePermissions();
  const utils = trpc.useUtils();

  const updateDeal = trpc.deals.update.useMutation({
    onSuccess: () => {
      utils.deals.getById.invalidate({ id: dealId });
    },
  });

  const archiveDeal = trpc.deals.archive.useMutation({
    onSuccess: () => {
      router.push("/deals");
    },
  });

  const deleteDeal = trpc.deals.delete.useMutation({
    onSuccess: () => {
      router.push("/deals");
    },
  });

  const [dealName, setDealName] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [status, setStatus] = useState("");
  const [dealLeadId, setDealLeadId] = useState("");
  const [notifyOnTask, setNotifyOnTask] = useState(true);
  const [notifyOnFile, setNotifyOnFile] = useState(true);
  const [notifyOnChat, setNotifyOnChat] = useState(false);
  const [notifyOnBlocked, setNotifyOnBlocked] = useState(true);

  const dealName_ = deal?.name ?? "";
  const facilityName_ = deal?.facilityName ?? "";
  const status_ = deal?.status ?? "";
  const dealLeadId_ = deal?.dealLeadId ?? "";
  useEffect(() => {
    if (deal) {
      setDealName(dealName_);
      setFacilityName(facilityName_);
      setStatus(status_);
      setDealLeadId(dealLeadId_);
    }
  }, [deal, dealName_, facilityName_, status_, dealLeadId_]);

  const handleSave = () => {
    updateDeal.mutate({
      id: dealId,
      name: dealName,
      facilityName,
      dealLeadId: dealLeadId || undefined,
    });
  };

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
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="neu-input"
            >
              {DEAL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
              Deal Lead
            </label>
            <select
              value={dealLeadId}
              onChange={(e) => setDealLeadId(e.target.value)}
              className="neu-input"
            >
              <option value="">Unassigned</option>
              {allUsers?.users?.map((u: { id: string; name: string }) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
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
          {teamData?.teamMembers && teamData.teamMembers.length > 0 ? (
            teamData.teamMembers.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{m.name}</p>
                  <p className="text-xs text-surface-400">{m.email}</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                  {m.role.replace(/_/g, " ")}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-surface-400 py-4 text-center">No team members assigned yet</p>
          )}
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
          {can("deals:archive") && (
            <button
              onClick={() => archiveDeal.mutate({ id: dealId })}
              disabled={archiveDeal.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
            >
              <Archive className="w-4 h-4" />
              {archiveDeal.isPending ? "Archiving..." : "Archive Deal"}
            </button>
          )}
          {can("deals:delete") && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete this deal? This action cannot be undone.")) {
                  deleteDeal.mutate({ id: dealId });
                }
              }}
              disabled={deleteDeal.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {deleteDeal.isPending ? "Deleting..." : "Delete Deal"}
            </button>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={updateDeal.isPending}
          className="neu-button-primary flex items-center gap-2"
        >
          {updateDeal.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {updateDeal.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
