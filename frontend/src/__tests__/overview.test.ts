import { describe, it, expect, beforeEach } from 'vitest';
import {
  vaultStore,
  INITIAL_DOCUMENTS,
  INITIAL_IMPORTANT_DATES,
} from '../lib/vaultStore';
import { api, API_BASE_URL } from '../lib/api';

describe('LUNA Full 7-Screen Data Model & Architecture Tests', () => {
  beforeEach(() => {
    vaultStore.loadReferenceData();
  });

  // ─── Screen 1: Overview ───────────────────────────────────────────────────
  it('initializes Overview with 4 metric cards and reference dataset', () => {
    const state = vaultStore.getState();
    expect(state.isDemoMode).toBe(true);
    expect(state.documents.length).toBe(INITIAL_DOCUMENTS.length);
    expect(state.importantDates.length).toBe(INITIAL_IMPORTANT_DATES.length);

    const metrics = vaultStore.getMetrics();
    expect(metrics.totalDocuments).toBe(12);
    expect(metrics.pendingWorkflows).toBe(1);
    expect(metrics.importantDatesCount).toBe(3);
    expect(metrics.actionsDueSoonCount).toBe(3);
  });

  // ─── Screen 2: My Documents ───────────────────────────────────────────────
  it('manages 8 initial document cards across multiple categories', () => {
    const docs = vaultStore.getState().documents;
    expect(docs.length).toBe(8);

    const types = docs.map((d) => d.badgeLabel);
    expect(types).toContain('Invoice');
    expect(types).toContain('Warranty');
    expect(types).toContain('Insurance');
    expect(types).toContain('Bill');
    expect(types).toContain('Health');
    expect(types).toContain('Agreement');
    expect(types).toContain('Statement');
  });

  it('deletes documents cleanly from the vault', () => {
    const initialLen = vaultStore.getState().documents.length;
    vaultStore.deleteDocument('doc_stmt_601');
    expect(vaultStore.getState().documents.length).toBe(initialLen - 1);
  });

  // ─── Screen 3: Document Intelligence ──────────────────────────────────────
  it('retrieves structured analysis with extracted fields, citations, and confidence', () => {
    const analysis = vaultStore.getDocumentAnalysis('doc_inv_101');
    expect(analysis).toBeDefined();
    expect(analysis.title).toBe('Laptop Invoice.pdf');
    expect(analysis.confidence).toBe('High confidence');
    expect(analysis.vendor).toBe('TechWorld');
    expect(analysis.amount).toBe('₹85,000');
    expect(analysis.extracted_fields['Amount']).toBe('₹85,000');
    expect(analysis.citations.length).toBeGreaterThan(0);
    expect(analysis.citations[0].document_title).toBe('Laptop Invoice.pdf');
  });

  // ─── Screen 4: LUNA AI Assistant ──────────────────────────────────────────
  it('records assistant chat turns and grounded citations in session memory', () => {
    const initialMsgCount = vaultStore.getState().chatMessages.length;
    vaultStore.addChatMessage('user', 'What is my laptop warranty coverage?');
    vaultStore.addChatMessage(
      'assistant',
      'Your laptop warranty from TechWorld expires on August 15, 2027.',
      {
        citations: [
          {
            document_id: 'doc_inv_101',
            document_title: 'Laptop Invoice.pdf',
            page: 2,
            text_snippet: 'Valid through August 15, 2027.',
          },
        ],
      }
    );

    const msgs = vaultStore.getState().chatMessages;
    expect(msgs.length).toBe(initialMsgCount + 2);
    expect(msgs[msgs.length - 1].citations?.[0].document_id).toBe('doc_inv_101');
  });

  // ─── Screen 5: Workflows ──────────────────────────────────────────────────
  it('provides 4 workflows with status filters and safe explicit approval', () => {
    const workflows = vaultStore.getState().workflows;
    expect(workflows.length).toBe(4);

    const pendingWf = workflows.find((w) => w.id === 'wf_1');
    expect(pendingWf).toBeDefined();
    expect(pendingWf?.status).toBe('Pending');
    expect(pendingWf?.is_approved).toBe(false);

    // Explicit approval confirmation
    vaultStore.approveWorkflow('wf_1');
    const updatedWf = vaultStore.getState().workflows.find((w) => w.id === 'wf_1');
    expect(updatedWf?.status).toBe('Completed');
    expect(updatedWf?.is_approved).toBe(true);
    expect(updatedWf?.approval_date).toBeDefined();
  });

  // ─── Screen 6: Activity Feed ──────────────────────────────────────────────
  it('maintains a chronological activity feed tracking uploads, analysis, and workflows', () => {
    const activities = vaultStore.getState().activities;
    expect(activities.length).toBeGreaterThanOrEqual(4);

    const categories = activities.map((a) => a.category);
    expect(categories).toContain('Documents');
    expect(categories).toContain('Workflows');
    expect(categories).toContain('Assistant');
  });

  // ─── Screen 7: Settings ───────────────────────────────────────────────────
  it('persists user settings updates to the reactive store', () => {
    expect(vaultStore.getState().settings.name).toBe('Shruti Jain');

    vaultStore.updateSettings({
      speechRate: 1.2,
      theme: 'dark',
      reducedMotion: true,
    });

    const settings = vaultStore.getState().settings;
    expect(settings.speechRate).toBe(1.2);
    expect(settings.theme).toBe('dark');
    expect(settings.reducedMotion).toBe(true);
  });

  // ─── API Client Initialization ────────────────────────────────────────────
  it('configures typed API client according to frozen OpenAPI contracts', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(typeof api.checkHealth).toBe('function');
    expect(typeof api.sendAssistantChat).toBe('function');
    expect(typeof api.listDocuments).toBe('function');
  });
});
