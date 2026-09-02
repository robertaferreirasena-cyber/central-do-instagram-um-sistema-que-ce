import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { zernio } from '@/lib/zernio';
import { downloadMediaToStorage } from '@/lib/storage';
import { ApiResponse } from '@/types';

// POST /api/zernio/sync - Sincronizar inbox com Zernio (botão "Sincronizar Direct")
export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // 1. Listar contas Zernio ativas
    const { data: accounts, error: accountsError } = await supabase
      .from('zernio_accounts')
      .select('id, account_id, username, platform')
      .eq('platform', 'instagram');

    if (accountsError || !accounts) {
      console.error('Erro ao buscar contas:', accountsError);
      return NextResponse.json(
        { success: false, error: accountsError?.message || 'Erro ao buscar contas' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const results = [];

    // 2. Para cada conta, sincronizar inbox
    for (const account of accounts) {
      try {
        const { data: conversations, error: convError } = await zernio.listConversations(account.account_id, 80);

        if (convError || !conversations) {
          console.warn(`Erro ao listar conversas da conta ${account.username}:`, convError);
          results.push({ account: account.username, status: 'error', message: convError });
          continue;
        }

        let syncedCount = 0;

        // 3. Para cada conversa, upsert no Supabase (dedupe por zernio_conversa)
        for (const conv of conversations) {
          try {
            // Upsert conversa
            const { data: conversation, error: upsertError } = await supabase
              .from('zernio_conversations')
              .upsert(
                {
                  zernio_conversa: conv.id,
                  zernio_account: account.account_id,
                  account_id: 'default-account',
                  participant_id: conv.participantId,
                  participant_username: conv.participantUsername,
                  participant_name: conv.participantName,
                  participant_picture_url: conv.participantPicture,
                  last_message: conv.lastMessage,
                  status: conv.status,
                  unread_count: conv.unreadCount,
                  estado: conv.unreadCount > 0 ? 'aguardando_humano' : 'novo',
                  origem: 'direct',
                  updated_time: conv.updatedTime ? new Date(conv.updatedTime) : new Date(),
                  updated_at: new Date(),
                },
                {
                  onConflict: 'zernio_conversa,zernio_account',
                }
              )
              .select()
              .single();

            if (upsertError || !conversation) {
              console.warn(`Erro ao upsert conversa ${conv.id}:`, upsertError);
              continue;
            }

            // Sincronizar mensagens dessa conversa (sob demanda)
            const { data: messages, error: msgError } = await zernio.getMessages(conv.id, account.account_id, 50);

            if (!msgError && messages) {
              for (const msg of messages) {
                try {
                  // Verificar dedupe
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
                  let storedMediaUrl = '';
                  let mediaType = '';

                  if (msg.attachments && msg.attachments.length > 0) {
                    const att = msg.attachments[0];
                    const mediaUrl = att.url || att.payload?.url || '';
                    mediaType = att.type || '';

                    if (mediaUrl && mediaType) {
                      const { url: stored } = await downloadMediaToStorage(
                        mediaUrl,
                        mediaType as 'image' | 'video',
                        msg.id || att._id
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
                      autor: msg.senderName,
                      direcao: msg.direction === 'incoming' ? 'in' : 'out',
                      content: msg.message || msg.content || '',
                      media_url: storedMediaUrl || null,
                      media_tipo: mediaType || null,
                      created_at: new Date(msg.createdAt),
                    });

                  if (insertError && !insertError.message.includes('duplicate')) {
                    console.warn(`Erro ao inserir mensagem ${msg.id}:`, insertError);
                  }
                } catch (err) {
                  console.error(`Erro ao processar mensagem ${msg.id}:`, err);
                }
              }
            }

            syncedCount++;
          } catch (err) {
            console.error(`Erro ao sincronizar conversa ${conv.id}:`, err);
          }
        }

        results.push({ account: account.username, status: 'success', synced: syncedCount });
      } catch (err) {
        console.error(`Erro ao sincronizar conta ${account.username}:`, err);
        results.push({ account: account.username, status: 'error', message: String(err) });
      }
    }

    return NextResponse.json({ success: true, data: { synced: results } } as ApiResponse<any>);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Sync error:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
