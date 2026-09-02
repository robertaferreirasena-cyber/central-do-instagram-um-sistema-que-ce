import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { autoResponder } from '@/lib/agente';
import { ApiResponse } from '@/types';

// POST /api/instagram/conversa-atendimento
// Quando selecionado um agente na inbox, dispara autoResponder na hora
export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const body = await req.json();
    const { conversation_id, agente_id } = body;

    if (!conversation_id) {
      return NextResponse.json(
        { success: false, error: 'conversation_id obrigatório' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // 1. Atualizar a conversa com o agente e modo='agente'
    const { error: updateError } = await supabase
      .from('zernio_conversations')
      .update({
        agente_id: agente_id || null,
        modo: 'agente',
      })
      .eq('id', conversation_id);

    if (updateError) {
      console.error('Erro ao atualizar conversa:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // 2. Disparar autoResponder (async, não espera)
    autoResponder(conversation_id).catch(err => {
      console.error('Erro em autoResponder:', err);
    });

    return NextResponse.json(
      { success: true, data: { message: 'Agente acionado' } } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Erro em conversa-atendimento:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
