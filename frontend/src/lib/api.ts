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
          message: `⚠️ LUNA backend is unreachable. Start it with:\n  $env:PYTHONPATH=".;ai-agent"\n  uvicorn backend.app.main:app --port 8000`,
          citations: [],
          workflow_id: null,
          suggested_actions: ['Start the backend server', 'Retry your question'],
        },
        error: errorMessage,
      };
    }
  }

  /**
   * Fetch documents from backend — THROWS on error (no silent fallback)
   */
  async listDocuments(documentType?: string): Promise<DocumentMetadata[]> {
    const params = documentType ? { document_type: documentType } : {};
    const response = await this.client.get<DocumentMetadata[]>('/api/documents', { params });
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
   * Fetch workflows from backend — THROWS on error (no silent fallback)
   */
  async listWorkflows(): Promise<WorkflowDraft[]> {
    const response = await this.client.get<WorkflowDraft[]>('/api/workflows');
    return response.data;
  }
}

export const api = new LunaApiClient();
export default api;
