// Cliente Publora - Publicação de conteúdo
// Docs: https://docs.publora.com
// Auth: Header 'x-publora-key'

interface PubloraCreatePostRequest {
  caption: string;
  media_urls: string[];
  type: 'feed' | 'reel' | 'story' | 'carousel';
  hashtags?: string[];
  scheduled_at?: string;
  channels?: string[];
}

interface PubloraCreatePostResponse {
  id: string;
  status: 'scheduled' | 'published' | 'failed';
  published_url?: string;
  error?: string;
  created_at: string;
}

interface PubloraGetPostResponse {
  id: string;
  status: string;
  published_url?: string;
  created_at: string;
  updated_at: string;
}

const PUBLORA_BASE_URL = process.env.PUBLORA_BASE_URL || 'https://api.publora.com';
const PUBLORA_API_KEY = process.env.PUBLORA_API_KEY;

export class PubloraClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    if (!PUBLORA_API_KEY) {
      console.warn('⚠️ PUBLORA_API_KEY não configurada - publicação desabilitada');
    }
    this.apiKey = PUBLORA_API_KEY || '';
    this.baseUrl = PUBLORA_BASE_URL;
  }

  async createPost(
    channelId: string,
    req: PubloraCreatePostRequest
  ): Promise<{ data: PubloraCreatePostResponse | null; error: string | null }> {
    if (!this.apiKey) {
      return {
        data: null,
        error: 'PUBLORA_API_KEY não configurada. Conecte a Publora nas configurações.',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/create-post`, {
        method: 'POST',
        headers: {
          'x-publora-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel_id: channelId,
          ...req,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { data: null, error: `Publora API error: ${response.status} ${error}` };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: `Publora connection error: ${message}` };
    }
  }

  async getPost(postId: string): Promise<{ data: PubloraGetPostResponse | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'PUBLORA_API_KEY não configurada' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/get-post/${postId}`, {
        method: 'GET',
        headers: {
          'x-publora-key': this.apiKey,
        },
      });

      if (!response.ok) {
        return { data: null, error: `Publora error: ${response.status}` };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message };
    }
  }
}

export const publora = new PubloraClient();
