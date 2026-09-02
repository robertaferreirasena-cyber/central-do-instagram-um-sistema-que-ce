import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getContentAccountId } from '@/lib/tenant';
import { ApiResponse } from '@/types';

interface OverviewData {
  conversas_total: number;
  conversas_aguardando_humano: number;
  revisoes_pendentes: number;
  publicacoes_agenda: number;
  funis_ativos: number;
}

export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const accountId = req.nextUrl.searchParams.get('account_id') || 'default-account';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Conversas totais e aguardando humano
    const { data: conversations, error: convError } = await supabase
      .from('zernio_conversations')
      .select('id, estado')
      .eq('account_id', accountId);

    if (convError) {
      console.error('Erro ao buscar conversas:', convError);
    }

    const conversas_total = conversations?.length || 0;
    const conversas_aguardando_humano = conversations?.filter((c: any) => c.estado === 'aguardando_humano').length || 0;

    // 2. Revisões pendentes (agente_sugestoes com status='pendente')
    const { data: suggestions, error: sugError } = await supabase
      .from('agente_sugestoes')
      .select('id, status')
      .eq('account_id', accountId)
      .eq('status', 'pendente');

    if (sugError) {
      console.error('Erro ao buscar sugestões:', sugError);
    }

    const revisoes_pendentes = suggestions?.length || 0;

    // 3. Publicações agendadas (content_briefs com scheduled_at nos próximos dias)
    const { data: briefs, error: briefError } = await supabase
      .from('content_briefs')
      .select('id, scheduled_at, status')
      .eq('account_id', await getContentAccountId())
      .gte('scheduled_at', today.toISOString())
      .neq('status', 'draft')
      .neq('status', 'rejected');

    if (briefError) {
      console.error('Erro ao buscar briefs:', briefError);
    }

    const publicacoes_agenda = briefs?.length || 0;

    // 4. Fluxos ativos (flows com enabled=true)
    const { data: flows, error: flowError } = await supabase
      .from('flows')
      .select('id, enabled')
      .eq('account_id', accountId)
      .eq('enabled', true);

    if (flowError) {
      console.error('Erro ao buscar fluxos:', flowError);
    }

    const funis_ativos = flows?.length || 0;

    const data: OverviewData = {
      conversas_total,
      conversas_aguardando_humano,
      revisoes_pendentes,
      publicacoes_agenda,
      funis_ativos,
    };

    return NextResponse.json({ success: true, data } as ApiResponse<OverviewData>);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Erro em GET dashboard/overview:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
