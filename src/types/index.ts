import type { Session } from "next-auth";
import type { Decimal } from "@prisma/client/runtime/client";

// ============================================================================
// Session Extension Types
// ============================================================================

export interface AppSession extends Session {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    orgId: string;
  };
}

// ============================================================================
// User Info (lightweight, for relations)
// ============================================================================

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

// ============================================================================
// Deal Types
// ============================================================================

export interface DealWithRelations {
  id: string;
  orgId: string;
  name: string;
  facilityName: string;
  facilityType: string;
  state: string;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  bedCount: number | null;
  currentOwner: string | null;
  purchasePrice: Decimal | null;
  targetCloseDate: Date | null;
  actualCloseDate: Date | null;
  status: string;
  dealLeadId: string | null;
  regionId: string | null;
  templateId: string | null;
  transitionDayStartedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  dealLead: UserInfo | null;
  tasks: TaskWithRelations[];
  taskFiles: FileRecord[];
  chatChannels: ChatChannelWithMessages[];
  feedPosts: FeedPostRecord[];
  buildingAssignments: BuildingAssignmentRecord[];
  activityLogs: ActivityEntry[];
}

export interface DealInfo {
  id: string;
  name: string;
  facilityName: string;
  status: string;
}

// ============================================================================
// Task Types
// ============================================================================

export interface TaskWithRelations {
  id: string;
  dealId: string;
  templateTaskId: string | null;
  title: string;
  description: string | null;
  workstream: string;
  section: string | null;
  phase: string;
  assignedToId: string | null;
  dueDate: Date | null;
  completedDate: Date | null;
  completedById: string | null;
  status: string;
  priority: string;
  parentTaskId: string | null;
  sortOrder: number;
  indentLevel: number;
  notes: string | null;
  flagReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignedTo: UserInfo | null;
  completedBy: UserInfo | null;
  deal: DealInfo;
  childTasks: TaskWithRelations[];
  files: FileRecord[];
  comments: TaskCommentRecord[];
}

// ============================================================================
// File Types
// ============================================================================

export interface FileRecord {
  id: string;
  taskId: string | null;
  dealId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  description: string | null;
  tags: string[];
  isPhoto: boolean;
  gpsLat: number | null;
  gpsLon: number | null;
  createdAt: Date;
  uploadedBy: UserInfo;
}

// ============================================================================
// Chat Types
// ============================================================================

export interface ChatChannelWithMessages {
  id: string;
  dealId: string;
  name: string;
  channelType: string;
  createdAt: Date;
  messages: ChatMessageRecord[];
}

export interface ChatMessageRecord {
  id: string;
  channelId: string;
  userId: string;
  body: string;
  fileId: string | null;
  isSystemMessage: boolean;
  mentions: string[];
  createdAt: Date;
  user: UserInfo;
}

// ============================================================================
// Feed Types
// ============================================================================

export interface FeedPostRecord {
  id: string;
  dealId: string;
  userId: string;
  postType: string;
  body: string | null;
  taskId: string | null;
  fileId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  user: UserInfo;
}

// ============================================================================
// Activity Types
// ============================================================================

export interface ActivityEntry {
  id: string;
  dealId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  source: string;
  timestamp: Date;
  user: UserInfo | null;
}

// ============================================================================
// Building Assignment Types
// ============================================================================

export interface BuildingAssignmentRecord {
  id: string;
  dealId: string;
  userId: string;
  onSiteRole: string;
  isActive: boolean;
  assignedAt: Date;
  user: UserInfo;
}

// ============================================================================
// Task Comment Types
// ============================================================================

export interface TaskCommentRecord {
  id: string;
  taskId: string;
  userId: string;
  body: string;
  parentCommentId: string | null;
  createdAt: Date;
  user: UserInfo;
  replies: TaskCommentRecord[];
}

// ============================================================================
// Template Types
// ============================================================================

export interface TemplateRecord {
  id: string;
  orgId: string;
  name: string;
  templateType: string;
  facilityType: string | null;
  state: string | null;
  isDefault: boolean;
  version: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UserInfo | null;
  templateTasks: TemplateTaskRecord[];
}

export interface TemplateTaskRecord {
  id: string;
  templateId: string;
  workstream: string;
  section: string | null;
  title: string;
  description: string | null;
  parentTaskId: string | null;
  sortOrder: number;
  indentLevel: number;
  defaultRole: string | null;
  daysOffset: number;
  isRequired: boolean;
  isStateSpecific: boolean;
  facilityTypes: string[];
  requiresPhoto: boolean;
  phase: string;
  createdAt: Date;
}

// ============================================================================
// State Requirement Types
// ============================================================================

export interface StateRequirementRecord {
  id: string;
  orgId: string;
  stateCode: string;
  facilityType: string;
  licensingBody: string | null;
  licensingBodyUrl: string | null;
  contactInfo: Record<string, unknown> | null;
  chowFormUrl: string | null;
  requirementsChecklist: Record<string, unknown> | null;
  notificationsRequired: Record<string, unknown> | null;
  suretyBondRequired: boolean;
  suretyBondAmount: Decimal | null;
  conRequired: boolean;
  backgroundCheckRequired: boolean;
  processingTimelineDays: number | null;
  adminLicenseReqs: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Due Diligence Types
// ============================================================================

export interface DueDiligenceDocRecord {
  id: string;
  dealId: string;
  documentName: string;
  category: string;
  requestedDate: Date | null;
  receivedDate: Date | null;
  status: string;
  filePath: string | null;
  notes: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Component Prop Types
// ============================================================================

export interface DealCardProps {
  deal: DealWithRelations;
  onClick?: (dealId: string) => void;
}

export interface TaskListProps {
  tasks: TaskWithRelations[];
  onStatusChange?: (taskId: string, status: string) => void;
  onAssign?: (taskId: string, userId: string) => void;
}

export interface FileListProps {
  files: FileRecord[];
  onDelete?: (fileId: string) => void;
  onDownload?: (fileId: string) => void;
}

export interface ChatPanelProps {
  dealId: string;
  channel: string;
  messages: ChatMessageRecord[];
  onSend?: (content: string) => void;
}

export interface ActivityFeedProps {
  entries: ActivityEntry[];
  limit?: number;
}

export interface UserAvatarProps {
  user: UserInfo;
  size?: "sm" | "md" | "lg";
}

export interface StatusBadgeProps {
  status: string;
  type: "deal" | "task";
}

export interface WorkstreamFilterProps {
  selected: string[];
  onChange: (workstreams: string[]) => void;
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
