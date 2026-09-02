import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

// GET /api/publora/connections
// Lista contas conectadas na Publora
export async function GET(req: NextRequest) {
  try {
    const PUBLORA_BASE_URL = process.env.PUBLORA_BASE_URL || 'https://api.publora.com';
    const PUBLORA_API_KEY = process.env.PUBLORA_API_KEY;

    if (!PUBLORA_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'PUBLORA_API_KEY não configurada' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const response = await fetch(`${PUBLORA_BASE_URL}/api/v1/platform-connections`, {
      method: 'GET',
      headers: {
        'x-publora-key': PUBLORA_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Publora API error:', response.status, error);
      return NextResponse.json(
        { success: false, error: `Publora error: ${response.status}` } as ApiResponse<null>,
        { status: response.status }
      );
    }

    const data = await response.json();

    // Normalizar contas para formato esperado
    // Extrai plataforma do platformId (ex: "instagram--username" -> "instagram")
    const connections = Array.isArray(data) ? data : data.data || [];
    const normalized = connections.map((conn: any) => {
      const platformId = conn.platformId || '';
      const platform = platformId.split('--')[0] || '';
      return {
        id: conn.id,
        platform: platform || 'unknown',
        platformId: platformId,
        username: conn.username || 'Unknown',
        displayName: conn.displayName || conn.username || 'Unknown',
        status: conn.status || 'active',
      };
    });

    return NextResponse.json(
      { success: true, data: normalized } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Erro em GET publora/connections:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
