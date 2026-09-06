import { NextResponse } from 'next/server';
import { backfillLeadsFromConversations } from '@/lib/leadsPipeline';

export const runtime = 'nodejs';

// Roda a espinha do CRM sobre as conversas já existentes (as que entraram antes
// do pipeline). Popula os leads de imediato. Interno, idempotente — não envia nada.
export async function POST() {
  try {
    const r = await backfillLeadsFromConversations();
    return NextResponse.json({ success: true, ...r });
  } catch (e) {
    console.error('POST /api/crm/backfill-leads:', e);
    return NextResponse.json({ success: false, error: 'Falha no backfill' }, { status: 500 });
  }
}
