import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { zernio } from '@/lib/zernio';

// POST /api/instagram/typing — mostra "digitando…" pro cliente no Direct.
export async function POST(req: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ success: false }, { status: 500 });
    const { conversation_id } = await req.json();
    if (!conversation_id) return NextResponse.json({ success: false, error: 'conversation_id obrigatório' }, { status: 400 });

    const { data: conv } = await supabase
      .from('zernio_conversations')
      .select('zernio_conversa, zernio_account')
      .eq('id', conversation_id)
      .single();
    if (!conv) return NextResponse.json({ success: false }, { status: 404 });

    // best-effort: se falhar, não atrapalha a digitação
    const { error } = await zernio.sendTyping(conv.zernio_conversa, conv.zernio_account);
    return NextResponse.json({ success: !error });
  } catch {
    return NextResponse.json({ success: false });
  }
}
