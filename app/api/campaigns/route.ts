import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const account_id = request.nextUrl.searchParams.get('account_id');

    if (!account_id) {
      return NextResponse.json(
        { error: 'account_id é obrigatório' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('content_campaigns')
      .select('*')
      .eq('account_id', account_id)
      .order('criado_em', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao listar campanhas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Erro ao listar campanhas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

interface CreateCampaignRequest {
  account_id: string;
  nome: string;
  descricao?: string;
  start_date: string;
  end_date: string;
  theme?: string;
  created_by: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCampaignRequest = await request.json();
    const { account_id, nome, descricao, start_date, end_date, theme, created_by } = body;

    if (!account_id || !nome || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'account_id, nome, start_date e end_date são obrigatórios' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('content_campaigns')
      .insert({
        account_id,
        nome,
        descricao,
        start_date,
        end_date,
        theme,
        created_by,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao criar campanha' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Erro ao criar campanha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
