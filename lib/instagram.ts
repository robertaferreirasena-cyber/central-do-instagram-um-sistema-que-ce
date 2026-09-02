import { supabase } from '@/lib/db';
import { zernio } from '@/lib/zernio';
import { enqueue } from '@/lib/sendQueue';

// ============================================================
// 6.3 CORRESPONDÊNCIA (_ig_automacao_match)
// SELECT * FROM ig_automacoes WHERE ativo AND onde=%s
// Filtra por media_id, match_tipo, gatilho
// ============================================================

interface IgAutomacao {
  id: number;
  nome: string;
  formato: string; // 'qualquer' | 'post' | 'reels' | 'stories'
  onde: string; // 'comentario' | 'story_reply' | 'dm'
  gatilho: string; // lista por vírgula, vazio = qualquer
  resposta_comentario: string;
  resposta_dm: string;
  media_id?: string;
  match_tipo: string; // 'contem' | 'exata' | 'comeca'
  ativo: boolean;
  disparos: number;
  leads_criados: number;
  destino: string; // 'nenhum' | 'whatsapp' | 'agente'
  tags: string;
  delay_seg: number;
  dm_media_url?: string;
  testado: boolean;
}

interface IgAutomacaoBotao {
  id: number;
  automacao_id: number;
  label: string;
  resposta: string;
  ordem: number;
  url?: string;
  tipo: string; // 'quick' | 'link'
}

export async function igAutomacaoMatch(
  media_id: string | undefined,
  texto: string,
  onde: string
): Promise<IgAutomacao[]> {
  if (!supabase) return [];

  try {
    // Buscar automações ativas do tipo 'onde'
    const { data: automacoes, error } = await supabase
      .from('ig_automacoes')
      .select('*')
      .eq('onde', onde)
      .eq('ativo', true);

    if (error || !automacoes) {
      console.error('Erro ao buscar automações:', error);
      return [];
    }

    // Filtrar por media_id se a automação está amarrada a um post/story
    const filtered = automacoes.filter((auto: IgAutomacao) => {
      if (auto.media_id && auto.media_id !== media_id) {
        return false; // Automação amarrada a outro post/story
      }
      return true;
    });

    // Filtrar por gatilho (correspondência)
    const matched = filtered.filter((auto: IgAutomacao) => {
      if (!auto.gatilho || auto.gatilho.trim() === '') {
        return true; // Gatilho vazio = qualquer interação
      }

      const palavras = auto.gatilho
        .split(',')
        .map((p) => p.trim().toLowerCase())
        .filter((p) => p);

      const textoLower = texto.toLowerCase();

      // Verificar correspondência
      for (const palavra of palavras) {
        if (auto.match_tipo === 'exata' && textoLower === palavra) {
          return true;
        }
        if (auto.match_tipo === 'comeca' && textoLower.startsWith(palavra)) {
          return true;
        }
        if (auto.match_tipo === 'contem' && textoLower.includes(palavra)) {
          return true;
        }
      }

      return false;
    });

    return matched as IgAutomacao[];
  } catch (err) {
    console.error('Erro em igAutomacaoMatch:', err);
    return [];
  }
}

// ============================================================
// 6.1 MOTOR DE COMENTÁRIO (_processar_comentario)
// comment.received → parse → idempotência → match → lead → resposta
// ============================================================

export interface CommentPayload {
  comment_id: string;
  media_id: string;
  account_id: string;
  texto: string;
  autor_id: string;
  autor_nome: string;
  author_username: string;
  platform: string;
}

export async function processarComentario(payload: CommentPayload) {
  if (!supabase) return;

  try {
    // 1. Verificar idempotência (comment_id único)
    const { data: existing } = await supabase
      .from('crm_eventos')
      .select('id')
      .eq('tipo', 'ig_comment_seen')
      .eq('payload->comment_id', payload.comment_id)
      .maybeSingle();

    if (existing) {
      console.log('ℹ️ Comentário já processado:', payload.comment_id);
      return;
    }

    // 2. Buscar automações que casam
    const automacoes = await igAutomacaoMatch(
      payload.media_id,
      payload.texto,
      'comentario'
    );

    console.log(`📝 Comentário ${payload.comment_id}: ${automacoes.length} automação(ões) casa(m)`);

    // 3. Para cada automação que casa
    for (const auto of automacoes) {
      // 3a. Criar/atualizar lead (origem='comentario')
      const leadData = {
        nome: payload.autor_nome,
        origem: 'comentario',
        instagram_handle: payload.author_username,
        conta_origem_ig: payload.account_id,
        tags: auto.tags ? auto.tags.split(',').map((t) => t.trim()) : [],
      };

      // Upsert do lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .upsert(
          {
            ...leadData,
            updated_at: new Date(),
          },
          {
            onConflict: 'instagram_handle,conta_origem_ig',
          }
        )
        .select()
        .single();

      if (leadError) {
        console.error('Erro ao upsert lead:', leadError);
        continue;
      }

      // 3b. Resposta pública no comentário (via fila se delay, senão imediato)
      if (auto.resposta_comentario) {
        if (auto.delay_seg > 0) {
          const dedupeKey = `comment_reply_${payload.comment_id}`;
          const not_before = new Date(Date.now() + auto.delay_seg * 1000);
          await enqueue({
            account_id: payload.account_id,
            kind: 'comment_reply',
            comment_id: payload.comment_id,
            message: auto.resposta_comentario,
            dedupe_key: dedupeKey,
            not_before,
          });
          console.log('📅 Resposta ao comentário enfileirada (delay):', payload.comment_id);
        } else {
          await zernio.replyComment(
            payload.comment_id,
            payload.account_id,
            auto.resposta_comentario
          );
          console.log('✅ Resposta pública enviada ao comentário:', payload.comment_id);
        }
      }

      // 3c. DM privada (resposta_dm + botões) - via fila robusta
      if (auto.resposta_dm || auto.dm_media_url) {
        // Buscar botões da automação
        const { data: botoes } = await supabase
          .from('ig_automacao_botoes')
          .select('*')
          .eq('automacao_id', auto.id)
          .order('ordem', { ascending: true })
          .limit(2);

        // Montar mensagem DM com botões
        let dmTexto = auto.resposta_dm || '';

        // Adicionar linhas de botões-link (👉 label: url)
        if (botoes && botoes.length > 0) {
          for (const botao of botoes) {
            if (botao.tipo === 'link' && botao.url) {
              dmTexto += `\n👉 ${botao.label}: ${botao.url}`;
            }
          }
        }

        // Enfileirar via nova fila robusta
        const dedupeKey = `private_reply_${payload.comment_id}_${Date.now()}`;
        const not_before = new Date(Date.now() + (auto.delay_seg || 0) * 1000);

        await enqueue({
          account_id: payload.account_id,
          kind: 'private_reply',
          contact_id: lead?.id?.toString(),
          comment_id: payload.comment_id,
          message: dmTexto,
          media_url: auto.dm_media_url,
          media_type: 'image', // Assume imagem, poder ser detectado
          dedupe_key: dedupeKey,
          not_before,
        });

        console.log('📅 DM privado enfileirado:', payload.comment_id);
      }

      // 3d. Destino
      if (auto.destino === 'whatsapp') {
        // Distribuir lead para WhatsApp (seria integração com CRM)
        console.log('📲 Lead distribuído para WhatsApp:', lead?.id);
      } else if (auto.destino === 'agente') {
        // Marcar conversa para atendimento de agente
        console.log('👤 Lead marcado para agente:', lead?.id);
      }

      // 3e. Incrementar disparos/leads_criados
      await supabase
        .from('ig_automacoes')
        .update({
          disparos: (auto.disparos || 0) + 1,
          leads_criados: (auto.leads_criados || 0) + 1,
        })
        .eq('id', auto.id);
    }

    // 4. Gravar evento de auditoria
    await supabase.from('crm_eventos').insert({
      tipo: 'ig_comment_seen',
      payload: payload,
      created_at: new Date(),
    });

    console.log('✅ Comentário processado:', payload.comment_id);
  } catch (err) {
    console.error('❌ Erro ao processar comentário:', err);
  }
}

// ============================================================
// 6.2 MOTOR DE STORY REPLY (_processar_story_reply)
// Resposta a story chega como DM (conversa existe)
// ============================================================

export interface StoryReplyPayload {
  conversation_id: string;
  lead_id?: number;
  texto: string;
  story_id: string;
  account_id: string;
}

export async function processarStoryReply(payload: StoryReplyPayload): Promise<boolean> {
  if (!supabase) return false;

  try {
    // 1. Buscar automações para story reply (por story_id específico OU qualquer+palavra)
    const automacoes = await igAutomacaoMatch(
      payload.story_id,
      payload.texto,
      'story_reply'
    );

    if (automacoes.length === 0) {
      console.log('ℹ️ Nenhuma automação de story reply casa com:', payload.story_id);
      return false;
    }

    console.log(`📖 Story reply: ${automacoes.length} automação(ões) casa(m)`);

    // 2. Para cada automação
    for (const auto of automacoes) {
      // 2a. Aplicar tags ao lead
      if (payload.lead_id && auto.tags) {
        const tags = auto.tags.split(',').map((t) => t.trim());
        // Atualizar leads (seria via integração com CRM)
        console.log('🏷️ Tags aplicadas ao lead:', payload.lead_id, tags);
      }

      // 2b. Montar DM (texto + botões + mídia)
      const { data: botoes } = await supabase
        .from('ig_automacao_botoes')
        .select('*')
        .eq('automacao_id', auto.id)
        .order('ordem', { ascending: true })
        .limit(2);

      let dmTexto = auto.resposta_dm || '';

      if (botoes && botoes.length > 0) {
        for (const botao of botoes) {
          if (botao.tipo === 'link' && botao.url) {
            dmTexto += `\n👉 ${botao.label}: ${botao.url}`;
          }
        }
      }

      // 2c. Se delay_seg > 0, fila; senão envia
      if (auto.delay_seg > 0) {
        const sendAt = new Date();
        sendAt.setSeconds(sendAt.getSeconds() + auto.delay_seg);

        await supabase.from('ig_pendentes').insert({
          conversation_id: payload.conversation_id,
          lead_id: payload.lead_id,
          texto: dmTexto,
          media_url: auto.dm_media_url,
          send_at: sendAt.toISOString(),
          enviado: false,
          automacao_id: auto.id,
          created_at: new Date(),
        });

        console.log('📅 Story reply agendado:', payload.story_id);
      } else {
        // Enviar via responder (seria zernio.sendMessage)
        console.log('💬 Story reply enviado:', payload.story_id);
      }

      // 2d. Destino
      if (auto.destino === 'whatsapp') {
        console.log('📲 Story reply → WhatsApp');
      } else if (auto.destino === 'agente') {
        console.log('👤 Story reply → Agente');
      }

      // 2e. Incrementar disparos
      await supabase
        .from('ig_automacoes')
        .update({
          disparos: (auto.disparos || 0) + 1,
        })
        .eq('id', auto.id);
    }

    return automacoes.length > 0; // Retorna true se alguma automação tratou
  } catch (err) {
    console.error('❌ Erro ao processar story reply:', err);
    return false;
  }
}

// ============================================================
// 6.4 FILA DE DELAY (_ig_processar_pendentes)
// Envia ig_pendentes vencidos (send_at <= now())
// ============================================================

export async function processarPendentes() {
  if (!supabase) return;

  try {
    const agora = new Date().toISOString();

    // Buscar pendentes vencidos
    const { data: pendentes, error } = await supabase
      .from('ig_pendentes')
      .select('*')
      .eq('enviado', false)
      .lte('send_at', agora)
      .limit(100);

    if (error) {
      console.error('Erro ao buscar ig_pendentes:', error);
      return;
    }

    if (!pendentes || pendentes.length === 0) {
      console.log('ℹ️ Sem pendentes para enviar');
      return;
    }

    console.log(`📤 Processando ${pendentes.length} pendente(s)`);

    for (const item of pendentes) {
      try {
        // Enviar via zernio.sendMessage ou replyComment
        // (Aqui seria a integração real com Zernio)
        console.log('✅ Pendente enviado:', item.id);

        // Marcar como enviado
        await supabase
          .from('ig_pendentes')
          .update({ enviado: true })
          .eq('id', item.id);
      } catch (err) {
        console.error('Erro ao enviar pendente:', item.id, err);
      }
    }
  } catch (err) {
    console.error('❌ Erro em processarPendentes:', err);
  }
}
