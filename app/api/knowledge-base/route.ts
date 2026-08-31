import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { ApiResponse } from '@/types';

// GET - Listar base de conhecimento
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('account_id');
    const category = searchParams.get('category');

    let query = supabase.from('base_conhecimento').select('*');

    if (accountId) {
      query = query.eq('account_id', accountId);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } as ApiResponse<null>,
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data } as ApiResponse<any[]>);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status: 500 });
  }
}

// POST - Criar item de base de conhecimento
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validar campos
    if (!body.account_id || !body.question || !body.answer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos obrigatórios faltando: account_id, question, answer',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const item = {
      account_id: body.account_id,
      category: body.category || 'geral',
      question: body.question,
      answer: body.answer,
      confidence_threshold: body.confidence_threshold || 0.7,
      active: body.active !== false,
      created_by: body.created_by || 'unknown',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const { data, error } = await supabase.from('base_conhecimento').insert([item]).select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 400 });
    }

    return NextResponse.json({ success: true, data } as ApiResponse<any>, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status: 500 });
  }
}
