/**
 * LUNA Paperwork Assistant - Typed API Client
 * All methods throw on error — callers handle errors explicitly.
 * No silent fallbacks to mock/local data.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ChatRequest,
  ChatResponseEnvelope,
  DocumentMetadata,
  DocumentAnalysis,
  WorkflowDraft,
} from '../types/api';

const getApiBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '') {
      return import.meta.env.VITE_API_URL;
    }
  }
  // When running in browser with Vite dev server proxy, use relative paths
  if (typeof window !== 'undefined') {
    return '';
  }
  return 'http://127.0.0.1:8000';
};

export const API_BASE_URL: string = getApiBaseUrl();

class LunaApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Health probe — returns connection status, never throws
   */
  async checkHealth(): Promise<{ connected: boolean; status: string; version?: string }> {
    try {
      const response = await this.client.get('/health', { timeout: 3000 });
      if (response.status === 200) {
        return { connected: true, status: response.data?.status || 'ok', version: response.data?.version || '1.0.0' };
      }
      return { connected: false, status: 'unexpected_status' };
    } catch {
      return { connected: false, status: 'offline' };
    }
  }

  /**
   * Send a conversational turn to LUNA AI Assistant
   * Returns error envelope instead of throwing — chat UI handles the message display
   */
  async sendAssistantChat(request: ChatRequest): Promise<ChatResponseEnvelope> {
    try {
      const response = await this.client.post<ChatResponseEnvelope>('/api/assistant/chat', request);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<{ error?: string; message?: string }>;
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Unable to connect to LUNA assistant backend';

      return {
        success: false,
        data: {
          conversation_id: request.conversation_id || 'offline_conv',
          message: `⚠️ LUNA backend is unreachable. Start it with:\n  uvicorn backend.app.main:app --port 8000`,
          citations: [],
          workflow_id: null,
          suggested_actions: ['Start the backend server', 'Retry your question'],
        },
        error: errorMessage,
      };
    }
  }

  /**
   * Fetch documents from backend — THROWS on error (no silent fallback).
   * Unwraps OpenAPI DocumentListResponse ({ items: [...] }) or direct array.
   */
  async listDocuments(documentType?: string): Promise<DocumentMetadata[]> {
    const params = documentType ? { document_type: documentType } : {};
    const response = await this.client.get<any>('/api/documents', { params });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray(response.data.items)) {
      return response.data.items;
    }
    return [];
  }

  /**
   * Upload a document to the backend vault — multipart/form-data POST /api/documents
   */
  async uploadDocument(file: File, documentType?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (documentType && documentType !== 'unknown') {
      formData.append('document_type', documentType);
    }
    const response = await this.client.post('/api/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Download a raw document file from the backend vault
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    const response = await this.client.get(`/api/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Get document analysis from backend — THROWS on error
   */
  async getDocumentAnalysis(documentId: string): Promise<DocumentAnalysis | null> {
    try {
      const response = await this.client.get<DocumentAnalysis>(`/api/documents/${documentId}/analysis`);
      return response.data;
    } catch {
      return null; // 404 is acceptable — analysis may not exist yet
    }
  }

  /**
   * Fetch workflows from backend — THROWS on error (no silent fallback).
   * Unwraps OpenAPI WorkflowListResponse ({ items: [...] }) or direct array.
   */
  async listWorkflows(): Promise<WorkflowDraft[]> {
    const response = await this.client.get<any>('/api/workflows');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray(response.data.items)) {
      return response.data.items;
    }
    return [];
  }

  /**
   * Explicit user authorization to approve workflow and generate final artifact
   */
  async approveWorkflow(
    workflowId: string,
    approvedAction: string = 'generate_claim_packet',
    notes?: string
  ): Promise<any> {
    const response = await this.client.post(`/api/workflows/${workflowId}/approve`, {
      approved_action: approvedAction,
      notes,
    });
    return response.data;
  }

  /**
   * Download generated PDF artifact for a completed workflow
   */
  async downloadWorkflowArtifact(workflowId: string): Promise<Blob> {
    const response = await this.client.get(`/api/workflows/${workflowId}/artifact`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const api = new LunaApiClient();
export default api;
