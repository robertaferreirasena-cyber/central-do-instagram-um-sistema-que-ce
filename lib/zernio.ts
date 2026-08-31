// Cliente Zernio - Inbox e automação de atendimento
// Docs: https://docs.zernio.com
// Auth: Bearer token

interface ZernioMessage {
  id: string;
  conversation_id: string;
  sender_username: string;
  sender_name?: string;
  content: string;
  platform: 'instagram' | 'facebook' | 'whatsapp' | 'twitter';
  interaction_type: 'dm' | 'comment';
  created_at: string;
}

interface ZernioSendMessageRequest {
  conversation_id: string;
  content: string;
  platform: 'instagram' | 'facebook' | 'whatsapp' | 'twitter';
}

interface ZernioSendMessageResponse {
  id: string;
  status: 'sent' | 'failed';
  created_at: string;
  error?: string;
}

interface ZernioProfile {
  id: string;
  platform_username: string;
  platform: string;
  connected: boolean;
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

  async getProfiles(): Promise<{ data: ZernioProfile[] | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada. Conecte a Zernio nas configurações.' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/profiles`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return { data: null, error: `Zernio error: ${response.status}` };
      }

      const result = await response.json();
      return { data: result.data || [], error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message };
    }
  }

  async sendMessage(
    req: ZernioSendMessageRequest
  ): Promise<{ data: ZernioSendMessageResponse | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/inbox/conversations/${req.conversation_id}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: req.content,
          platform: req.platform,
        }),
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

  // Webhook handler para processar eventos de Zernio
  async processWebhookEvent(event: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Validar assinatura do webhook (se Zernio exigir)
      // Por enquanto, apenas logar o evento
      console.log('Zernio webhook event:', event);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}

export const zernio = new ZernioClient();
