// Cliente Zernio - Inbox e automação de atendimento
// Docs: https://docs.zernio.com
// Auth: Bearer token

export interface ZernioAccount {
  _id: string;
  platform: string;
  username: string;
}

export interface ZernioProfile {
  id: string;
  name: string;
  accounts: ZernioAccount[];
}

export interface ZernioConversation {
  id: string;
  participant_username: string;
  last_message: string;
  last_message_at: string;
  platform: string;
  unread_count: number;
}

export interface ZernioMessage {
  id: string;
  conversation_id: string;
  sender_username: string;
  content: string;
  platform: string;
  created_at: string;
  message_type: string;
}

export interface ZernioMessageResponse {
  id: string;
  status: string;
  created_at: string;
}

const ZERNIO_BASE_URL = process.env.ZERNIO_BASE_URL || 'https://zernio.com/api/v1';
const ZERNIO_API_KEY = process.env.ZERNIO_API_KEY;

export class ZernioClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    if (!ZERNIO_API_KEY) {
      console.warn('⚠️ ZERNIO_API_KEY não configurada - atendimento automático desabilitado');
    }
    this.apiKey = ZERNIO_API_KEY || '';
    this.baseUrl = ZERNIO_BASE_URL;
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async getAccounts(): Promise<{ data: ZernioAccount[] | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/accounts`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { data: null, error: `Zernio error: ${response.status}` };
      }

      const result = await response.json();
      return { data: result.accounts || [], error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message };
    }
  }

  async getProfiles(): Promise<{ data: ZernioProfile[] | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/profiles`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { data: null, error: `Zernio error: ${response.status}` };
      }

      const result = await response.json();
      return { data: result.profiles || [], error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message };
    }
  }

  async listConversations(): Promise<{ data: ZernioConversation[] | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/inbox/conversations`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { data: null, error: `Zernio error: ${response.status}` };
      }

      const result = await response.json();
      return { data: result.conversations || [], error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message };
    }
  }

  async getMessages(conversationId: string): Promise<{ data: ZernioMessage[] | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/inbox/conversations/${conversationId}/messages`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { data: null, error: `Zernio error: ${response.status}` };
      }

      const result = await response.json();
      return { data: result.messages || [], error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message };
    }
  }

  async sendMessage(conversationId: string, content: string): Promise<{ data: ZernioMessageResponse | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/inbox/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { data: null, error: `Zernio error: ${response.status} ${error}` };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message };
    }
  }

  async replyComment(postId: string, commentId: string, content: string): Promise<{ data: any | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/inbox/comments/${postId}/${commentId}/private-reply`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { data: null, error: `Zernio error: ${response.status} ${error}` };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message };
    }
  }

  async markRead(conversationId: string): Promise<{ data: any | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/inbox/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ read: true }),
      });

      if (!response.ok) {
        return { data: null, error: `Zernio error: ${response.status}` };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message };
    }
  }
}

export const zernio = new ZernioClient();
