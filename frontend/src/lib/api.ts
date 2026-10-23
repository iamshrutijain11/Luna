/**
 * LUNA Paperwork Assistant - Typed API Client
 * Aligned with contracts/openapi.yaml
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
  // When running in browser with Vite dev server proxy or same origin, use relative paths
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
   * Health probe to check if the backend service is running
   */
  async checkHealth(): Promise<{ connected: boolean; status: string; version?: string }> {
    try {
      const response = await this.client.get('/health', { timeout: 3000 });
      if (response.status === 200) {
        return {
          connected: true,
          status: response.data?.status || 'ok',
          version: response.data?.version || '1.0.0',
        };
      }
      return { connected: false, status: 'unexpected_status' };
    } catch {
      return { connected: false, status: 'offline' };
    }
  }

  /**
   * Send a conversational turn to LUNA AI Assistant
   * Target endpoint: POST /api/assistant/chat (contracts/openapi.yaml)
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
          message: `LUNA Backend is currently unreachable. Please verify that the FastAPI backend server is running ($env:PYTHONPATH=".;ai-agent"; uvicorn backend.app.main:app --port 8000).`,
          citations: [],
          workflow_id: null,
          suggested_actions: ['Check backend connection', 'Upload a document', 'Retry query'],
        },
        error: errorMessage,
      };
    }
  }

  /**
   * Fetch documents list from backend if available
   */
  async listDocuments(documentType?: string): Promise<DocumentMetadata[]> {
    try {
      const params = documentType ? { document_type: documentType } : {};
      const response = await this.client.get<DocumentMetadata[]>('/api/documents', { params, timeout: 3000 });
      return response.data;
    } catch {
      return [];
    }
  }

  /**
   * Get document analysis from backend if available
   */
  async getDocumentAnalysis(documentId: string): Promise<DocumentAnalysis | null> {
    try {
      const response = await this.client.get<DocumentAnalysis>(`/api/documents/${documentId}/analysis`, { timeout: 3000 });
      return response.data;
    } catch {
      return null;
    }
  }

  /**
   * Fetch workflows from backend if available
   */
  async listWorkflows(): Promise<WorkflowDraft[]> {
    try {
      const response = await this.client.get<WorkflowDraft[]>('/api/workflows', { timeout: 3000 });
      return response.data;
    } catch {
      return [];
    }
  }
}

export const api = new LunaApiClient();
export default api;
