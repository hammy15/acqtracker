// ============================================================================
// Deal Status
// ============================================================================

export const DEAL_STATUS_LABELS: Record<string, string> = {
  PIPELINE: "Pipeline",
  LOI: "LOI",
  DUE_DILIGENCE: "Due Diligence",
  CHOW_FILED: "CHOW Filed",
  CLOSING: "Closing",
  TRANSITION_DAY: "Transition Day",
  WEEK_1: "Week 1",
  WEEK_2: "Week 2",
  POST_CLOSE: "Post-Close",
  ARCHIVED: "Archived",
};

export const DEAL_STATUS_COLORS: Record<string, string> = {
  PIPELINE: "bg-muted text-muted-foreground",
  LOI: "bg-chart-1/15 text-chart-1",
  DUE_DILIGENCE: "bg-primary/10 text-primary",
  CHOW_FILED: "bg-chart-4/15 text-chart-4",
  CLOSING: "bg-chart-3/15 text-chart-3",
  TRANSITION_DAY: "bg-chart-2/15 text-chart-2",
  WEEK_1: "bg-accent text-accent-foreground",
  WEEK_2: "bg-accent text-accent-foreground",
  POST_CLOSE: "bg-chart-2/20 text-chart-2",
  ARCHIVED: "bg-destructive/15 text-destructive",
};

// ============================================================================
// Task Status
// ============================================================================

export const TASK_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETE: "Complete",
  NA: "N/A",
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-chart-1/15 text-chart-1",
  BLOCKED: "bg-destructive/15 text-destructive",
  COMPLETE: "bg-chart-2/20 text-chart-2",
  NA: "bg-muted/50 text-muted-foreground/70",
};

// ============================================================================
// Task Priority
// ============================================================================

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-chart-4/15 text-chart-4",
  HIGH: "bg-chart-1/15 text-chart-1",
  CRITICAL: "bg-destructive/15 text-destructive",
};

// ============================================================================
// Facility Types
// ============================================================================

export const FACILITY_TYPE_LABELS: Record<string, string> = {
  SNF: "Skilled Nursing Facility",
  ALF: "Assisted Living Facility",
  ILF: "Independent Living Facility",
  HOSPICE: "Hospice",
  IN_HOME: "In-Home Care",
};

// ============================================================================
// Workstreams
// ============================================================================

export const WORKSTREAM_LIST = [
  "Administration",
  "Operations",
  "Central Supply",
  "Dietary",
  "Laundry/Housekeeping",
  "Accounting",
  "Documents Required",
  "Timelines/Milestones",
] as const;

export type Workstream = (typeof WORKSTREAM_LIST)[number];

// ============================================================================
// Default Chat Channels
// ============================================================================

export const DEFAULT_CHANNELS = {
  PRE_CLOSE: [
    "general",
    "due-diligence",
    "legal",
    "finance",
    "regulatory",
    "operations",
  ],
  TRANSITION_DAY: [
    "general",
    "staffing",
    "it-systems",
    "vendor-setup",
    "compliance",
    "go-live",
  ],
} as const;

// ============================================================================
// Pagination Defaults
// ============================================================================

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// ============================================================================
// File Upload Limits
// ============================================================================

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
];
