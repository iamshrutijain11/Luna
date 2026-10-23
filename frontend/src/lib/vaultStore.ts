/**
 * LUNA Vault Store - Manages document records, workflows, activity feed, and settings.
 * Aligned with the 7-screen LUNA hackathon design specification.
 */

import {
  ImportantDateItem,
  RecentDocumentItem,
  UpcomingActionItem,
  OverviewMetrics,
  DocumentAnalysisData,
  WorkflowItem,
  ActivityEvent,
  UserSettings,
  AssistantChatMessage,
} from '../types/api';

const STORAGE_KEY = 'luna_vault_state_v2';

// ─── 1. Reference Documents (Matching Screen 2 Grid) ──────────────────────────
export const INITIAL_DOCUMENTS: RecentDocumentItem[] = [
  {
    id: 'doc_inv_101',
    title: 'Laptop Invoice',
    fileName: 'Laptop Invoice.pdf',
    uploadedAt: '2026-10-19T10:24:00Z',
    formattedDate: '2 days ago',
    documentType: 'invoice',
    badgeLabel: 'Invoice',
    badgeVariant: 'lavender',
    fileSize: '1.2 MB',
    pageCount: 3,
  },
  {
    id: 'doc_war_102',
    title: 'TV Warranty',
    fileName: 'TV Warranty.pdf',
    uploadedAt: '2026-10-14T15:30:00Z',
    formattedDate: '1 week ago',
    documentType: 'warranty',
    badgeLabel: 'Warranty',
    badgeVariant: 'amber',
    fileSize: '900 KB',
    pageCount: 2,
  },
  {
    id: 'doc_ins_301',
    title: 'Car Insurance',
    fileName: 'Car Insurance.pdf',
    uploadedAt: '2026-10-14T14:00:00Z',
    formattedDate: '1 week ago',
    documentType: 'insurance',
    badgeLabel: 'Insurance',
    badgeVariant: 'rose',
    fileSize: '1.5 MB',
    pageCount: 4,
  },
  {
    id: 'doc_bill_201',
    title: 'Electricity Bill',
    fileName: 'Electricity Bill.pdf',
    uploadedAt: '2026-10-07T11:15:00Z',
    formattedDate: '2 weeks ago',
    documentType: 'utility_bill',
    badgeLabel: 'Bill',
    badgeVariant: 'coral',
    fileSize: '650 KB',
    pageCount: 2,
  },
  {
    id: 'doc_med_401',
    title: 'Medical Report',
    fileName: 'Medical Report.pdf',
    uploadedAt: '2026-10-07T09:30:00Z',
    formattedDate: '2 weeks ago',
    documentType: 'health',
    badgeLabel: 'Health',
    badgeVariant: 'emerald',
    fileSize: '1.1 MB',
    pageCount: 2,
  },
  {
    id: 'doc_agr_501',
    title: 'Rent Agreement',
    fileName: 'Rent Agreement.pdf',
    uploadedAt: '2026-09-30T16:00:00Z',
    formattedDate: '3 weeks ago',
    documentType: 'agreement',
    badgeLabel: 'Agreement',
    badgeVariant: 'lavender',
    fileSize: '2.4 MB',
    pageCount: 6,
  },
  {
    id: 'doc_bill_202',
    title: 'Phone Bill',
    fileName: 'Phone Bill.pdf',
    uploadedAt: '2026-09-30T10:00:00Z',
    formattedDate: '3 weeks ago',
    documentType: 'utility_bill',
    badgeLabel: 'Bill',
    badgeVariant: 'coral',
    fileSize: '700 KB',
    pageCount: 1,
  },
  {
    id: 'doc_stmt_601',
    title: 'Bank Statement',
    fileName: 'Bank Statement.pdf',
    uploadedAt: '2026-09-21T12:00:00Z',
    formattedDate: '1 month ago',
    documentType: 'statement',
    badgeLabel: 'Statement',
    badgeVariant: 'amber',
    fileSize: '1.8 MB',
    pageCount: 5,
  },
];

// ─── 2. Reference Important Dates (Matching Screen 1) ────────────────────────
export const INITIAL_IMPORTANT_DATES: ImportantDateItem[] = [
  {
    id: 'date_1',
    title: 'Laptop warranty expires',
    issuer: 'TechWorld · Warranty',
    category: 'Warranty',
    rawDate: '2026-10-15',
    day: '15',
    month: 'OCT',
    badgeText: 'in 12 days',
    urgency: 'critical',
  },
  {
    id: 'date_2',
    title: 'Electricity bill due',
    issuer: 'BSES · Bill',
    category: 'Bill',
    rawDate: '2026-10-25',
    day: '25',
    month: 'OCT',
    badgeText: 'in 22 days',
    urgency: 'warning',
  },
  {
    id: 'date_3',
    title: 'Car insurance renewal',
    issuer: 'ICICI Lombard · Insurance',
    category: 'Insurance',
    rawDate: '2026-11-12',
    day: '12',
    month: 'NOV',
    badgeText: 'in 1 month',
    urgency: 'normal',
  },
];

// ─── 3. Reference Upcoming Actions (Matching Screen 1) ───────────────────────
export const INITIAL_UPCOMING_ACTIONS: UpcomingActionItem[] = [
  {
    id: 'act_1',
    title: 'Review laptop warranty',
    description: 'Verify coverage and expiry date',
    category: 'review',
    documentId: 'doc_inv_101',
    workflowId: 'wf_1',
  },
  {
    id: 'act_2',
    title: 'Pay electricity bill',
    description: 'Due on 25 Oct 2026',
    category: 'payment',
    documentId: 'doc_bill_201',
  },
  {
    id: 'act_3',
    title: 'Complete insurance workflow',
    description: 'Needs additional document',
    category: 'workflow',
    workflowId: 'wf_2',
  },
];

// ─── 4. Reference Workflows (Matching Screen 5) ──────────────────────────────
export const INITIAL_WORKFLOWS: WorkflowItem[] = [
  {
    id: 'wf_1',
    title: 'Laptop Warranty Claim',
    workflow_type: 'warranty_claim',
    status: 'Pending',
    related_document: 'Laptop Invoice.pdf',
    document_id: 'doc_inv_101',
    created_at: '2026-10-19T10:26:00Z',
    formatted_date: 'Created 2 days ago',
    issuer: 'TechWorld',
    description: 'Hardware repair claim preparation for Dell XPS screen flicker.',
    parameters: {
      'Product': 'Laptop - XYZ Model',
      'Serial Number': 'SN-TECH-88291X',
      'Defect Description': 'Screen flickering intermittently during heavy load',
      'Service Provider': 'TechWorld Authorized Service Center',
      'Estimated Cost': 'Covered under basic 1-year terms',
    },
    required_checklist: [
      { label: 'Original purchase invoice present', verified: true, evidence: 'Page 1, Invoice #INV-2026-001' },
      { label: 'Warranty coverage window active', verified: true, evidence: 'Valid until 15 Aug 2027' },
      { label: 'Serial number verified on invoice', verified: true, evidence: 'SN-TECH-88291X' },
      { label: 'Defect excluded from accidental damage exclusions', verified: true, evidence: 'Hardware screen component failure' },
    ],
    missing_items: ['Diagnostic photo/video of screen flicker symptom'],
    is_approved: false,
  },
  {
    id: 'wf_2',
    title: 'Insurance Claim',
    workflow_type: 'insurance_claim',
    status: 'Draft',
    related_document: 'Car Insurance.pdf',
    document_id: 'doc_ins_301',
    created_at: '2026-10-16T14:30:00Z',
    formatted_date: 'Created 5 days ago',
    issuer: 'ICICI Lombard',
    description: 'Motor vehicle repair reimbursement draft for bumper damage.',
    parameters: {
      'Policy Number': 'POL-MOT-99210-A',
      'Vehicle': 'Sedan - Registration UP-78-AB-1234',
      'Incident Date': '12 Oct 2026',
      'Claim Amount': '₹12,450',
    },
    required_checklist: [
      { label: 'Active policy certificate', verified: true, evidence: 'Car Insurance.pdf' },
      { label: 'Valid driving license copy', verified: true, evidence: 'Verified via DigiLocker' },
      { label: 'Repair invoice from authorized workshop', verified: false },
    ],
    missing_items: ['Workshop repair estimate / invoice copy'],
    is_approved: false,
  },
  {
    id: 'wf_3',
    title: 'Bill Payment Request',
    workflow_type: 'billing_inquiry',
    status: 'Completed',
    related_document: 'Electricity Bill.pdf',
    document_id: 'doc_bill_201',
    created_at: '2026-10-07T11:20:00Z',
    formatted_date: 'Created 2 weeks ago',
    issuer: 'BSES',
    description: 'Scheduled auto-pay and tariff rate comparison verified.',
    parameters: {
      'Account Number': 'CA-908123451',
      'Units Consumed': '248 kWh',
      'Amount Due': '₹2,140',
      'Status': 'Payment processed successfully',
    },
    required_checklist: [
      { label: 'Tariff slab verified against previous cycle', verified: true, evidence: 'Normal domestic tier' },
      { label: 'Payment gateway confirmation receipt', verified: true, evidence: 'TXN-9988124' },
    ],
    missing_items: [],
    is_approved: true,
    approval_date: '08 Oct 2026',
  },
  {
    id: 'wf_4',
    title: 'Document Verification',
    workflow_type: 'document_verification',
    status: 'Failed',
    related_document: 'TV Warranty.pdf',
    document_id: 'doc_war_102',
    created_at: '2026-09-30T09:00:00Z',
    formatted_date: 'Created 3 weeks ago',
    issuer: 'Sony / Retailer',
    description: 'Warranty card missing dealer stamp and official registration serial.',
    parameters: {
      'Product': '55-inch 4K OLED TV',
      'Dealer Name': 'Unspecified Retailer',
      'Rejection Reason': 'Invoice proof of purchase not linked; missing authorized dealer signature',
    },
    required_checklist: [
      { label: 'Warranty terms sheet present', verified: true },
      { label: 'Retail purchase receipt attached', verified: false },
      { label: 'Dealer stamp on physical warranty card', verified: false },
    ],
    missing_items: ['Purchase receipt or tax invoice with valid GSTIN', 'Dealer authorized seal'],
    is_approved: false,
  },
];

// ─── 5. Reference Activity Events (Matching Screen 6) ────────────────────────
export const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act_ev_1',
    category: 'Documents',
    title: 'Uploaded document',
    target: 'Laptop Invoice.pdf',
    timestamp: '2026-10-15T10:24:00Z',
    formatted_time: '15 Oct 2026, 10:24 AM',
    relative_time: '2 days ago',
    icon_type: 'upload',
    related_id: 'doc_inv_101',
  },
  {
    id: 'act_ev_2',
    category: 'Documents',
    title: 'Analysis completed',
    target: 'Laptop Invoice.pdf',
    timestamp: '2026-10-15T10:25:00Z',
    formatted_time: '15 Oct 2026, 10:25 AM',
    relative_time: '2 days ago',
    icon_type: 'analysis',
    related_id: 'doc_inv_101',
  },
  {
    id: 'act_ev_3',
    category: 'Workflows',
    title: 'Workflow created',
    target: 'Laptop Warranty Claim',
    timestamp: '2026-10-15T10:26:00Z',
    formatted_time: '15 Oct 2026, 10:26 AM',
    relative_time: '2 days ago',
    icon_type: 'workflow',
    related_id: 'wf_1',
  },
  {
    id: 'act_ev_4',
    category: 'Assistant',
    title: 'Asked Luna',
    target: '"What is my warranty coverage?"',
    timestamp: '2026-10-14T16:12:00Z',
    formatted_time: '14 Oct 2026, 04:12 PM',
    relative_time: '3 days ago',
    icon_type: 'assistant',
  },
];

// ─── 6. Document Intelligence Dataset (Matching Screen 3) ───────────────────
export const DOCUMENT_INTELLIGENCE_DATA: Record<string, DocumentAnalysisData> = {
  doc_inv_101: {
    document_id: 'doc_inv_101',
    document_type: 'invoice',
    title: 'Laptop Invoice.pdf',
    page_count: 3,
    confidence: 'High confidence',
    summary: 'This is a purchase invoice for a laptop from TechWorld. The product comes with a 1 year warranty.',
    vendor: 'TechWorld',
    product: 'Laptop - XYZ Model',
    amount: '₹85,000',
    issue_date: '15 Aug 2026',
    warranty_period: '1 Year (till 15 Aug 2027)',
    key_dates: [
      {
        day: '15',
        month: 'AUG',
        title: 'Warranty expires',
        subtitle: '1 year from purchase',
        badge: 'in 11 months',
        rawDate: '2027-08-15',
      },
    ],
    extracted_fields: {
      'Document Type': 'Invoice',
      'Issue Date': '15 Aug 2026',
      'Amount': '₹85,000',
      'Vendor': 'TechWorld',
      'Product': 'Laptop - XYZ Model',
      'Warranty': '1 Year (till 15 Aug 2027)',
    },
    details: [
      { label: 'Invoice Number', value: '#INV-2026-001', page: 1 },
      { label: 'Buyer Name', value: 'Shruti Jain', page: 1 },
      { label: 'Billing Address', value: 'Kanpur, Uttar Pradesh', page: 1 },
      { label: 'Payment Mode', value: 'Credit Card (ending 4012)', page: 1 },
      { label: 'Tax Identification (GSTIN)', value: '09AAACH7409R1ZX', page: 1 },
      { label: 'Serial Number', value: 'SN-TECH-88291X', page: 2 },
    ],
    citations: [
      {
        document_id: 'doc_inv_101',
        document_title: 'Laptop Invoice.pdf',
        page: 1,
        text_snippet: 'TechWorld Retail Ltd. INVOICE #INV-2026-001. Date: 15 Aug 2026. Sold to: Shruti Jain.',
      },
      {
        document_id: 'doc_inv_101',
        document_title: 'Laptop Invoice.pdf',
        page: 1,
        text_snippet: 'Item 1: Laptop - XYZ Model (16GB RAM, 512GB SSD). Price: ₹85,000. Total Paid: ₹85,000.',
      },
      {
        document_id: 'doc_inv_101',
        document_title: 'Laptop Invoice.pdf',
        page: 2,
        text_snippet: 'Warranty: 1-Year Limited Manufacturer Hardware Warranty included. Valid through August 15, 2027.',
      },
    ],
    missing_info: [
      {
        field: 'Extended Accidental Damage Protection Policy',
        importance: 'Optional',
        note: 'Not purchased with original invoice. Drops and liquid spills are excluded.',
      },
    ],
    raw_text_by_page: {
      1: 'TechWorld Retail Pvt Ltd\nINVOICE #INV-2026-001\nDate: 15 Aug 2026\nBill To:\nShruti Jain\nKanpur, Uttar Pradesh\n\nItems:\n1. Laptop - XYZ Model - ₹85,000\nTotal: ₹85,000\nThank you for your purchase!',
      2: 'Warranty Terms & Conditions\nDuration: 12 months from original date of purchase (Expires 15 Aug 2027).\nCovers: Manufacturing defects and hardware faults.\nExclusions: Liquid damage, deliberate misuse, cosmetic wear.',
      3: 'Customer Care & Return Policy\nSupport: support@techworld.in | 1800-200-LUNA\nKeep this invoice as proof of purchase for warranty claims.',
    },
  },
};

// ─── 7. Default Settings State (Matching Screen 7) ───────────────────────────
export const INITIAL_SETTINGS: UserSettings = {
  name: 'Shruti Jain',
  email: 'shruti.jain@example.com',
  plan: 'Vault Pro',
  theme: 'lunar',
  glassmorphism: true,
  reducedMotion: false,
  emailNotifications: true,
  pushNotifications: false,
  deadlineReminderDays: 7,
  voiceSynthesis: true,
  speechRate: 1.0,
  speechPitch: 1.0,
  alexaChime: true,
  dataRetentionDays: 90,
  localVaultOnly: true,
};

// ─── Store State Container ───────────────────────────────────────────────────
export interface VaultState {
  documents: RecentDocumentItem[];
  importantDates: ImportantDateItem[];
  upcomingActions: UpcomingActionItem[];
  workflows: WorkflowItem[];
  activities: ActivityEvent[];
  settings: UserSettings;
  chatMessages: AssistantChatMessage[];
  isDemoMode: boolean;
}

class VaultStore {
  private state: VaultState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): VaultState {
    if (typeof window === 'undefined') {
      return {
        documents: INITIAL_DOCUMENTS,
        importantDates: INITIAL_IMPORTANT_DATES,
        upcomingActions: INITIAL_UPCOMING_ACTIONS,
        workflows: INITIAL_WORKFLOWS,
        activities: INITIAL_ACTIVITIES,
        settings: INITIAL_SETTINGS,
        chatMessages: [
          {
            id: 'msg_welcome',
            sender: 'assistant',
            text: 'Hi Shruti, I can help you understand your documents, bills, warranties and workflows.',
            timestamp: 'Just now',
          },
        ],
        isDemoMode: true,
      };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Use fallback
    }

    return {
      documents: INITIAL_DOCUMENTS,
      importantDates: INITIAL_IMPORTANT_DATES,
      upcomingActions: INITIAL_UPCOMING_ACTIONS,
      workflows: INITIAL_WORKFLOWS,
      activities: INITIAL_ACTIVITIES,
      settings: INITIAL_SETTINGS,
      chatMessages: [
        {
          id: 'msg_welcome',
          sender: 'assistant',
          text: 'Hi Shruti, I can help you understand your documents, bills, warranties and workflows.',
          timestamp: 'Just now',
        },
      ],
      isDemoMode: true,
    };
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // quota exceeded or disabled
      }
    }
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getState(): VaultState {
    return this.state;
  }

  getMetrics(): OverviewMetrics {
    const docCount = this.state.documents.length;
    return {
      totalDocuments: this.state.isDemoMode ? 12 : docCount,
      documentsThisMonth: this.state.isDemoMode ? 2 : Math.min(docCount, 2),
      pendingWorkflows: this.state.workflows.filter((w) => w.status === 'Pending').length,
      importantDatesCount: this.state.importantDates.length,
      datesWithin30Days: this.state.importantDates.filter((d) => d.urgency !== 'normal').length,
      actionsDueSoonCount: this.state.upcomingActions.length,
      actionsDueToday: this.state.isDemoMode ? 1 : 0,
    };
  }

  getDocumentAnalysis(docId: string): DocumentAnalysisData {
    if (DOCUMENT_INTELLIGENCE_DATA[docId]) {
      return DOCUMENT_INTELLIGENCE_DATA[docId];
    }
    // Generic fallback for any user-uploaded document
    const doc = this.state.documents.find((d) => d.id === docId);
    const title = doc?.fileName || 'Document.pdf';
    return {
      document_id: docId,
      document_type: doc?.documentType || 'other',
      title,
      page_count: doc?.pageCount || 1,
      confidence: 'Medium confidence',
      summary: `Automated summary for ${title}. Key terms and dates extracted by LUNA intelligence engine.`,
      vendor: 'Detected Entity',
      product: doc?.title || 'General Document',
      amount: 'N/A',
      issue_date: 'Oct 2026',
      warranty_period: 'Standard terms',
      key_dates: [
        {
          day: '15',
          month: 'NOV',
          title: 'Review milestone',
          subtitle: 'Scheduled check',
          badge: 'in 25 days',
          rawDate: '2026-11-15',
        },
      ],
      extracted_fields: {
        'Document Type': doc?.badgeLabel || 'Document',
        'Upload Date': doc?.formattedDate || 'Recent',
        'File Size': doc?.fileSize || '1.0 MB',
      },
      details: [
        { label: 'File Name', value: title, page: 1 },
        { label: 'Status', value: 'PROCESSED', page: 1 },
      ],
      citations: [
        {
          document_id: docId,
          document_title: title,
          page: 1,
          text_snippet: `Extracted verification header for ${title}.`,
        },
      ],
      missing_info: [
        {
          field: 'Original Purchase Receipt',
          importance: 'Optional',
          note: 'Attach invoice for warranty validation if required.',
        },
      ],
      raw_text_by_page: {
        1: `LUNA Document Vault Parser\nFile: ${title}\nStatus: Verified\nParsed on: ${new Date().toLocaleDateString()}`,
      },
    };
  }

  addDocument(file: File): RecentDocumentItem {
    const id = `doc_user_${Date.now()}`;
    const lowerName = file.name.toLowerCase();

    let type: RecentDocumentItem['documentType'] = 'other';
    let badgeLabel = 'Document';
    let badgeVariant: RecentDocumentItem['badgeVariant'] = 'lavender';

    if (lowerName.includes('invoice') || lowerName.includes('receipt')) {
      type = 'invoice';
      badgeLabel = 'Invoice';
      badgeVariant = 'lavender';
    } else if (lowerName.includes('warranty')) {
      type = 'warranty';
      badgeLabel = 'Warranty';
      badgeVariant = 'amber';
    } else if (lowerName.includes('bill') || lowerName.includes('electric') || lowerName.includes('power')) {
      type = 'utility_bill';
      badgeLabel = 'Bill';
      badgeVariant = 'coral';
    } else if (lowerName.includes('insurance')) {
      type = 'insurance';
      badgeLabel = 'Insurance';
      badgeVariant = 'rose';
    } else if (lowerName.includes('medical') || lowerName.includes('health')) {
      type = 'health';
      badgeLabel = 'Health';
      badgeVariant = 'emerald';
    }

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeInMB} MB` : `${Math.round(file.size / 1024)} KB`;

    const newDoc: RecentDocumentItem = {
      id,
      title: file.name.replace(/\.[^/.]+$/, ''),
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      formattedDate: 'Just now',
      documentType: type,
      badgeLabel,
      badgeVariant,
      fileSize: sizeStr,
      pageCount: 1,
    };

    // Add activity event
    const newActivity: ActivityEvent = {
      id: `act_${Date.now()}`,
      category: 'Documents',
      title: 'Uploaded document',
      target: file.name,
      timestamp: new Date().toISOString(),
      formatted_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relative_time: 'Just now',
      icon_type: 'upload',
      related_id: id,
    };

    this.state = {
      ...this.state,
      documents: [newDoc, ...this.state.documents],
      activities: [newActivity, ...this.state.activities],
    };
    this.persist();
    return newDoc;
  }

  deleteDocument(docId: string) {
    this.state = {
      ...this.state,
      documents: this.state.documents.filter((d) => d.id !== docId),
    };
    this.persist();
  }

  approveWorkflow(wfId: string) {
    const wf = this.state.workflows.find((w) => w.id === wfId);
    if (!wf) return;

    const updatedWorkflows = this.state.workflows.map((w) => {
      if (w.id === wfId) {
        return {
          ...w,
          status: 'Completed' as const,
          is_approved: true,
          approval_date: new Date().toLocaleDateString(),
        };
      }
      return w;
    });

    const approveActivity: ActivityEvent = {
      id: `act_app_${Date.now()}`,
      category: 'Workflows',
      title: 'Workflow approved & completed',
      target: wf.title,
      timestamp: new Date().toISOString(),
      formatted_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relative_time: 'Just now',
      icon_type: 'workflow',
      related_id: wfId,
    };

    this.state = {
      ...this.state,
      workflows: updatedWorkflows,
      activities: [approveActivity, ...this.state.activities],
    };
    this.persist();
  }

  addChatMessage(sender: 'user' | 'assistant', text: string, extra?: Partial<AssistantChatMessage>) {
    const newMsg: AssistantChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...extra,
    };

    const newActivities = [...this.state.activities];
    if (sender === 'user') {
      newActivities.unshift({
        id: `act_chat_${Date.now()}`,
        category: 'Assistant',
        title: 'Asked Luna',
        target: `"${text.length > 40 ? text.substring(0, 37) + '...' : text}"`,
        timestamp: new Date().toISOString(),
        formatted_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relative_time: 'Just now',
        icon_type: 'assistant',
      });
    }

    this.state = {
      ...this.state,
      chatMessages: [...this.state.chatMessages, newMsg],
      activities: newActivities,
    };
    this.persist();
    return newMsg;
  }

  updateSettings(partial: Partial<UserSettings>) {
    this.state = {
      ...this.state,
      settings: {
        ...this.state.settings,
        ...partial,
      },
    };
    this.persist();
  }

  loadReferenceData() {
    this.state = {
      documents: INITIAL_DOCUMENTS,
      importantDates: INITIAL_IMPORTANT_DATES,
      upcomingActions: INITIAL_UPCOMING_ACTIONS,
      workflows: INITIAL_WORKFLOWS,
      activities: INITIAL_ACTIVITIES,
      settings: INITIAL_SETTINGS,
      chatMessages: [
        {
          id: 'msg_welcome',
          sender: 'assistant',
          text: 'Hi Shruti, I can help you understand your documents, bills, warranties and workflows.',
          timestamp: 'Just now',
        },
      ],
      isDemoMode: true,
    };
    this.persist();
  }

  setEmptyState() {
    this.state = {
      documents: [],
      importantDates: [],
      upcomingActions: [],
      workflows: [],
      activities: [],
      settings: INITIAL_SETTINGS,
      chatMessages: [],
      isDemoMode: false,
    };
    this.persist();
  }
}

export const vaultStore = new VaultStore();
export default vaultStore;
