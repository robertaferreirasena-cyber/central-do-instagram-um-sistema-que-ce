import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { zernio } from '@/lib/zernio';
import { ApiResponse } from '@/types';

// GET /api/instagram/messages?conversation_id=...
// Lista mensagens da conversa, ordenadas por tempo
export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const conversation_id = searchParams.get('conversation_id');

    if (!conversation_id) {
      return NextResponse.json(
        { success: false, error: 'conversation_id obrigatório' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Buscar mensagens da conversa, ordenadas por created_at
    const { data: messages, error } = await supabase
      .from('zernio_messages')
      .select('id, autor, content, direcao, media_url, media_tipo, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return NextResponse.json(
        { success: false, error: error.message } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Normalizar para o shape que a página espera
    const normalized = (messages || []).map((msg: any) => ({
      id: msg.id,
      text: msg.content,
      is_outgoing: msg.direcao === 'out',
      media_url: msg.media_url,
      media_tipo: msg.media_tipo,
      created_at: msg.created_at,
    }));

    return NextResponse.json(
      { success: true, data: normalized } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Erro em GET messages:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// POST /api/instagram/messages
// Envia mensagem pela Zernio
export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const body = await req.json();
    const { conversation_id, text } = body;

    if (!conversation_id || !text) {
      return NextResponse.json(
        { success: false, error: 'conversation_id e text obrigatórios' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Buscar conversa para pegar zernio_conversa e account_id
    const { data: conversation } = await supabase
      .from('zernio_conversations')
      .select('zernio_conversa, zernio_account')
      .eq('id', conversation_id)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversa não encontrada' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // Enviar via Zernio
    const { data, error } = await zernio.sendMessage(
      conversation.zernio_conversa,
      conversation.zernio_account,
      text
    );

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
      return NextResponse.json(
        { success: false, error } as ApiResponse<null>,
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Erro em POST messages:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
