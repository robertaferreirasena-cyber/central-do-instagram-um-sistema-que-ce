import { createHmac } from 'crypto';

// Tipos do Zernio baseados no DOC_INSTAGRAM_CHIMAGI.md
export interface ZernioAccount {
  _id: string;
  id?: string;
  platform: string;
  username: string;
  displayName: string;
  followersCount?: number;
  platformUserId: string; // IG Business ID numérico (ex: 27679396678410160)
  permissions?: string[];
  profilePicture?: string;
}

export interface ZernioConversation {
  id: string;
  accountId: string;
  accountUsername: string;
  platform: string;
  participantId: string;
  participantName: string;
  participantUsername: string;
  participantPicture?: string;
  lastMessage: string;
  updatedTime: string; // ISO
  status: string;
  unreadCount: number;
  url?: string;
}

export interface ZernioAttachment {
  type: 'image' | 'video';
  url?: string;
  payload?: { url: string };
  _id?: string;
  refreshUrl?: string;
}

export interface ZernioMessage {
  id: string;
  message?: string;
  content?: string;
  senderName: string;
  direction: 'incoming' | 'outgoing';
  createdAt: string;
  attachments?: ZernioAttachment[];
}

const ZERNIO_BASE_URL = process.env.ZERNIO_BASE_URL || 'https://zernio.com/api/v1';
const ZERNIO_API_KEY = process.env.ZERNIO_API_KEY;
const ZERNIO_WEBHOOK_SECRET = process.env.ZERNIO_WEBHOOK_SECRET;

export class ZernioClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    if (!ZERNIO_API_KEY) {
      console.warn('⚠️ ZERNIO_API_KEY não configurada');
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

  // GET /accounts - lista contas conectadas
  async listAccounts(): Promise<{ data: ZernioAccount[] | null; error: string | null }> {
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
      return { data: result || [], error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message };
    }
  }

  // GET /inbox/conversations - lista conversas (LER d.data, NÃO d.conversations)
  async listConversations(accountId?: string, limit: number = 80): Promise<{ data: ZernioConversation[] | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada' };
    }

    try {
      let url = `${this.baseUrl}/inbox/conversations`;
      const params = new URLSearchParams();
      if (accountId) params.append('accountId', accountId);
      if (limit) params.append('limit', limit.toString());
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { data: null, error: `Zernio error: ${response.status}` };
      }

      const result = await response.json();
      // KEY: lê d.data, NÃO d.conversations
      return { data: result.data || [], error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message };
    }
  }

  // GET /inbox/conversations/{id}/messages - lista mensagens (LER d.messages, NÃO d.data)
  async getMessages(conversationId: string, accountId: string, limit: number = 50): Promise<{ data: ZernioMessage[] | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada' };
    }

    try {
      const url = `${this.baseUrl}/inbox/conversations/${conversationId}/messages?accountId=${accountId}&limit=${limit}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { data: null, error: `Zernio error: ${response.status}` };
      }

      const result = await response.json();
      // KEY: lê d.messages, NÃO d.data
      return { data: result.messages || [], error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message };
    }
  }

  // POST /inbox/conversations/{id}/messages - envia mensagem DM
  async sendMessage(
    conversationId: string,
    accountId: string,
    message: string,
    buttons?: Array<{ type: 'web_url'; title: string; url: string }>,
    quickReplies?: string[]
  ): Promise<{ data: any | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada' };
    }

    try {
      const body: any = {
        accountId,
        message,
      };
      if (buttons) body.buttons = buttons;
      if (quickReplies) body.quickReplies = quickReplies;

      const response = await fetch(`${this.baseUrl}/inbox/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
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

  // POST /inbox/comments/{id} - resposta pública a comentário
  async replyComment(commentId: string, accountId: string, message: string): Promise<{ data: any | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/inbox/comments/${commentId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ accountId, message }),
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

  // POST /inbox/comments/{id} com private:true - DM privada
  async privateReply(commentId: string, accountId: string, message: string): Promise<{ data: any | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/inbox/comments/${commentId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ accountId, message, private: true }),
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

  // POST /webhooks/settings - registrar webhook
  async createWebhook(
    name: string,
    url: string,
    secret: string,
    events: string[] = ['message.received', 'message.sent', 'conversation.started', 'comment.received']
  ): Promise<{ data: any | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'ZERNIO_API_KEY não configurada' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/webhooks/settings`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ name, url, events, secret, isActive: true }),
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

  // Validar assinatura webhook HMAC-SHA256
  static verifySignature(secret: string, rawBody: string | Buffer, signature: string): boolean {
    const hmac = createHmac('sha256', secret);
    hmac.update(rawBody);
    const hash = hmac.digest('hex').toLowerCase();
    return hash === signature.toLowerCase();
  }
}

export const zernio = new ZernioClient();

// C3: Resolver post/reel por URL e extrair media_id
// Aceita https://www.instagram.com/p/SHORTCODE/ ou /reel/SHORTCODE/
export async function resolvePostByUrl(
  url: string
): Promise<{ shortcode: string; media_id: string | null }> {
  if (!url) {
    return { shortcode: '', media_id: null };
  }

  // Extrair shortcode de diferentes formatos de URL
  let shortcode = '';
  const patterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,      // /p/SHORTCODE/
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,   // /reel/SHORTCODE/
    /instagram\.com\/reels\/([A-Za-z0-9_-]+)/,  // /reels/SHORTCODE/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      shortcode = match[1];
      break;
    }
  }

  if (!shortcode) {
    return { shortcode: '', media_id: null };
  }

  // TODO: Integrar com Zernio para resolver shortcode → media_id via API
  // Por enquanto, retorna shortcode como proxy para media_id
  // Zernio teria um endpoint tipo GET /medias/resolve?shortcode=XXX
  return { shortcode, media_id: null };
}
