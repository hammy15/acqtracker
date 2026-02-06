"use client";

import { useParams } from "next/navigation";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Upload,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { OtaUploadSection } from "@/components/documents/OtaUploadSection";
import { OtaAnalysisView } from "@/components/documents/OtaAnalysisView";

type DocStatus = "received" | "pending" | "overdue" | "not_applicable" | "under_review";

const statusConfig: Record<DocStatus, { label: string; icon: React.ReactNode; classes: string }> = {
  received: {
    label: "Received",
    icon: <CheckCircle2 className="w-4 h-4" />,
    classes: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
  },
  pending: {
    label: "Pending",
    icon: <Clock className="w-4 h-4" />,
    classes: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
  },
  overdue: {
    label: "Overdue",
    icon: <AlertTriangle className="w-4 h-4" />,
    classes: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30",
  },
  not_applicable: {
    label: "N/A",
    icon: <XCircle className="w-4 h-4" />,
    classes: "text-surface-400 bg-surface-100 dark:bg-surface-800",
  },
  under_review: {
    label: "Under Review",
    icon: <Eye className="w-4 h-4" />,
    classes: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
  },
};

interface DocRow {
  name: string;
  category: string;
  status: DocStatus;
  dueDate: string;
  assignee: string;
  notes: string;
}

const mockDocuments: DocRow[] = [
  { name: "Articles of Incorporation", category: "Corporate", status: "received", dueDate: "Jan 15", assignee: "Owen", notes: "" },
  { name: "Operating Agreement", category: "Corporate", status: "received", dueDate: "Jan 20", assignee: "Steve", notes: "" },
  { name: "Certificate of Good Standing", category: "Corporate", status: "received", dueDate: "Jan 25", assignee: "Owen", notes: "" },
  { name: "Financial Statements (3 years)", category: "Financial", status: "received", dueDate: "Feb 01", assignee: "Sarah", notes: "" },
  { name: "Tax Returns (3 years)", category: "Financial", status: "received", dueDate: "Feb 01", assignee: "Sarah", notes: "" },
  { name: "Accounts Receivable Aging", category: "Financial", status: "under_review", dueDate: "Feb 05", assignee: "Sarah", notes: "Reviewing discrepancies" },
  { name: "Accounts Payable Summary", category: "Financial", status: "pending", dueDate: "Feb 10", assignee: "Sarah", notes: "Requested from seller" },
  { name: "Medicare Cost Reports", category: "Financial", status: "overdue", dueDate: "Feb 01", assignee: "Doug", notes: "Seller delayed" },
  { name: "Property Title Report", category: "Real Estate", status: "received", dueDate: "Jan 30", assignee: "James", notes: "" },
  { name: "Phase I Environmental", category: "Real Estate", status: "received", dueDate: "Feb 08", assignee: "James", notes: "" },
  { name: "Property Appraisal", category: "Real Estate", status: "under_review", dueDate: "Feb 14", assignee: "Doug", notes: "" },
  { name: "Survey / Plat Map", category: "Real Estate", status: "pending", dueDate: "Feb 20", assignee: "James", notes: "" },
  { name: "Current License", category: "Regulatory", status: "received", dueDate: "Jan 10", assignee: "Steve", notes: "" },
  { name: "Last Survey Report", category: "Regulatory", status: "received", dueDate: "Jan 10", assignee: "Steve", notes: "" },
  { name: "Plan of Correction", category: "Regulatory", status: "received", dueDate: "Jan 15", assignee: "Steve", notes: "" },
  { name: "Fire Safety Inspection", category: "Regulatory", status: "pending", dueDate: "Feb 25", assignee: "James", notes: "" },
  { name: "Employee Census", category: "HR", status: "received", dueDate: "Feb 01", assignee: "Tim", notes: "" },
  { name: "Benefits Summary", category: "HR", status: "received", dueDate: "Feb 05", assignee: "Tim", notes: "" },
  { name: "Union Agreements", category: "HR", status: "not_applicable", dueDate: "-", assignee: "-", notes: "Non-union facility" },
  { name: "Resident Census", category: "Clinical", status: "received", dueDate: "Feb 01", assignee: "Doug", notes: "" },
  { name: "Payor Mix Report", category: "Clinical", status: "under_review", dueDate: "Feb 10", assignee: "Doug", notes: "" },
  { name: "Managed Care Contracts", category: "Clinical", status: "pending", dueDate: "Feb 28", assignee: "Doug", notes: "" },
];

export default function DocumentsPage() {
  const params = useParams();
  const dealId = params.dealId as string;

  const { data: otaDocs } = trpc.ota.getByDeal.useQuery({ dealId });

  const categories = Array.from(new Set(mockDocuments.map((d) => d.category)));

  const getCategoryStats = (cat: string) => {
    const docs = mockDocuments.filter((d) => d.category === cat);
    const received = docs.filter((d) => d.status === "received").length;
    return { received, total: docs.length };
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* OTA Upload & Analysis */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-500" />
            Operations Transfer Agreement
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload OTA documents for AI-powered analysis
          </p>
        </div>
        <OtaUploadSection dealId={dealId} />
        {/* Render analysis for each completed OTA doc */}
        {otaDocs?.filter((d: any) => d.status === "COMPLETE" && d.analysis).map((doc: any) => (
          <OtaAnalysisView key={doc.id} analysis={doc.analysis} documentId={doc.id} />
        ))}
      </div>

      <hr className="border-gray-200" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary-500" />
            Due Diligence Documents
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Track and manage all required due diligence documents
          </p>
        </div>
        <button className="neu-button-primary flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Request Document
        </button>
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((cat) => {
          const stats = getCategoryStats(cat);
          return (
            <div key={cat} className="neu-card text-center">
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">
                {cat}
              </p>
              <p className="text-lg font-bold text-surface-900 dark:text-surface-100 mt-1">
                {stats.received}/{stats.total}
              </p>
            </div>
          );
        })}
      </div>

      {/* Documents Table */}
      <div className="neu-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-800">
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
                  Document
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
                  Due
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
                  Assignee
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800/50">
              {mockDocuments.map((doc, i) => {
                const st = statusConfig[doc.status];
                return (
                  <tr
                    key={i}
                    className="hover:bg-surface-50 dark:hover:bg-surface-900/20 transition-colors"
                  >
                    <td className="px-6 py-3 text-sm font-medium text-surface-900 dark:text-surface-100">
                      {doc.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-500 dark:text-surface-400">
                      {doc.category}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full", st.classes)}>
                        {st.icon}
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-500 dark:text-surface-400">
                      {doc.dueDate}
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-500 dark:text-surface-400">
                      {doc.assignee}
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-400 italic">
                      {doc.notes || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
