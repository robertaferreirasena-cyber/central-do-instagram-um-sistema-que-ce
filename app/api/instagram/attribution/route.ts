import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getContentAccountId } from '@/lib/tenant';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    // account_id de attribution_events é UUID (FK) — resolve no servidor,
    // ignorando valores de tenant TEXT como 'default-account' que dariam erro de UUID
    const accountId = await getContentAccountId();
    const source = searchParams.get('source');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!accountId) {
      return NextResponse.json(
        {
          success: true,
          events: [],
          summary: {
            total_events: 0,
            por_fonte: {},
            por_resultado: {},
          },
        }
      );
    }

    // Só colunas escalares — evita embeds via FK que o PostgREST não tem registradas
    let query = supabase
      .from('attribution_events')
      .select(
        `
        id,
        lead_id,
        content_brief_id,
        campaign_id,
        automation_id,
        funnel_id,
        order_id,
        hora
      `
      );

    if (from) {
      query = query.gte('hora', new Date(from).toISOString());
    }

    if (to) {
      query = query.lte('hora', new Date(to).toISOString());
    }

    const { data: eventsData, error } = await query.order('hora', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Nomes dos leads via LOOKUP manual (o PostgREST não tem os embeds registrados;
    // antes o map lia event.leads?.nome que nunca era selecionado → sempre "N/A").
    const leadIds = [...new Set((eventsData || []).map((e: any) => e.lead_id).filter(Boolean))];
    const leadNome: Record<string, string> = {};
    if (leadIds.length) {
      const { data: leadsData } = await supabase.from('leads').select('id, nome').in('id', leadIds);
      (leadsData || []).forEach((l: any) => { leadNome[String(l.id)] = l.nome; });
    }
    // Nomes dos funis via `flows` (a tabela viva de automação)
    const funnelIds = [...new Set((eventsData || []).map((e: any) => e.funnel_id).filter(Boolean))];
    const funnelNome: Record<string, string> = {};
    if (funnelIds.length) {
      const { data: flowsData } = await supabase.from('flows').select('id, nome').in('id', funnelIds);
      (flowsData || []).forEach((f: any) => { funnelNome[String(f.id)] = f.nome; });
    }

    const events = (eventsData || []).map((event: any) => ({
      id: event.id,
      lead_id: event.lead_id,
      lead_nome: leadNome[String(event.lead_id)] || 'N/A',
      content_brief_id: event.content_brief_id,
      campaign_id: event.campaign_id,
      automation_id: event.automation_id,
      funnel_id: event.funnel_id,
      funnel_nome: funnelNome[String(event.funnel_id)],
      order_id: event.order_id,
      hora: event.hora,
    }));

    // Calcular summary
    const summary = {
      total_events: events.length,
      por_fonte: {} as Record<string, number>,
      por_resultado: {} as Record<string, number>,
    };

    events.forEach((event) => {
      let fonte = 'direto';
      if (event.campaign_id) fonte = 'campanha';
      if (event.automation_id) fonte = 'automacao';
      if (event.funnel_id) fonte = 'funil';

      summary.por_fonte[fonte] = (summary.por_fonte[fonte] || 0) + 1;

      if (event.order_id) {
        summary.por_resultado['pedido'] = (summary.por_resultado['pedido'] || 0) + 1;
      } else {
        summary.por_resultado['em_progresso'] = (summary.por_resultado['em_progresso'] || 0) + 1;
      }
    });

    return NextResponse.json({ success: true, events, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const {
      lead_id,
      content_brief_id,
      campaign_id,
      automation_id,
      funnel_id,
      order_id,
      accountId,
    } = body;

    if (!lead_id || !accountId) {
      return NextResponse.json({ success: false, error: 'lead_id e accountId obrigatórios' }, { status: 400 });
    }

    // OBS: attribution_events NÃO tem coluna account_id no banco vivo — inserir causava erro.
    const { data, error } = await supabase
      .from('attribution_events')
      .insert([
        {
          lead_id,
          content_brief_id,
          campaign_id,
          automation_id,
          funnel_id,
          order_id: order_id || '',
          hora: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data?.[0] }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
