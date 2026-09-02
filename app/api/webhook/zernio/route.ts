import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { zernio, ZernioClient, type ZernioConversation, type ZernioMessage } from '@/lib/zernio';
import { downloadMediaToStorage } from '@/lib/storage';
import { ApiResponse } from '@/types';
import { processarComentario, processarStoryReply, type CommentPayload, type StoryReplyPayload } from '@/lib/instagram';

// POST - Webhook de Zernio (message.received, conversation.started, comment.received)
export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // 1. Ler corpo CRU e validar HMAC-SHA256
    const rawBody = await req.text();
    const signature = req.headers.get('X-Zernio-Signature') || '';
    const secret = process.env.ZERNIO_WEBHOOK_SECRET;

    if (!secret || !signature) {
      console.warn('⚠️ Webhook Zernio: secret ou signature ausentes');
      return NextResponse.json(
        { success: false, error: 'Autenticação falhou' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    if (!ZernioClient.verifySignature(secret, rawBody, signature)) {
      console.warn('❌ Webhook Zernio: assinatura HMAC inválida');
      return NextResponse.json(
        { success: false, error: 'Assinatura inválida' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);

    // 2. Parsing defensivo do evento
    const parsed = parseEvento(payload);

    if (!parsed) {
      console.warn('⚠️ Webhook Zernio: evento mal-formado ou sem dados relevantes');
      return NextResponse.json({ success: true, data: { skipped: true } } as ApiResponse<any>);
    }

    // 3. Se comentário, processar via motor de comentários (fase 3)
    if (parsed.tipo === 'comment.received') {
      console.log('📝 Comentário recebido:', parsed.comment_id, parsed.texto);

      const comentario: CommentPayload = {
        comment_id: parsed.comment_id || '',
        media_id: parsed.media_id || '',
        account_id: parsed.account_id,
        texto: parsed.texto,
        autor_id: parsed.remetente_id || '',
        autor_nome: parsed.remetente_nome || '',
        author_username: parsed.remetente_handle || '',
        platform: parsed.platform,
      };

      await processarComentario(comentario);
      return NextResponse.json({ success: true, data: { comment: true } } as ApiResponse<any>);
    }

    // 4. Se mensagem ou conversa iniciada, processar inbox
    if (parsed.tipo === 'message.received' || parsed.tipo === 'conversation.started') {
      await ingerirMensagem(parsed);
      return NextResponse.json({ success: true, data: { ingested: true } } as ApiResponse<any>);
    }

    return NextResponse.json({ success: true, data: { skipped: true } } as ApiResponse<any>);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Webhook Zernio error:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// Tipos do evento parseado
interface ParsedEvent {
  evento_id: string;
  tipo: string;
  platform: string;
  account_id: string;
  conversation_id: string;
  remetente_id?: string;
  remetente_nome?: string;
  remetente_handle?: string;
  telefone?: string;
  texto: string;
  media_url?: string;
  media_tipo?: string;
  msg_id: string;
  story_id?: string;
  story_url?: string;
  is_story_reply: boolean;
  comment_id?: string;
  media_id?: string;
}

// Parsing defensivo do evento Zernio (tolerante a aninhamento)
function parseEvento(payload: any): ParsedEvent | null {
  try {
    // Extrair tipo de evento
    const tipo = payload.type || payload.evento || payload.event || '';

    // Coagir dict→id (helper para account_id/conversation_id que podem vir como objeto)
    const _coerce = (val: any): string => {
      if (typeof val === 'string') return val;
      if (val && typeof val === 'object' && val.id) return val.id;
      if (val && typeof val === 'object' && val._id) return val._id;
      return String(val || '');
    };

    // Extrair dados de diferentes localizações possíveis (defensivo)
    const data = payload.data || payload.message || payload;
    const conversation_id = _coerce(payload.conversation_id || payload.conversationId || data.conversation_id || data.conversationId || '');
    const account_id = _coerce(payload.account_id || payload.accountId || data.account_id || data.accountId || '');
    const msg_id = payload.message_id || payload.messageId || data.id || payload.id || '';
    const texto = payload.message || payload.content || data.message || data.content || '';

    // Extrair remetente/participante
    const sender = payload.sender || payload.contact || payload.participant || data.sender || data.contact || {};
    const remetente_id = _coerce(sender.id || sender._id || '');
    const remetente_nome = sender.name || payload.sender_name || '';
    const remetente_handle = sender.username || payload.sender_username || '';

    // Platform
    const platform = payload.platform || data.platform || 'instagram';

    // Detectar story reply
    const is_story_reply = !!(
      payload.message?.reply_to?.story ||
      data.reply_to?.story ||
      payload.story_id ||
      data.story_id ||
      payload.messageType?.includes('story') ||
      data.messageType?.includes('story')
    );

    const story_id = payload.story_id || data.story_id || '';

    // Mídia (attachments)
    let media_url = '';
    let media_tipo = '';
    const attachments = payload.attachments || payload.message?.attachments || data.attachments || [];
    if (Array.isArray(attachments) && attachments.length > 0) {
      const att = attachments[0];
      media_url = att.url || att.payload?.url || '';
      media_tipo = att.type || '';
    }

    // Mínimo de dados válidos
    if (!conversation_id || !msg_id || (!texto && !media_url)) {
      return null;
    }

    const comment_id = payload.comment_id || payload.commentId || data.comment_id || '';
    const media_id = payload.media_id || payload.mediaId || data.media_id || payload.instagram_id || '';

    return {
      evento_id: payload.evento_id || payload.id || msg_id,
      tipo,
      platform,
      account_id,
      conversation_id,
      remetente_id,
      remetente_nome,
      remetente_handle,
      texto,
      media_url,
      media_tipo,
      msg_id,
      story_id,
      is_story_reply,
      comment_id,
      media_id,
    };
  } catch (err) {
    console.error('Erro ao parsear evento:', err);
    return null;
  }
}

// Porta única de entrada: ingerir mensagem no Supabase
async function ingerirMensagem(parsed: ParsedEvent) {
  if (!supabase) return;

  try {
    // 1. Verificar se é dedupe por id_externo
    const { data: existing } = await supabase
      .from('zernio_messages')
      .select('id')
      .eq('id_externo', parsed.msg_id)
      .maybeSingle();

    if (existing) {
      console.log('ℹ️ Mensagem duplicada, ignorando:', parsed.msg_id);
      return;
    }

    // 2. Resolver a conta pelo account_id ou platform
    let account_id = parsed.account_id;
    if (!account_id) {
      // Fallback: buscar por platform
      const { data: account } = await supabase
        .from('zernio_accounts')
        .select('account_id')
        .eq('platform', parsed.platform)
        .limit(1)
        .maybeSingle();

      if (account) {
        account_id = account.account_id;
      }
    }

    if (!account_id) {
      console.warn('⚠️ Não foi possível resolver account_id para:', parsed.conversation_id);
      return;
    }

    // 3. Upsert da conversa
    const { data: conversation, error: convError } = await supabase
      .from('zernio_conversations')
      .upsert(
        {
          zernio_conversa: parsed.conversation_id,
          zernio_account: account_id,
          participant_id: parsed.remetente_id,
          participant_username: parsed.remetente_handle,
          participant_name: parsed.remetente_nome,
          last_message: parsed.texto,
          origem: parsed.is_story_reply ? 'story_reply' : 'direct',
          unread_count: 1,
          updated_time: new Date().toISOString(),
          updated_at: new Date(),
        },
        {
          onConflict: 'zernio_conversa,zernio_account',
        }
      )
      .select()
      .single();

    if (convError || !conversation) {
      console.error('Erro ao upsert conversa:', convError);
      return;
    }

    // 4. Baixar mídia se houver
    let storedMediaUrl = parsed.media_url;
    if (parsed.media_url && parsed.media_tipo) {
      const { url, error: storageError } = await downloadMediaToStorage(
        parsed.media_url,
        parsed.media_tipo as 'image' | 'video',
        parsed.msg_id
      );

      if (url) {
        storedMediaUrl = url;
      } else if (storageError) {
        console.warn('Erro ao fazer download de mídia:', storageError);
      }
    }

    // 5. Inserir mensagem (idempotente por id_externo)
    const { error: msgError } = await supabase
      .from('zernio_messages')
      .insert({
        conversation_id: conversation.id,
        id_externo: parsed.msg_id,
        autor: parsed.remetente_nome || parsed.remetente_handle,
        direcao: 'in',
        content: parsed.texto,
        media_url: storedMediaUrl,
        media_tipo: parsed.media_tipo,
        created_at: new Date(),
      });

    if (msgError) {
      console.error('Erro ao inserir mensagem:', msgError);
      return;
    }

    console.log('✅ Mensagem ingerida:', parsed.msg_id);
  } catch (err) {
    console.error('❌ Erro ao ingerir mensagem:', err);
  }
}
