import { NextRequest, NextResponse } from 'next/server';
import { drainQueue } from '@/lib/sendQueue';
import { ApiResponse } from '@/types';

// GET /api/cron/queue - Cron para drenar a fila de envio a cada 2 minutos
export async function GET(req: NextRequest) {
  try {
    // 1. Validar header de autorização (Vercel Cron)
    const authHeader = req.headers.get('authorization') || '';
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    if (cronSecret) {
      const token = authHeader.slice(7);
      if (token !== cronSecret) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' } as ApiResponse<null>,
          { status: 403 }
        );
      }
    } else {
      console.warn('⚠️ CRON_SECRET não configurado (permitido em dev)');
    }

    // 2. Drenar a fila
    // NOTA: Como agente_ativo='false', a fila não vai enviar nada automaticamente.
    // Ela apenas processa itens com status='enviando' que já estão na fila.
    const processed = await drainQueue();

    return NextResponse.json(
      {
        success: true,
        data: {
          processed,
          message: `${processed} item(s) processado(s)`,
        },
      } as ApiResponse<any>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Cron queue error:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
