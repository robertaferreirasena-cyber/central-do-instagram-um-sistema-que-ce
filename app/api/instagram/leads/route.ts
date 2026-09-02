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
    const origem = searchParams.get('origem');
    const status = searchParams.get('status');

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'accountId obrigatório' }, { status: 400 });
    }

    let query = supabase
      .from('leads')
      .select('*, sellers(nome)')
      .eq('account_id', accountId);

    if (origem) query = query.eq('origem', origem);
    if (status) query = query.eq('status', status);

    const { data: leadsData, error } = await query.order('criado_em', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const leads = leadsData?.map((lead: any) => ({
      ...lead,
      vendedor_nome: lead.sellers?.nome,
    })) || [];

    // Calcular KPIs
    const kpis = {
      total: leadsData?.length || 0,
      por_origem: {} as Record<string, number>,
      por_status: {} as Record<string, number>,
    };

    leadsData?.forEach((lead: any) => {
      kpis.por_origem[lead.origem] = (kpis.por_origem[lead.origem] || 0) + 1;
      kpis.por_status[lead.status] = (kpis.por_status[lead.status] || 0) + 1;
    });

    return NextResponse.json({ success: true, leads, kpis });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { nome, telefone, instagram, origem, accountId } = body;

    if (!nome || !accountId) {
      return NextResponse.json({ success: false, error: 'nome e accountId obrigatórios' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          account_id: accountId,
          nome,
          telefone: telefone || '',
          instagram: instagram || '',
          origem: origem || 'direct',
          interesse: '',
          score: 0,
          status: 'novo',
          resultado: '',
          historico: [],
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
