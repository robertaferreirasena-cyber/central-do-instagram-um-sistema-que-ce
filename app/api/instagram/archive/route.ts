import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { zernio } from '@/lib/zernio';
import { ApiResponse } from '@/types';

// POST /api/instagram/archive — arquiva ou reativa a conversa no Zernio (status active|archived).
export async function POST(req: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ success: false, error: 'Supabase não configurado' } as ApiResponse<null>, { status: 500 });
    const { conversation_id, status } = await req.json();
    const novoStatus: 'active' | 'archived' = status === 'archived' ? 'archived' : 'active';
    if (!conversation_id) {
      return NextResponse.json({ success: false, error: 'conversation_id obrigatório' } as ApiResponse<null>, { status: 400 });
    }

    const { data: conv } = await supabase
      .from('zernio_conversations')
      .select('zernio_conversa, zernio_account')
      .eq('id', conversation_id)
      .single();
    if (!conv) return NextResponse.json({ success: false, error: 'Conversa não encontrada' } as ApiResponse<null>, { status: 404 });

    const { error } = await zernio.updateConversation(conv.zernio_conversa, conv.zernio_account, novoStatus);
    if (error) {
      return NextResponse.json({ success: false, error } as ApiResponse<null>, { status: 400 });
    }

    // Reflete localmente
    await supabase
      .from('zernio_conversations')
      .update({ estado: novoStatus === 'archived' ? 'arquivado' : 'novo', updated_at: new Date() })
      .eq('id', conversation_id);

    return NextResponse.json({ success: true, data: { status: novoStatus } } as ApiResponse<any>);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status: 500 });
  }
}
