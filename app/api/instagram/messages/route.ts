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
      .select('id, id_externo, autor, content, direcao, media_url, media_tipo, created_at')
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
      id_externo: msg.id_externo,
      text: msg.content,
      is_outgoing: msg.direcao === 'out',
      autor: msg.autor,
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

    // Recursos do Direct que o Zernio expõe no envio (§ doc CHIMAGI):
    // botões de link (web_url) e respostas rápidas. IG entrega como linhas de texto.
    const outButtons = Array.isArray(body.buttons)
      ? body.buttons
          .filter((b: any) => b && b.title && b.url)
          .slice(0, 3)
          .map((b: any) => ({ type: 'web_url' as const, title: String(b.title), url: String(b.url) }))
      : [];
    const outQuick = Array.isArray(body.quickReplies)
      ? body.quickReplies.filter((q: any) => typeof q === 'string' && q.trim()).map((q: string) => q.trim()).slice(0, 13)
      : [];
    // Mídia de saída (imagem/vídeo por URL pública) e responder-citando (replyTo).
    const attachmentUrl: string | undefined = typeof body.attachmentUrl === 'string' && body.attachmentUrl ? body.attachmentUrl : undefined;
    const attachmentType: 'image' | 'video' | 'audio' | 'file' | undefined =
      attachmentUrl ? (['image', 'video', 'audio', 'file'].includes(body.attachmentType) ? body.attachmentType : 'image') : undefined;
    const replyTo: string | undefined = typeof body.replyTo === 'string' && body.replyTo ? body.replyTo : undefined;

    if (!conversation_id || (!text && outButtons.length === 0 && !attachmentUrl)) {
      return NextResponse.json(
        { success: false, error: 'conversation_id e conteúdo (texto, botão ou imagem) obrigatórios' } as ApiResponse<null>,
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

    const ehJanelaFechada = (err: string) => {
      const low = err.toLowerCase();
      return (
        (low.includes('outside') && low.includes('window')) ||
        (low.includes('24') && low.includes('hour')) ||
        low.includes('messaging window') ||
        low.includes('re-engage') ||
        low.includes('(#10)') ||
        low.includes('code":10') ||
        low.includes('code": 10')
      );
    };

    const opcoes = { attachmentUrl, attachmentType, replyTo };

    // Enviar via Zernio (sai de verdade no Direct do Instagram) com botões/quick/mídia
    let { data, error } = await zernio.sendMessage(
      conversation.zernio_conversa,
      conversation.zernio_account,
      text || '',
      outButtons.length ? outButtons : undefined,
      outQuick.length ? outQuick : undefined,
      opcoes
    );

    // Se a Meta recusou pela janela de 24h, tenta DE NOVO como AGENTE HUMANO (janela de 7
    // dias) — exatamente o que o app do Instagram faz quando um HUMANO responde manualmente.
    let usouAgenteHumano = false;
    if (error && ehJanelaFechada(error)) {
      usouAgenteHumano = true;
      const retry = await zernio.sendMessage(
        conversation.zernio_conversa,
        conversation.zernio_account,
        text || '',
        outButtons.length ? outButtons : undefined,
        outQuick.length ? outQuick : undefined,
        { ...opcoes, messagingType: 'MESSAGE_TAG', messageTag: 'HUMAN_AGENT' }
      );
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('Erro ao enviar mensagem (agente humano=' + usouAgenteHumano + '):', error);
      const low = error.toLowerCase();
      // Caso específico: a tag "Human Agent" precisa de aprovação da Meta no app do Zernio.
      const precisaAprovacaoHumanAgent = low.includes('human agent') && (low.includes('approved') || low.includes('review'));
      const janelaFechada = ehJanelaFechada(error);
      let mensagem: string;
      let code: string;
      if (precisaAprovacaoHumanAgent) {
        code = 'human_agent_unapproved';
        mensagem =
          'Fora das 24h, o Instagram só deixa o app OFICIAL responder (ele tem a permissão "Agente Humano" embutida). Por aqui, via API do Zernio, a Meta exige que essa permissão seja aprovada no app — enquanto não for, responda dentro de 24h da última mensagem do cliente, ou peça pro cliente te mandar uma nova mensagem (isso reabre a janela).';
      } else if (janelaFechada) {
        code = 'window_closed';
        mensagem = `O Instagram recusou o envio (fora da janela de mensagens). Responda dentro de 24h da última mensagem do cliente. Detalhe da Meta: ${error}`;
      } else {
        code = 'zernio_error';
        mensagem = `Não saiu no Instagram. Resposta: ${error}`;
      }
      return NextResponse.json(
        { success: false, error: mensagem, code } as ApiResponse<null> & { code: string },
        { status: 400 }
      );
    }

    const agora = new Date();
    // Monta o texto persistido igual ao que o IG entrega: mensagem + linhas dos botões/quick.
    let persistText = text || '';
    if (outButtons.length) {
      persistText += (persistText ? '\n' : '') + outButtons.map((b: { title: string; url: string }) => `👉 ${b.title}: ${b.url}`).join('\n');
    }
    if (outQuick.length) {
      persistText += (persistText ? '\n' : '') + outQuick.map((q: string) => `▪️ ${q}`).join('\n');
    }
    // Persiste a mensagem ENVIADA localmente (aparece na hora, como no Instagram),
    // idempotente por id_externo. Direção 'out'.
    const idExterno = (data && (data.id || data._id)) ? `zmsg:${data.id || data._id}` : `out:${conversation_id}:${agora.getTime()}`;
    const { data: saved } = await supabase
      .from('zernio_messages')
      .insert({
        conversation_id,
        id_externo: idExterno,
        autor: 'Você',
        direcao: 'out',
        content: persistText,
        media_url: attachmentUrl || null,
        media_tipo: attachmentUrl ? attachmentType : null,
        created_at: agora,
      })
      .select('id, content, direcao, created_at')
      .single();

    // Atualiza a conversa: última mensagem + estado aguardando cliente.
    await supabase
      .from('zernio_conversations')
      .update({ last_message: persistText || (attachmentUrl ? '📷 Imagem' : ''), estado: 'aguardando_cliente', updated_time: agora, updated_at: agora })
      .eq('id', conversation_id);

    return NextResponse.json(
      { success: true, data: { zernio: data, message: saved } } as ApiResponse<any>,
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
