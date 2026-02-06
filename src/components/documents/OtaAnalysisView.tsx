"use client";

import { useState } from "react";
import {
  ChevronDown,
  AlertTriangle,
  Shield,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Users,
  DollarSign,
  Scale,
  Settings,
  Clock,
  Gavel,
  TrendingUp,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OtaAnalysisViewProps {
  analysis: {
    id: string;
    summary: string;
    sections: {
      staffing: { title: string; detail: string }[];
      financial: { title: string; detail: string }[];
      regulatory: { title: string; detail: string }[];
      operations: { title: string; detail: string }[];
      timeline: { title: string; detail: string }[];
      legal: { title: string; detail: string }[];
    };
    risks: { title: string; severity: string; description: string; recommendation: string }[];
    compliance: { regulation: string; concern: string; severity: string }[];
    agreedVsOpen: {
      agreed: { item: string; detail: string; reference?: string }[];
      notAgreed: { item: string; detail: string; reference?: string }[];
      ambiguous: { item: string; detail: string; reference?: string }[];
    };
    operationalImpact: { area: string; term: string; impact: string; actionRequired: string }[];
    tokensUsed: number;
    createdAt: string;
  };
  documentId: string;
}

const severityConfig = {
  low: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Low" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Medium" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "High" },
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Critical" },
};

const sectionIcons: Record<string, React.ReactNode> = {
  staffing: <Users className="w-4 h-4" />,
  financial: <DollarSign className="w-4 h-4" />,
  regulatory: <Shield className="w-4 h-4" />,
  operations: <Settings className="w-4 h-4" />,
  timeline: <Clock className="w-4 h-4" />,
  legal: <Gavel className="w-4 h-4" />,
};

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{icon}</span>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          {badge}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">{children}</div>}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.medium;
  return (
    <span className={cn("inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full", config.bg, config.text)}>
      {config.label}
    </span>
  );
}

export function OtaAnalysisView({ analysis, documentId }: OtaAnalysisViewProps) {
  return (
    <div id={`ota-analysis-${documentId}`} className="space-y-4">
      {/* Summary */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-black/[0.03]">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-500" />
          OTA Summary
        </h3>
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {analysis.summary}
        </div>
      </div>

      {/* Risk Flags - always expanded by default */}
      {analysis.risks.length > 0 && (
        <CollapsibleSection
          title="Risk Flags"
          icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
          defaultOpen={true}
          badge={
            <span className="text-[11px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              {analysis.risks.length} found
            </span>
          }
        >
          <div className="space-y-3">
            {analysis.risks.map((risk, i) => {
              const sev = severityConfig[risk.severity as keyof typeof severityConfig] || severityConfig.medium;
              return (
                <div key={i} className={cn("rounded-lg border p-3", sev.border, sev.bg)}>
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={risk.severity} />
                    <span className="text-sm font-medium text-gray-900">{risk.title}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{risk.description}</p>
                  <p className="text-xs text-gray-800 font-medium">
                    Recommendation: {risk.recommendation}
                  </p>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Agreed vs Open */}
      <CollapsibleSection
        title="Agreement Status"
        icon={<Scale className="w-4 h-4 text-blue-500" />}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Agreed */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-800">
                Agreed ({analysis.agreedVsOpen.agreed.length})
              </span>
            </div>
            <div className="space-y-2">
              {analysis.agreedVsOpen.agreed.map((item, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-green-900">{item.item}</p>
                  <p className="text-[11px] text-green-700">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Not Agreed */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <XCircle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-800">
                Not Agreed ({analysis.agreedVsOpen.notAgreed.length})
              </span>
            </div>
            <div className="space-y-2">
              {analysis.agreedVsOpen.notAgreed.map((item, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-amber-900">{item.item}</p>
                  <p className="text-[11px] text-amber-700">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ambiguous */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <HelpCircle className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-700">
                Ambiguous ({analysis.agreedVsOpen.ambiguous.length})
              </span>
            </div>
            <div className="space-y-2">
              {analysis.agreedVsOpen.ambiguous.map((item, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-gray-800">{item.item}</p>
                  <p className="text-[11px] text-gray-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Term Sections */}
      {Object.entries(analysis.sections).map(([key, items]) => {
        if (!items || items.length === 0) return null;
        return (
          <CollapsibleSection
            key={key}
            title={key.charAt(0).toUpperCase() + key.slice(1)}
            icon={sectionIcons[key] || <FileText className="w-4 h-4" />}
            badge={
              <span className="text-[11px] text-gray-400">{items.length} items</span>
            }
          >
            <div className="space-y-2">
              {items.map((item: any, i: number) => (
                <div key={i} className="rounded-lg bg-white border border-gray-100 px-3 py-2">
                  <p className="text-xs font-medium text-gray-900">{item.title}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{item.detail}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        );
      })}

      {/* Compliance */}
      {analysis.compliance.length > 0 && (
        <CollapsibleSection
          title="Compliance Concerns"
          icon={<Shield className="w-4 h-4 text-violet-500" />}
          badge={
            <span className="text-[11px] font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
              {analysis.compliance.length}
            </span>
          }
        >
          <div className="space-y-2">
            {analysis.compliance.map((item, i) => (
              <div key={i} className="rounded-lg bg-white border border-gray-100 px-3 py-2 flex items-start gap-2">
                <SeverityBadge severity={item.severity} />
                <div>
                  <p className="text-xs font-medium text-gray-900">{item.regulation}</p>
                  <p className="text-[11px] text-gray-600">{item.concern}</p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Operational Impact */}
      {analysis.operationalImpact.length > 0 && (
        <CollapsibleSection
          title="Operational Impact"
          icon={<TrendingUp className="w-4 h-4 text-teal-500" />}
        >
          <div className="space-y-2">
            {analysis.operationalImpact.map((item, i) => (
              <div key={i} className="rounded-lg bg-white border border-gray-100 px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-medium text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">{item.area}</span>
                  <span className="text-xs font-medium text-gray-900">{item.term}</span>
                </div>
                <p className="text-[11px] text-gray-600">{item.impact}</p>
                <p className="text-[11px] text-gray-800 font-medium mt-1">Action: {item.actionRequired}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
