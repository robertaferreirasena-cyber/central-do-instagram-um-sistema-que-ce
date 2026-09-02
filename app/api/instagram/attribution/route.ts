import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
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

    let query = supabase
      .from('attribution_events')
      .select(
        `
        id,
        lead_id,
        leads(nome),
        content_brief_id,
        campaign_id,
        content_campaigns(nome),
        automation_id,
        ig_automacoes(nome),
        funnel_id,
        instagram_funnels(nome),
        order_id,
        hora
      `
      )
      .eq('account_id', accountId);

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

    const events = (eventsData || []).map((event: any) => ({
      id: event.id,
      lead_id: event.lead_id,
      lead_nome: event.leads?.nome || 'N/A',
      content_brief_id: event.content_brief_id,
      campaign_id: event.campaign_id,
      campaign_nome: event.content_campaigns?.nome,
      automation_id: event.automation_id,
      automation_nome: event.ig_automacoes?.nome,
      funnel_id: event.funnel_id,
      funnel_nome: event.instagram_funnels?.nome,
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

    const { data, error } = await supabase
      .from('attribution_events')
      .insert([
        {
          account_id: accountId,
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
