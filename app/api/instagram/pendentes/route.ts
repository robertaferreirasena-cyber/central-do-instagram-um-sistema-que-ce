import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { processarPendentes } from '@/lib/instagram';
import { ApiResponse } from '@/types';

// POST - Processar pendentes (cron ou manual)
export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    await processarPendentes();

    return NextResponse.json(
      { success: true, data: { processed: true } } as ApiResponse<any>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Erro ao processar pendentes:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// GET - Listar pendentes
export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const { data: pendentes, error } = await supabase
      .from('ig_pendentes')
      .select('*')
      .eq('enviado', false)
      .order('send_at', { ascending: true })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: pendentes } as ApiResponse<any>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Erro ao listar pendentes:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
