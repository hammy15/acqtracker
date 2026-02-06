"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, ChevronRight, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface OtaUploadSectionProps {
  dealId: string;
}

export function OtaUploadSection({ dealId }: OtaUploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: otaDocs, isLoading } = trpc.ota.getByDeal.useQuery({ dealId });
  const deleteMutation = trpc.ota.delete.useMutation({
    onSuccess: () => utils.ota.getByDeal.invalidate({ dealId }),
  });

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.includes("pdf")) {
      setUploadError("Only PDF files are accepted");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError("File must be under 50MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dealId", dealId);

      const res = await fetch("/api/ota/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      utils.ota.getByDeal.invalidate({ dealId });
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [dealId, utils]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  }, [handleUpload]);

  const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    UPLOADING: { label: "Uploading...", color: "text-blue-600", icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    EXTRACTING: { label: "Extracting text...", color: "text-amber-600", icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    ANALYZING: { label: "AI analyzing...", color: "text-violet-600", icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    COMPLETE: { label: "Analysis ready", color: "text-emerald-600", icon: <CheckCircle2 className="w-4 h-4" /> },
    ERROR: { label: "Error", color: "text-red-600", icon: <AlertCircle className="w-4 h-4" /> },
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-8 text-center transition-all",
          isDragging
            ? "border-teal-400 bg-teal-50"
            : "border-gray-200 bg-white hover:border-gray-300",
          isUploading && "opacity-60 pointer-events-none"
        )}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={onFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          ) : (
            <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center">
              <Upload className="w-6 h-6 text-teal-500" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isUploading ? "Uploading & analyzing..." : "Upload Operations Transfer Agreement"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Drop a PDF here or click to browse. Max 50MB.
            </p>
          </div>
        </div>
        {uploadError && (
          <p className="mt-3 text-xs text-red-500 flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3" /> {uploadError}
          </p>
        )}
      </div>

      {/* Existing OTA Documents */}
      {isLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : otaDocs && otaDocs.length > 0 ? (
        <div className="space-y-3">
          {otaDocs.map((doc: any) => {
            const st = statusLabels[doc.status] || statusLabels.ERROR;
            return (
              <div
                key={doc.id}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-4 flex items-center justify-between shadow-sm shadow-black/[0.03] hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-xs flex items-center gap-1", st.color)}>
                        {st.icon} {st.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.status === "COMPLETE" && doc.analysis && (
                    <a
                      href={`#ota-analysis-${doc.id}`}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                    >
                      View Analysis <ChevronRight className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Delete this document?")) {
                        deleteMutation.mutate({ id: doc.id });
                      }
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
