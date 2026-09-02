import { NextRequest, NextResponse } from 'next/server';
import { zernio } from '@/lib/zernio';
import { ApiResponse } from '@/types';
import { randomBytes } from 'crypto';

// POST /api/zernio/webhook-register - Registrar webhook no Zernio (manual, não automático)
export async function POST(req: NextRequest) {
  try {
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const webhookEndpoint = `${webhookUrl}/api/webhook/zernio`;

    // Gerar secret se não existir
    let secret = process.env.ZERNIO_WEBHOOK_SECRET;
    if (!secret) {
      secret = randomBytes(32).toString('hex');
      console.log('📝 Adicione à variável ZERNIO_WEBHOOK_SECRET:');
      console.log(secret);
    }

    // Registrar webhook
    const result = await zernio.createWebhook(
      'Webhook Central do Instagram',
      webhookEndpoint,
      secret,
      ['message.received', 'message.sent', 'conversation.started', 'comment.received']
    );

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error } as ApiResponse<null>,
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        webhook: result.data,
        secret,
        endpoint: webhookEndpoint,
      },
    } as ApiResponse<any>);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Webhook register error:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
