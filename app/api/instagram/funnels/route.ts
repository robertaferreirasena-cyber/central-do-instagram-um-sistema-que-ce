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

    let query = supabase.from('instagram_funnels').select('*');

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data, error } = await query.order('criado_em', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { nome, descricao, accountId } = body;

    if (!nome || !accountId) {
      return NextResponse.json({ success: false, error: 'nome e accountId obrigatórios' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('instagram_funnels')
      .insert([
        {
          account_id: accountId,
          nome,
          descricao: descricao || '',
          status: 'rascunho',
          graph_json: { nodes: [], edges: [] },
          versao: 1,
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

export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'id obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('instagram_funnels')
      .update({
        graph_json: body.graph_json,
        status: body.status,
        versao: (body.versao || 1) + 1,
      })
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
