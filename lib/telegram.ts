// Notificações via Telegram - handoff de atendimento

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export class TelegramNotifier {
  private botToken: string;
  private chatId: string;
  private baseUrl: string = 'https://api.telegram.org';

  constructor() {
    this.botToken = TELEGRAM_BOT_TOKEN || '';
    this.chatId = TELEGRAM_CHAT_ID || '';
  }

  async notifyHandoff(data: {
    sender_username: string;
    sender_name?: string;
    message: string;
    interaction_id: string;
    assigned_to: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.botToken || !this.chatId) {
      console.warn('⚠️ Telegram não configurado - notificações não serão enviadas');
      return { success: false, error: 'Telegram não configurado' };
    }

    try {
      const text = `🔔 *Handoff de atendimento*\n\n👤 *${data.sender_name || data.sender_username}*\n💬 ${data.message}\n\n👉 Atribuído para: ${data.assigned_to}`;

      const response = await fetch(`${this.baseUrl}/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Telegram error: ${response.status}` };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async notifyPublished(data: {
    post_type: string;
    published_url?: string;
    error?: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.botToken || !this.chatId) {
      return { success: false, error: 'Telegram não configurado' };
    }

    try {
      const text = data.error
        ? `❌ *Post falhou na publicação*\n\n📝 Tipo: ${data.post_type}\n❌ Erro: ${data.error}`
        : `✅ *Post publicado com sucesso*\n\n📝 Tipo: ${data.post_type}\n🔗 ${data.published_url || 'Link indisponível'}`;

      const response = await fetch(`${this.baseUrl}/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        return { success: false, error: `Telegram error: ${response.status}` };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}

export const telegram = new TelegramNotifier();
