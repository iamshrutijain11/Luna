/**
 * LUNA Paperwork Assistant - TypeScript API & Data Models
 * Aligned with contracts/openapi.yaml, backend models, and 7-screen reference spec.
 */

// ─── OpenAPI Contract Types ──────────────────────────────────────────────────

export interface Citation {
  document_id: string;
  document_title: string;
  page: number;
  text_snippet: string;
}

export interface ChatRequest {
  conversation_id?: string;
  message: string;
  document_ids?: string[];
}

export interface ChatResponse {
  conversation_id: string;
  message: string;
  citations: Citation[];
  workflow_id?: string | null;
  suggested_actions: string[];
}

export interface ChatResponseEnvelope {
  success: boolean;
  data: ChatResponse;
  error?: string | null;
}

// ─── Document Models ─────────────────────────────────────────────────────────

export type DocumentType =
  | 'invoice'
  | 'warranty'
  | 'utility_bill'
  | 'insurance'
  | 'statement'
  | 'agreement'
  | 'health'
  | 'other';

export interface DocumentMetadata {
  id: string;
  title: string;
  document_type: DocumentType;
  file_name: string;
  upload_date: string;
  page_count: number;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  file_size?: string;
  tags?: string[];
}

export interface ExtractedField {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  confidence: number;
  page: number;
  raw_text: string;
}

export interface DocumentAnalysisData {
  document_id: string;
  document_type: DocumentType;
  title: string;
  page_count: number;
  confidence: 'High confidence' | 'Medium confidence' | 'Needs review';
  summary: string;
  vendor?: string;
  product?: string;
  amount?: string;
  issue_date?: string;
  warranty_period?: string;
  key_dates: {
    day: string;
    month: string;
    title: string;
    subtitle: string;
    badge: string;
    rawDate: string;
  }[];
  extracted_fields: Record<string, string>;
  details: {
    label: string;
    value: string;
    page: number;
  }[];
  citations: Citation[];
  missing_info: {
    field: string;
    importance: 'Required' | 'Optional';
    note: string;
  }[];
  raw_text_by_page: Record<number, string>;
}

export type DocumentAnalysis = DocumentAnalysisData;
export type WorkflowDraft = WorkflowItem;

// ─── Workflow Models ─────────────────────────────────────────────────────────

export type WorkflowType = 'warranty_claim' | 'billing_inquiry' | 'insurance_claim' | 'document_verification';
export type WorkflowStatus = 'All' | 'Draft' | 'Pending' | 'Completed' | 'Failed';

export interface WorkflowItem {
  id: string;
  title: string;
  workflow_type: WorkflowType;
  status: 'Draft' | 'Pending' | 'Completed' | 'Failed';
  related_document: string;
  document_id: string;
  created_at: string;
  formatted_date: string;
  issuer: string;
  description: string;
  parameters: Record<string, string>;
  required_checklist: {
    label: string;
    verified: boolean;
    evidence?: string;
  }[];
  missing_items: string[];
  is_approved: boolean;
  approval_date?: string;
}

// ─── Activity Audit Log Models ───────────────────────────────────────────────

export type ActivityCategory = 'All' | 'Documents' | 'Workflows' | 'Assistant' | 'Actions';

export interface ActivityEvent {
  id: string;
  category: 'Documents' | 'Workflows' | 'Assistant' | 'Actions';
  title: string;
  target: string;
  timestamp: string;
  formatted_time: string;
  relative_time: string;
  icon_type: 'upload' | 'analysis' | 'workflow' | 'assistant' | 'action';
  related_id?: string;
}

// ─── Assistant Chat Message Models ──────────────────────────────────────────

export interface AssistantChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: Citation[];
  workflow_id?: string | null;
  suggested_actions?: string[];
}

// ─── Settings Models ────────────────────────────────────────────────────────

export interface UserSettings {
  name: string;
  email: string;
  plan: string;
  theme: 'light' | 'dark' | 'lunar';
  glassmorphism: boolean;
  reducedMotion: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  deadlineReminderDays: number;
  voiceSynthesis: boolean;
  speechRate: number;
  speechPitch: number;
  alexaChime: boolean;
  dataRetentionDays: number;
  localVaultOnly: boolean;
}

// ─── Dashboard Overview Models ───────────────────────────────────────────────

export interface OverviewMetrics {
  totalDocuments: number;
  documentsThisMonth: number;
  pendingWorkflows: number;
  importantDatesCount: number;
  datesWithin30Days: number;
  actionsDueSoonCount: number;
  actionsDueToday: number;
}

export interface ImportantDateItem {
  id: string;
  title: string;
  issuer: string;
  category: 'Warranty' | 'Bill' | 'Insurance' | 'Tax' | 'Subscription';
  rawDate: string;
  day: string;
  month: string;
  badgeText: string;
  urgency: 'critical' | 'warning' | 'normal';
}

export interface RecentDocumentItem {
  id: string;
  title: string;
  fileName: string;
  uploadedAt: string;
  formattedDate: string;
  documentType: DocumentType;
  badgeLabel: string;
  badgeVariant: 'lavender' | 'amber' | 'coral' | 'rose' | 'emerald';
  fileSize?: string;
  pageCount?: number;
}

export interface UpcomingActionItem {
  id: string;
  title: string;
  description: string;
  category: 'review' | 'payment' | 'workflow' | 'upload';
  dueDate?: string;
  documentId?: string;
  workflowId?: string;
}
