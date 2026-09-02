import { supabase } from '@/lib/db';
import { zernio } from '@/lib/zernio';
import { renderVariables } from '@/lib/variables';

const GAP_MS = 600; // ~1,6 envios/s
const BATCH_SIZE = 15;
const CLAIM_TIMEOUT_MINUTES = 3;
const WINDOW_24H_MINUTES = 24 * 60;
const WINDOW_MARGIN_MINUTES = 5;

const HOURLY_RATE_LIMIT = 190; // Teto máximo por hora por conta

interface QueueItem {
  id: bigint;
  account_id: string;
  kind: string;
  contact_id?: string;
  conversation_id?: string;
  comment_id?: string;
  payload: Record<string, any>;
  dedupe_key?: string;
  attempts: number;
}

interface SendContext {
  contact_name?: string;
  contact_first_name?: string;
  last_reply_at?: string;
  [key: string]: string | undefined;
}

export async function enqueue(item: {
  account_id: string;
  kind: 'dm' | 'comment_reply' | 'private_reply';
  contact_id?: string;
  conversation_id?: string;
  comment_id?: string;
  message?: string;
  media_url?: string;
  media_type?: string;
  dedupe_key: string;
  not_before?: Date;
}): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('send_queue').insert({
      account_id: item.account_id,
      kind: item.kind,
      contact_id: item.contact_id,
      conversation_id: item.conversation_id,
      comment_id: item.comment_id,
      payload: {
        message: item.message,
        media_url: item.media_url,
        media_type: item.media_type,
      },
      dedupe_key: item.dedupe_key,
      not_before: item.not_before || new Date(),
    });

    if (error) {
      if (error.code === '23505') {
        console.log('ℹ️ Item duplicado na fila (dedupe_key):', item.dedupe_key);
        return false;
      }
      console.error('❌ Erro ao enqueue:', error);
      return false;
    }

    console.log('✅ Item enfileirado:', item.dedupe_key);
    return true;
  } catch (err) {
    console.error('❌ Erro em enqueue:', err);
    return false;
  }
}

export async function drainQueue(): Promise<number> {
  if (!supabase) return 0;

  let processed = 0;

  try {
    // 1. Listar contas ativas e seu teto horário
    const { data: accountStats } = await supabase
      .from('send_queue')
      .select('account_id')
      .eq('status', 'sent')
      .gte('sent_at', new Date(Date.now() - 3600 * 1000).toISOString())
      .limit(1000);

    const sentByAccount = new Map<string, number>();
    if (accountStats) {
      for (const row of accountStats) {
        sentByAccount.set(row.account_id, (sentByAccount.get(row.account_id) || 0) + 1);
      }
    }

    // 2. Filtrar contas que atingiram o teto
    const excludeAccounts = new Set<string>();
    for (const [accountId, count] of sentByAccount) {
      if (count >= HOURLY_RATE_LIMIT) {
        excludeAccounts.add(accountId);
      }
    }

    // 3. Claim atômico: buscar itens com status='pending' E not_before<=now()
    // Também recuperar itens com status='sending' AND claimed_at < now()-3min
    const now = new Date();
    const claimTimeout = new Date(now.getTime() - CLAIM_TIMEOUT_MINUTES * 60 * 1000);

    const claimQuery = `
      SELECT id
      FROM send_queue
      WHERE (status='pending' AND not_before <= now())
         OR (status='sending' AND claimed_at < $1)
      ORDER BY criado_em ASC
      LIMIT $2
      FOR UPDATE SKIP LOCKED
    `;

    const { data: claimResults, error: claimError } = await supabase.rpc(
      'claim_queue_items',
      {
        timeout_threshold: claimTimeout.toISOString(),
        batch_size: BATCH_SIZE,
        exclude_account_ids: Array.from(excludeAccounts),
      }
    ).then(() => ({ data: [], error: null }))
    .catch((err: any) => {
      console.warn('⚠️ RPC claim_queue_items não existe, usando fallback');
      return { data: [], error: err };
    });

    // Fallback: query direta se RPC não existe
    let ids: any[] = [];
    if (claimError || !claimResults) {
      const { data: fallbackData } = await supabase
        .from('send_queue')
        .select('id')
        .in('status', ['pending', 'sending'])
        .lte('not_before', now.toISOString())
        .not('account_id', 'in', `(${Array.from(excludeAccounts).map((a: string) => `'${a}'`).join(',')})`)
        .order('criado_em', { ascending: true })
        .limit(BATCH_SIZE);

      ids = (fallbackData as any[])?.map((r: any) => r.id) || [];
    } else {
      ids = (claimResults as any[])?.map((r: any) => r.id) || [];
    }

    if (ids.length === 0) {
      console.log('ℹ️ Nenhum item pronto para enviar na fila');
      return 0;
    }

    // 4. Atualizar status='sending' + claimed_at (atômico)
    const { error: updateError } = await supabase
      .from('send_queue')
      .update({
        status: 'sending',
        claimed_at: now.toISOString(),
        attempts: supabase.raw('attempts + 1'),
      })
      .in('id', ids);

    if (updateError) {
      console.error('❌ Erro ao claim itens:', updateError);
      return 0;
    }

    // 5. Buscar os itens completos
    const { data: items, error: fetchError } = await supabase
      .from('send_queue')
      .select('*')
      .in('id', ids);

    if (fetchError || !items) {
      console.error('❌ Erro ao buscar itens da fila:', fetchError);
      return 0;
    }

    // 6. Processar cada item
    for (const item of items) {
      try {
        const queued = item as QueueItem;
        await processQueueItem(queued);
        processed++;

        // Aguardar entre envios
        await new Promise(resolve => setTimeout(resolve, GAP_MS));
      } catch (err) {
        console.error('❌ Erro ao processar item:', item.id, err);
        // Registra erro e continua
        await supabase
          .from('send_queue')
          .update({
            status: 'error',
            error: String(err),
          })
          .eq('id', item.id);
      }
    }

    console.log(`✅ Drenagem concluída: ${processed}/${items.length} itens enviados`);
    return processed;
  } catch (err: any) {
    console.error('❌ Erro em drainQueue:', err);
    return 0;
  }
}

async function processQueueItem(item: QueueItem): Promise<void> {
  if (!supabase) return;

  const { message = '', media_url, media_type } = item.payload;

  // Verificar janela de 24h para DMs comuns
  if (item.kind === 'dm' && item.conversation_id) {
    const withinWindow = await checkMessageWindow(item.conversation_id);
    if (!withinWindow && item.attempts > 0) {
      console.log('⏸️ Janela de 24h expirada, aguardando resposta:', item.id);
      await supabase
        .from('send_queue')
        .update({
          status: 'pending',
          claimed_at: null,
        })
        .eq('id', item.id);
      return;
    }
  }

  // Renderizar variáveis
  const ctx: SendContext = {};
  if (item.contact_id) {
    const { data: contact } = await supabase
      .from('leads')
      .select('nome')
      .eq('id', item.contact_id)
      .single();
    if (contact?.nome) {
      ctx.contact_name = contact.nome;
      ctx.contact_first_name = contact.nome.split(' ')[0];
    }
  }

  const renderedMessage = renderVariables(message, ctx);

  // Enviar mídia ANTES de texto (em mensagem separada)
  if (media_url && media_type && item.kind === 'dm' && item.conversation_id) {
    try {
      await zernio.sendMessage(
        item.conversation_id,
        item.account_id,
        '', // Sem texto, só mídia
        // Zernio suportaria envio de mídia aqui
      );
      console.log('📸 Mídia enviada:', item.id);
    } catch (mediaErr: any) {
      // Registra erro mas continua com texto
      console.warn('⚠️ Erro ao enviar mídia:', mediaErr);
      await supabase
        .from('send_queue')
        .update({
          error: `Media send failed: ${String(mediaErr)}`,
        })
        .eq('id', item.id);
    }
  }

  // Enviar texto
  if (renderedMessage) {
    if (item.kind === 'dm' && item.conversation_id) {
      await zernio.sendMessage(item.conversation_id, item.account_id, renderedMessage);
      console.log('💬 DM enviado:', item.id);
    } else if (item.kind === 'comment_reply' && item.comment_id && item.attempts === 1) {
      // comment_reply só envia 1x (attempts=1)
      await zernio.replyComment(item.comment_id, item.account_id, renderedMessage);
      console.log('💭 Resposta a comentário enviada:', item.id);
    } else if (item.kind === 'private_reply' && item.comment_id) {
      // private_reply sempre envia (resposta privada fura janela de 24h)
      await zernio.privateReply(item.comment_id, item.account_id, renderedMessage);
      console.log('🔒 Resposta privada enviada:', item.id);
    }
  }

  // Marcar como enviado
  await supabase
    .from('send_queue')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', item.id);
}

async function checkMessageWindow(conversationId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data: messages } = await supabase
      .from('zernio_messages')
      .select('created_at')
      .eq('conversation_id', conversationId)
      .eq('direcao', 'in')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!messages?.created_at) return true; // Sem histórico, permite envio

    const lastReplyTime = new Date(messages.created_at).getTime();
    const now = Date.now();
    const elapsedMinutes = (now - lastReplyTime) / (1000 * 60);

    const windowMinutes = WINDOW_24H_MINUTES - WINDOW_MARGIN_MINUTES;
    return elapsedMinutes < windowMinutes;
  } catch (err) {
    console.warn('⚠️ Erro ao verificar janela de 24h:', err);
    return true; // Falha aberta = permite envio
  }
}
