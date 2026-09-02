import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getContentAccountId } from '@/lib/tenant';
import { ContentBrief, ContentStatus, ApiResponse } from '@/types';

// GET - Listar briefs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as ContentStatus | null;
    const accountId = await getContentAccountId();

    let query = supabase.from('content_briefs').select('*');

    if (accountId) {
      query = query.eq('account_id', accountId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } as ApiResponse<null>,
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data } as ApiResponse<ContentBrief[]>);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status: 500 });
  }
}

// POST - Criar novo brief
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ContentBrief>;

    // Validar campos obrigatórios (account_id é resolvido no servidor)
    if (!body.type || !body.caption || !body.scheduled_at) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios faltando: type, caption, scheduled_at' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const brief = {
      account_id: await getContentAccountId(),
      type: body.type,
      theme: body.theme || '',
      caption: body.caption,
      hashtags: body.hashtags || [],
      scheduled_at: body.scheduled_at,
      status: ContentStatus.DRAFT,
      created_by: body.created_by || 'unknown',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const { data, error } = await supabase.from('content_briefs').insert([brief]).select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 400 });
    }

    return NextResponse.json({ success: true, data } as ApiResponse<ContentBrief>, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status: 500 });
  }
}
