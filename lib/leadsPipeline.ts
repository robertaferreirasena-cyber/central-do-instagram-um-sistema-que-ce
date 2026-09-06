import { supabase } from './db';
import { getContentAccountId } from './tenant';
import { cerebro } from './agente';

// ============================================================================
// ESPINHA DO CRM — transforma engajamento (conversa/comentário/automação) em LEAD.
// É o elo que ligava as ilhas: conversa → lead → evento de CRM → atribuição.
// Idempotente (dedupe por @ + conta), server-side, INTERNO (não envia nada a cliente).
// ============================================================================

export interface ConversationLike {
  id?: number; // opcional: eventos de comentário não têm conversa no banco ainda
  participant_username?: string | null;
  participant_name?: string | null;
  participant_picture_url?: string | null;
  last_message?: string | null;
  origem?: string | null;
  account_id?: string | null; // tenant TEXTO ('default-account') do zernio_conversations
}

export interface UpsertLeadOptions {
  origem?: string; // sobrescreve a origem: 'comentario' | 'story_reply' | 'automacao' | 'direct'
  funnelId?: number; // atribuição: veio de um funil/flow
  automationId?: number; // atribuição: veio de uma automação
}

// Ponte tenant TEXTO → UUID: zernio_conversations.account_id é 'default-account',
// mas leads.account_id é UUID. Hoje só IA Club; multi-conta real mapeia por tenant depois.
async function resolveLeadAccountId(_textTenant?: string | null): Promise<string> {
  return getContentAccountId();
}

/**
 * Cria ou atualiza um lead a partir de uma conversa, com dedupe por @username + conta.
 * Registra crm_eventos (lead↔conversa) e attribution_events quando há criação ou origem.
 * Retorna { leadId, created } ou null se não deu pra identificar a pessoa.
 */
export async function upsertLeadFromConversation(
  conv: ConversationLike,
  opts: UpsertLeadOptions = {},
): Promise<{ leadId: number; created: boolean } | null> {
  if (!supabase) return null;
  const username = (conv.participant_username || '').trim();
  if (!username) return null; // sem @ não há chave de dedupe confiável

  const accountId = await resolveLeadAccountId(conv.account_id);
  const nome = (conv.participant_name || username).trim();
  const origem = opts.origem || conv.origem || 'direct';
  const agora = new Date().toISOString();

  // dedupe: mesma pessoa (@) na mesma conta = um lead só
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('account_id', accountId)
    .eq('instagram', username)
    .maybeSingle();

  let leadId: number;
  let created = false;

  const avatar = conv.participant_picture_url || null;
  if (existing) {
    leadId = (existing as { id: number }).id;
    await supabase
      .from('leads')
      .update({
        nome,
        atualizado_em: agora,
        ultimo_contato: agora,
        ...(avatar ? { avatar_url: avatar } : {}),
        ...(conv.id ? { zernio_conversa_id: conv.id } : {}),
      })
      .eq('id', leadId);
  } else {
    const { data: novo, error } = await supabase
      .from('leads')
      .insert({
        account_id: accountId,
        nome,
        instagram: username,
        telefone: '',
        origem,
        interesse: '',
        score: 0,
        status: 'novo',
        resultado: '',
        avatar_url: avatar,
        primeiro_contato: agora,
        ultimo_contato: agora,
        zernio_conversa_id: conv.id ?? null,
        historico: conv.last_message ? [{ tipo: 'conversa', texto: conv.last_message, em: agora }] : [],
      })
      .select('id')
      .single();
    if (error || !novo) return null;
    leadId = (novo as { id: number }).id;
    created = true;
  }

  // Só registra evento/atribuição quando há novidade real (criação ou origem de automação),
  // pra não poluir o log a cada re-sync da mesma conversa.
  const temFonte = created || opts.funnelId != null || opts.automationId != null;
  if (temFonte) {
    await supabase.from('crm_eventos').insert({
      tipo: created ? 'lead_criado' : 'lead_engajado',
      canal: 'instagram',
      origem,
      lead_id: leadId,
      conversa_id: conv.id ?? null,
      ator: 'sistema',
      payload: { via: opts.funnelId != null ? 'automacao' : 'conversa', last_message: conv.last_message || null },
    });
    await supabase.from('attribution_events').insert({
      lead_id: leadId,
      funnel_id: opts.funnelId ?? null,
      automation_id: opts.automationId ?? null,
      hora: agora,
    });
  }

  return { leadId, created };
}

const ESTAGIO_SCORE: Record<string, number> = { frio: 5, novo: 15, qualificado: 55, quente: 85 };

/**
 * ENRIQUECE o perfil do lead lendo as mensagens da conversa no Direct (o "agente
 * captando e abastecendo o perfil"): resumo, interesses, intenção, estágio, sinais.
 * Guarda em leads.perfil (jsonb) + total_mensagens + interesse + score. Não envia nada.
 */
export async function enrichLeadProfile(leadId: number, conversaId: number): Promise<boolean> {
  if (!supabase) return false;
  const { data: msgs } = await supabase
    .from('zernio_messages')
    .select('content, direcao')
    .eq('conversation_id', conversaId)
    .order('id', { ascending: true })
    .limit(40);
  if (!msgs || msgs.length === 0) return false;

  const total = msgs.length;
  const transcript = msgs
    .map((m: { content?: string | null; direcao?: string | null }) => `${m.direcao === 'in' ? 'Lead' : 'Nós'}: ${(m.content || '').slice(0, 300)}`)
    .join('\n')
    .slice(0, 3000);

  let perfil: Record<string, unknown> = {};
  const resp = await cerebro(
    [
      { role: 'system', content: 'Você lê uma conversa de Instagram Direct e devolve SOMENTE um JSON com o perfil do lead, sem texto fora do JSON.' },
      { role: 'user', content: `Conversa (Lead = a pessoa, Nós = a marca):\n${transcript}\n\nDevolva exatamente:\n{"resumo":"1-2 frases de quem é e o que quer","interesses":["tema"],"intencao":"curiosidade|duvida|quer_comprar|suporte|parceria|outro","estagio":"novo|qualificado|quente|frio","sinais":["fato concreto dito pela pessoa"]}` },
    ],
    900,
    0.5,
  ).catch(() => ({ success: false, content: '' }));

  if (resp?.success && resp.content) {
    try {
      const m = resp.content.match(/\{[\s\S]*\}/);
      if (m) perfil = JSON.parse(m[0]);
    } catch {
      /* mantém perfil vazio se não parsear */
    }
  }
  perfil.atualizado_em = new Date().toISOString();

  const patch: Record<string, unknown> = { perfil, total_mensagens: total };
  if (typeof perfil.resumo === 'string' && perfil.resumo) patch.interesse = String(perfil.resumo).slice(0, 200);
  const estagio = typeof perfil.estagio === 'string' ? perfil.estagio : '';
  if (ESTAGIO_SCORE[estagio] != null) patch.score = ESTAGIO_SCORE[estagio];

  await supabase.from('leads').update(patch).eq('id', leadId);
  return true;
}

/**
 * Enriquece em lote os leads que têm conversa vinculada (backfill / cron). A IA é
 * lenta (grátis), então processa poucos por vez. Retorna quantos enriqueceu.
 */
export async function enrichPendingLeads(limit = 10): Promise<{ enriquecidos: number }> {
  if (!supabase) return { enriquecidos: 0 };
  const { data: leads } = await supabase
    .from('leads')
    .select('id, zernio_conversa_id')
    .not('zernio_conversa_id', 'is', null)
    .order('ultimo_contato', { ascending: false })
    .limit(limit);
  let enriquecidos = 0;
  for (const l of leads || []) {
    const ok = await enrichLeadProfile((l as { id: number }).id, (l as { zernio_conversa_id: number }).zernio_conversa_id);
    if (ok) enriquecidos++;
  }
  return { enriquecidos };
}

/**
 * Backfill: roda a espinha sobre as conversas JÁ existentes (as que entraram antes
 * do pipeline existir). Popula o CRM de imediato. Seguro/idempotente.
 */
export async function backfillLeadsFromConversations(limit = 500): Promise<{ criados: number; total: number }> {
  if (!supabase) return { criados: 0, total: 0 };
  const { data: convs } = await supabase
    .from('zernio_conversations')
    .select('id, participant_username, participant_name, participant_picture_url, last_message, origem, account_id')
    .order('updated_time', { ascending: false })
    .limit(limit);
  let criados = 0;
  const lista = convs || [];
  for (const c of lista) {
    const r = await upsertLeadFromConversation(c as ConversationLike);
    if (r?.created) criados++;
  }
  return { criados, total: lista.length };
}
