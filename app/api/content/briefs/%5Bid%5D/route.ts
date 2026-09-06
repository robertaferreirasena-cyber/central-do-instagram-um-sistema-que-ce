import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { ContentStatus, ApiResponse } from '@/types';

// PUT - Atualizar brief
export async function PUT(
  req: NextRequest,
  context: any
) {
  try {
    const body = await req.json();
    const { id } = await context.params;

    const { data, error } = await supabase
      .from('content_briefs')
      .update({ ...body, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 400 });
    }

    return NextResponse.json({ success: true, data } as ApiResponse<any>);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status: 500 });
  }
}

// DELETE - Deletar brief (apenas rascunho)
export async function DELETE(
  req: NextRequest,
  context: any
) {
  try {
    const { id } = await context.params;

    // Verificar se está em rascunho
    const { data: brief, error: fetchError } = await supabase
      .from('content_briefs')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || brief?.status !== ContentStatus.DRAFT) {
      return NextResponse.json(
        { success: false, error: 'Apenas briefs em rascunho podem ser deletados' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const { error } = await supabase.from('content_briefs').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message } as ApiResponse<null>, { status: 400 });
    }

    return NextResponse.json({ success: true, data: null } as ApiResponse<null>);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status: 500 });
  }
}
