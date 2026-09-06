import { NextRequest, NextResponse } from 'next/server';
import { enrichPendingLeads, enrichLeadProfile } from '@/lib/leadsPipeline';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Enriquece o perfil dos leads a partir das conversas do Direct (o agente lendo e
// abastecendo o perfil). Sem corpo: enriquece um lote. Com { leadId, conversaId }:
// enriquece um lead específico. Interno, não envia nada.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.leadId && body?.conversaId) {
      const ok = await enrichLeadProfile(Number(body.leadId), Number(body.conversaId));
      return NextResponse.json({ success: ok });
    }
    const r = await enrichPendingLeads(body?.limit || 10);
    return NextResponse.json({ success: true, ...r });
  } catch (e) {
    console.error('POST /api/crm/enrich-leads:', e);
    return NextResponse.json({ success: false, error: 'Falha ao enriquecer' }, { status: 500 });
  }
}
