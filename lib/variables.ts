// lib/variables.ts - Resolução de variáveis na hora do envio
// {{first_name}} e {{first_name|fallback}} (insensível a acento)

interface RenderContext {
  contact_name?: string;
  contact_first_name?: string;
  [key: string]: string | undefined;
}

export function renderVariables(text: string, ctx: RenderContext): string {
  if (!text) return '';

  return text.replace(/\{\{([^}|]+)(?:\|([^}]*))?\}\}/g, (match, key, fallback) => {
    const normalizedKey = normalizeAccent(key.trim());

    // Buscar no contexto (case-insensitive, sem acento)
    for (const [ctxKey, ctxValue] of Object.entries(ctx)) {
      if (normalizeAccent(ctxKey) === normalizedKey && ctxValue) {
        return ctxValue;
      }
    }

    // Se não encontrar, usar fallback ou string vazia
    return fallback?.trim() || '';
  });
}

function normalizeAccent(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Máximo 5 lembretes de follow por pessoa/dia
const FOLLOW_REMINDER_LIMIT = 5;
const FOLLOW_REMINDER_WINDOW_HOURS = 24;

interface FollowReminderData {
  count: number;
  lastReset: number;
}

const tracker = new Map<string, FollowReminderData>();

export function canSendFollowReminder(personId: string): boolean {
  const now = Date.now();
  const key = `follow_${personId}`;

  let data = tracker.get(key);

  if (!data) {
    tracker.set(key, { count: 1, lastReset: now });
    return true;
  }

  // Verificar se passou 24h desde o último reset
  if (now - data.lastReset > FOLLOW_REMINDER_WINDOW_HOURS * 3600 * 1000) {
    data.count = 1;
    data.lastReset = now;
    return true;
  }

  // Verificar se ainda tem lembretes disponíveis
  if (data.count < FOLLOW_REMINDER_LIMIT) {
    data.count++;
    return true;
  }

  return false;
}
