import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getContentAccountId } from '@/lib/tenant';
import { ApiResponse } from '@/types';

interface CalendarItem {
  id: string;
  type: string;
  theme: string;
  caption: string;
  hashtags: string[];
  scheduled_at: string;
  status: string;
}

export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const accountId = await getContentAccountId();
    const from = req.nextUrl.searchParams.get('from');
    const to = req.nextUrl.searchParams.get('to');

    let query = supabase
      .from('content_briefs')
      .select('id, type, theme, caption, hashtags, scheduled_at, status')
      .eq('account_id', accountId)
      .not('scheduled_at', 'is', null)
      .order('scheduled_at', { ascending: true });

    // Filtrar por período se fornecido
    if (from) {
      query = query.gte('scheduled_at', from);
    }
    if (to) {
      query = query.lte('scheduled_at', to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar calendário:', error);
      return NextResponse.json(
        { success: false, error: error.message } as ApiResponse<null>,
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: (data as CalendarItem[]) || [] } as ApiResponse<CalendarItem[]>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Erro em GET content/calendar:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
