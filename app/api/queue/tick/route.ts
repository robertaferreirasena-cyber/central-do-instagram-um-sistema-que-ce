import { NextRequest, NextResponse } from 'next/server';
import { drainQueue } from '@/lib/sendQueue';

export async function POST(req: NextRequest) {
  try {
    // Verificar token de proteção (simples, sem auth complexo)
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.QUEUE_TICK_TOKEN || 'unsafe-default';

    if (expectedToken === 'unsafe-default') {
      console.warn('⚠️ QUEUE_TICK_TOKEN não configurada, usando default inseguro');
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Autorização ausente' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    if (token !== expectedToken) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 403 }
      );
    }

    // Drenar a fila
    const processed = await drainQueue();

    return NextResponse.json({
      success: true,
      processed,
      message: `${processed} item(s) processado(s)`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Erro em /api/queue/tick:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
