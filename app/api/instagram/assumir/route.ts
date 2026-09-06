import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// POST /api/instagram/assumir
// Marca a conversa como assumida por humano: estado='em_atendimento', modo='humano'.
// Isso tira a conversa das mãos do agente automático.
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { conversation_id } = body;

    if (!conversation_id) {
      return NextResponse.json({ success: false, error: 'conversation_id obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('zernio_conversations')
      .update({ estado: 'em_atendimento', modo: 'humano' })
      .eq('id', conversation_id)
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
