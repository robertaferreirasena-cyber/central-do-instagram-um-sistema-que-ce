import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { zernio } from '@/lib/zernio';
import { downloadMediaToStorage } from '@/lib/storage';
import { ApiResponse } from '@/types';

// POST /api/zernio/sync-conversation
// Sincroniza mensagens de UMA conversa específica com throttle de 20s
export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const body = await req.json();
    const { conversation_id, force } = body;

    if (!conversation_id) {
      return NextResponse.json(
        { success: false, error: 'conversation_id obrigatório' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // 1. Buscar conversa local + account_id
    const { data: conversation, error: convError } = await supabase
      .from('zernio_conversations')
      .select('id, zernio_conversa, zernio_account, msgs_sync_em')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversa não encontrada' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // 2. Verificar throttle (20s)
    const now = new Date();
    const lastSync = conversation.msgs_sync_em ? new Date(conversation.msgs_sync_em) : null;
    const timeSinceLastSync = lastSync ? (now.getTime() - lastSync.getTime()) / 1000 : Infinity;

    if (!force && timeSinceLastSync < 20) {
      // Throttle: pula a chamada ao Zernio
      return NextResponse.json(
        {
          success: true,
          data: {
            status: 'throttled',
            timeSinceLastSync: Math.round(timeSinceLastSync),
            nextSyncIn: Math.round(20 - timeSinceLastSync),
          },
        } as ApiResponse<any>,
        { status: 200 }
      );
    }

    // 3. Chamar Zernio.getMessages(conversation_id, account_id, 50)
    const { data: messages, error: msgError } = await zernio.getMessages(
      conversation.zernio_conversa,
      conversation.zernio_account,
      50
    );

    if (msgError || !messages) {
      console.warn(`Erro ao buscar mensagens da conversa ${conversation_id}:`, msgError);
      // Atualiza msgs_sync_em mesmo em erro (próxima tentativa em 20s)
      await supabase
        .from('zernio_conversations')
        .update({ msgs_sync_em: now })
        .eq('id', conversation_id);

      return NextResponse.json(
        { success: false, error: msgError || 'Erro ao buscar mensagens' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // 4. UPSERT mensagens com dedupe por id_externo + conversation_id
    let syncedCount = 0;
    for (const msg of messages) {
      try {
        // Verificar se já existe
        const { data: existing } = await supabase
          .from('zernio_messages')
          .select('id')
          .eq('id_externo', msg.id)
          .eq('conversation_id', conversation.id)
          .maybeSingle();

        if (existing) {
          continue; // Skip duplicata
        }

        // Baixar mídia se houver
        let storedMediaUrl: string | null = null;
        let mediaType: string | null = null;

        if (msg.attachments && msg.attachments.length > 0) {
          const att = msg.attachments[0];
          const mediaUrl = att.url || att.payload?.url || '';
          const attType = att.type || '';

          if (mediaUrl && attType) {
            mediaType = attType;
            const { url: stored } = await downloadMediaToStorage(
              mediaUrl,
              attType as 'image' | 'video',
              att._id || msg.id
            );
            if (stored) {
              storedMediaUrl = stored;
            }
          }
        }

        // Inserir mensagem
        const { error: insertError } = await supabase
          .from('zernio_messages')
          .insert({
            conversation_id: conversation.id,
            id_externo: msg.id,
            autor: msg.senderName || null,
            direcao: msg.direction === 'incoming' ? 'in' : 'out',
            content: msg.message || msg.content || '',
            media_url: storedMediaUrl,
            media_tipo: mediaType,
            created_at: new Date(msg.createdAt),
          });

        if (insertError && !insertError.message.includes('duplicate')) {
          console.warn(`Erro ao inserir mensagem ${msg.id}:`, insertError);
        } else if (!insertError) {
          syncedCount++;
        }
      } catch (err) {
        console.error(`Erro ao processar mensagem ${msg.id}:`, err);
      }
    }

    // 5. Atualizar msgs_sync_em = now
    const { error: updateError } = await supabase
      .from('zernio_conversations')
      .update({ msgs_sync_em: now })
      .eq('id', conversation_id);

    if (updateError) {
      console.warn('Erro ao atualizar msgs_sync_em:', updateError);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          status: 'synced',
          syncedCount,
          totalMessages: messages.length,
        },
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Sync conversation error:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
