// Cliente CRM - Integração de leads
// Conecta leads de automação do Instagram com o CRM

interface CRMLead {
  id?: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  neighborhood?: string;
  google_rating?: number;
  instagram?: string;
  website?: string;
  source: string; // 'instagram_dm' | 'instagram_comment' | etc
  notes?: string;
  status?: string;
  created_at?: string;
}

interface CRMLeadResponse {
  id: string;
  created: boolean;
  duplicated: boolean;
  merged_with?: string;
}

const CRM_API_URL = process.env.CRM_API_URL || 'http://localhost:3001';
const CRM_API_KEY = process.env.CRM_API_KEY;

export class CRMClient {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    if (!CRM_API_KEY) {
      console.warn('⚠️ CRM_API_KEY não configurada - leads não serão capturados');
    }
    this.apiUrl = CRM_API_URL;
    this.apiKey = CRM_API_KEY || '';
  }

  async createOrUpdateLead(lead: CRMLead): Promise<{ data: CRMLeadResponse | null; error: string | null }> {
    if (!this.apiKey) {
      return {
        data: null,
        error: 'CRM_API_KEY não configurada. Conecte seu CRM nas configurações.',
      };
    }

    try {
      // Verificar se lead já existe (por telefone ou Instagram)
      const existingLead = await this.findLead(lead.phone || lead.instagram);
      if (existingLead.data) {
        // Lead já existe, não duplicar
        return {
          data: {
            id: existingLead.data.id,
            created: false,
            duplicated: true,
            merged_with: existingLead.data.id,
          },
          error: null,
        };
      }

      const response = await fetch(`${this.apiUrl}/api/leads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lead),
      });

      if (!response.ok) {
        const error = await response.text();
        return { data: null, error: `CRM error: ${response.status}` };
      }

      const data = await response.json();
      return {
        data: {
          id: data.id,
          created: true,
          duplicated: false,
        },
        error: null,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message };
    }
  }

  private async findLead(identifier?: string): Promise<{ data: { id: string } | null; error: string | null }> {
    if (!identifier || !this.apiKey) {
      return { data: null, error: null };
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/leads/search?q=${encodeURIComponent(identifier)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return { data: null, error: null }; // Não encontrado é ok
      }

      const data = await response.json();
      return { data: data[0] || null, error: null };
    } catch (err) {
      return { data: null, error: null };
    }
  }

  async addConversationHistory(leadId: string, message: string, sender: 'lead' | 'system'): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey) {
      return { success: false, error: 'CRM_API_KEY não configurada' };
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/leads/${leadId}/conversations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sender,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        return { success: false, error: `CRM error: ${response.status}` };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}

export const crm = new CRMClient();
