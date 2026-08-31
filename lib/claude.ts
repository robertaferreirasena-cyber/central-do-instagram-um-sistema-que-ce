// Cliente Claude API - Geração de conteúdo e respostas automáticas
// Docs: https://claude.ai (usar sua chave da API)

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export interface GenerateContentRequest {
  type: 'feed' | 'reel' | 'story' | 'carousel';
  theme: string;
  style?: string;
  platform?: string;
}

export interface GenerateContentResponse {
  caption: string;
  hashtags: string[];
  cta?: string;
}

export interface GenerateResponseRequest {
  interaction_content: string;
  knowledge_base?: string;
  context?: string;
}

export interface GenerateResponseResponse {
  response: string;
  confidence: number;
  should_forward_to_human: boolean;
  reason?: string;
}

export class ClaudeClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.anthropic.com/v1';

  constructor() {
    if (!CLAUDE_API_KEY) {
      console.warn('⚠️ CLAUDE_API_KEY não configurada - geração de conteúdo e IA desabilitadas');
    }
    this.apiKey = CLAUDE_API_KEY || '';
  }

  async generateContent(req: GenerateContentRequest): Promise<{ data: GenerateContentResponse | null; error: string | null }> {
    if (!this.apiKey) {
      return {
        data: null,
        error: 'CLAUDE_API_KEY não configurada. Conecte a Claude API nas configurações.',
      };
    }

    try {
      const prompt = `Gere um ${req.type} para Instagram sobre: ${req.theme}
${req.style ? `\nEstilo: ${req.style}` : ''}

Retorne APENAS um JSON válido (sem markdown) com:
{
  "caption": "legenda do post (máx 2200 caracteres)",
  "hashtags": ["array", "de", "hashtags", "relevantes"],
  "cta": "chamada à ação (opcional)"
}`;

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { data: null, error: `Claude API error: ${response.status}` };
      }

      const result = await response.json();
      const text = result.content[0]?.text || '';

      // Parse JSON da resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { data: null, error: 'Claude não retornou JSON válido' };
      }

      const data = JSON.parse(jsonMatch[0]) as GenerateContentResponse;
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: `Claude error: ${message}` };
    }
  }

  async generateResponse(req: GenerateResponseRequest): Promise<{ data: GenerateResponseResponse | null; error: string | null }> {
    if (!this.apiKey) {
      return { data: null, error: 'CLAUDE_API_KEY não configurada' };
    }

    try {
      const prompt = `Você é assistente de atendimento ao cliente para Roberta Sena (@roberta.sena).

${req.knowledge_base ? `Base de conhecimento:\n${req.knowledge_base}\n\n` : ''}

Mensagem do cliente: "${req.interaction_content}"

Responda APENAS com JSON (sem markdown):
{
  "response": "sua resposta completa e natural em português",
  "confidence": 0.8,
  "should_forward_to_human": false,
  "reason": "por que precisa de humano (se aplica)"
}

REGRAS:
1. Se a pergunta está na base de conhecimento, responda com confiança alta (0.8+)
2. Se sair da base, confidence < 0.6 e should_forward_to_human = true
3. NUNCA invente informações que não estão na base
4. Seja breve e natural (máx 500 caracteres)`;

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        return { data: null, error: `Claude API error: ${response.status}` };
      }

      const result = await response.json();
      const text = result.content[0]?.text || '';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { data: null, error: 'Claude não retornou JSON válido' };
      }

      const data = JSON.parse(jsonMatch[0]) as GenerateResponseResponse;
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message };
    }
  }
}

export const claude = new ClaudeClient();
