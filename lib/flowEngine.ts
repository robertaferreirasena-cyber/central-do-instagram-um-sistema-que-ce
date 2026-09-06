import { supabase, dbQuery } from './db';
import { canSendFollowReminder } from './variables';
import { isValidEmail, extractEmail } from './utils';
import { enqueue } from './sendQueue';

export interface FlowStep {
  id: string;
  type: 'text' | 'quick_replies' | 'media' | 'condition' | 'collect_data' | 'wait' | 'notify_admin' | 'end_flow' | 'follow_gate' | 'tag' | 'start';
  content?: string;
  buttons?: { label: string; postback?: string; url?: string }[];
  field_name?: string;
  field_label?: string;
  yes_step?: string;
  no_step?: string;
  yes_target?: string;
  no_target?: string;
  condition_field?: string;
  condition_equals?: string;
  delay_seconds?: number;
  media_url?: string;
  media_type?: string;
  tag_to_apply?: string;
  x?: number;
  y?: number;
}

export interface FlowEdge {
  from: string;
  handle: string;
  to: string;
}

export interface Flow {
  id: number;
  nome: string;
  descricao: string;
  trigger_type: string;
  trigger_value: string;
  match_mode: string;
  steps: FlowStep[];
  edges?: FlowEdge[];
  post_ig_id: string;
  priority: number;
  enabled: boolean;
  cooldown_minutes: number;
  criado_em: string;
  atualizado_em: string;
}

export interface FlowRun {
  id: number;
  flow_id: number;
  ig_user_id: string;
  conversation_id: string;
  current_step: number;
  context: Record<string, any>;
  status: 'running' | 'waiting' | 'completed';
  criado_em: string;
  atualizado_em: string;
}

export async function getFlow(flowId: number): Promise<Flow | null> {
  const { data, error } = await dbQuery(() =>
    supabase.from('flows').select('*').eq('id', flowId).single()
  );
  return (data as Flow) || null;
}

export async function getFlowRun(runId: number): Promise<FlowRun | null> {
  const { data, error } = await dbQuery(() =>
    supabase.from('flow_runs').select('*').eq('id', runId).single()
  );
  return (data as FlowRun) || null;
}

export async function getOrCreateFlowRun(
  flowId: number,
  igUserId: string,
  conversationId: string
): Promise<FlowRun | null> {
  // Verifica se já existe um run ativo para este usuário neste fluxo
  const { data: existing } = await dbQuery(() =>
    supabase
      .from('flow_runs')
      .select('*')
      .eq('flow_id', flowId)
      .eq('ig_user_id', igUserId)
      .in('status', ['running', 'waiting'])
      .limit(1)
      .single()
  );

  if (existing) {
    return (existing as FlowRun) || null;
  }

  // Cria novo run
  const { data: newRun } = await dbQuery(() =>
    supabase
      .from('flow_runs')
      .insert([
        {
          flow_id: flowId,
          ig_user_id: igUserId,
          conversation_id: conversationId,
          current_step: 0,
          context: { _journey: [] },
          status: 'running',
        },
      ])
      .select()
      .single()
  );

  return (newRun as FlowRun) || null;
}

function proximoNo(edges: FlowEdge[] | undefined, fromId: string, handle: string = 'next'): string | null {
  if (!edges || edges.length === 0) return null;
  const edge = edges.find(e => e.from === fromId && e.handle === handle);
  return edge ? edge.to : null;
}

function findStepIndexById(steps: FlowStep[], stepId: string): number {
  return steps.findIndex(s => s.id === stepId);
}

export async function executeRun(run: FlowRun, flow: Flow): Promise<{
  run: FlowRun;
  actions: any[];
  nextStep?: FlowStep;
}> {
  const actions: any[] = [];
  const context = run.context || { _journey: [] };

  if (!flow.steps || flow.steps.length === 0) {
    return { run, actions };
  }

  // Detecta se o fluxo usa edges (DirectPro) ou índice (U1)
  const hasEdges = flow.edges && flow.edges.length > 0;

  let currentStepIndex = run.current_step;
  let newRun = { ...run };
  let isRunning = true;
  let stepsExecuted = 0;
  const maxSteps = 1000;

  while (isRunning && stepsExecuted < maxSteps && currentStepIndex < flow.steps.length) {
    stepsExecuted++;

    const step = flow.steps[currentStepIndex];
    const stepLog = { step: step.id, type: step.type, timestamp: new Date().toISOString() };

    if (!context._journey) context._journey = [];
    context._journey.push(stepLog);

    let nextStepIndex: number | null = null;

    switch (step.type) {
      case 'text':
        const interpolatedText = interpolate(step.content || '', context);
        actions.push({
          type: 'send_message',
          text: interpolatedText,
          is_private: false,
        });
        nextStepIndex = hasEdges ? -1 : currentStepIndex + 1;
        break;

      case 'quick_replies':
        actions.push({
          type: 'send_message',
          text: step.content || '',
          quick_replies: (step.buttons || []).map((btn, i) => ({
            label: btn.label,
            postback: hasEdges ? `FLOW:${flow.id}:${step.id}:${i}` : btn.label,
          })),
          is_private: true,
        });
        newRun.status = 'waiting';
        newRun.current_step = currentStepIndex;
        isRunning = false;
        break;

      case 'media':
        actions.push({
          type: 'send_media',
          media_url: step.media_url,
          media_type: step.media_type || 'image',
          caption: step.content,
        });
        nextStepIndex = hasEdges ? -1 : currentStepIndex + 1;
        break;

      case 'collect_data':
        actions.push({
          type: 'send_message',
          text: step.field_label || step.content || '',
          is_private: true,
        });
        context[step.field_name || 'field_' + currentStepIndex] = null;
        newRun.status = 'waiting';
        newRun.current_step = currentStepIndex;
        isRunning = false;
        break;

      case 'condition': {
        const conditionMet = checkCondition(context, step);
        if (hasEdges) {
          // Condições ramificam pelos handles 'yes'/'no' (não 'next') — senão o fluxo
          // encerrava na condição e os ramos SIM/NÃO nunca rodavam.
          const handle = conditionMet ? 'yes' : 'no';
          const nextStepId = proximoNo(flow.edges, step.id, handle) || proximoNo(flow.edges, step.id, 'next');
          currentStepIndex = nextStepId ? findStepIndexById(flow.steps, nextStepId) : flow.steps.length;
          if (currentStepIndex === -1) {
            newRun.status = 'completed';
            isRunning = false;
          }
          continue; // já resolveu o próximo passo; pula o resolvedor genérico de 'next'
        }
        const targetStepId = conditionMet ? step.yes_target : step.no_target;
        const targetIdx = flow.steps.findIndex(s => s.id === targetStepId);
        nextStepIndex = targetIdx !== -1 ? targetIdx : currentStepIndex + 1;
        break;
      }

      case 'wait':
        actions.push({
          type: 'wait',
          delay_seconds: step.delay_seconds || 5,
        });
        nextStepIndex = hasEdges ? -1 : currentStepIndex + 1;
        break;

      case 'notify_admin':
        actions.push({
          type: 'notify_admin',
          message: 'Fluxo atingiu handoff',
          context_rich: {
            journey: context._journey,
            fields: Object.keys(context).filter(k => !k.startsWith('_')),
            duration_seconds: Math.round((Date.now() - new Date(run.criado_em).getTime()) / 1000),
          },
        });
        newRun.status = 'completed';
        isRunning = false;
        break;

      case 'end_flow':
        newRun.status = 'completed';
        isRunning = false;
        break;

      case 'start':
        nextStepIndex = hasEdges ? -1 : currentStepIndex + 1;
        break;

      case 'follow_gate':
        const followsAccount = context._follows_account;

        if (followsAccount === null || followsAccount === undefined) {
          console.log('ℹ️ Follow status null, liberando (degradação graciosa):', newRun.id);

          // O builder do Supabase não é uma Promise com .catch — usar try/catch.
          try {
            await supabase.from('crm_eventos').insert({
              tipo: 'flow_follow_gate_degraded',
              payload: {
                run_id: newRun.id,
                reason: 'Meta did not return follow status',
                fallback: 'allowed',
              },
              criado_em: new Date().toISOString(),
            });
          } catch (err) {
            console.warn('⚠️ Erro ao registrar evento de degradação:', err);
          }

          nextStepIndex = hasEdges ? -1 : currentStepIndex + 1;
          break;
        }

        if (followsAccount === true) {
          nextStepIndex = hasEdges ? -1 : currentStepIndex + 1;
        } else if (followsAccount === false) {
          const contactId = context._contact_id || '';
          if (contactId && canSendFollowReminder(contactId)) {
            actions.push({
              type: 'send_message',
              text: step.content || 'Siga-nos para continuar',
              quick_replies: [{
                label: step.buttons?.[0]?.label || 'Confirmar',
                postback: hasEdges ? `FLOWGATE:${flow.id}:${step.id}` : 'confirmed'
              }],
              is_private: true,
            });
            newRun.status = 'waiting';
            newRun.current_step = currentStepIndex;
            isRunning = false;
          } else {
            console.log('⏭️ Limite de lembretes de follow atingido, continuando:', contactId);
            nextStepIndex = hasEdges ? -1 : currentStepIndex + 1;
          }
        } else {
          nextStepIndex = hasEdges ? -1 : currentStepIndex + 1;
        }
        break;

      case 'tag':
        actions.push({
          type: 'apply_tag',
          tag: step.tag_to_apply || '',
        });
        nextStepIndex = hasEdges ? -1 : currentStepIndex + 1;
        break;

      default:
        nextStepIndex = hasEdges ? -1 : currentStepIndex + 1;
    }

    // Se usa edges e chegou em -1, resol ve por edge
    if (hasEdges && nextStepIndex === -1) {
      const nextStepId = proximoNo(flow.edges, step.id, 'next');
      currentStepIndex = nextStepId ? findStepIndexById(flow.steps, nextStepId) : flow.steps.length;
      if (currentStepIndex === -1) {
        newRun.status = 'completed';
        isRunning = false;
      }
    } else {
      currentStepIndex = nextStepIndex ?? flow.steps.length;
    }
  }

  if (isRunning) {
    newRun.status = 'completed';
  }

  newRun.current_step = currentStepIndex;
  newRun.context = context;
  newRun.atualizado_em = new Date().toISOString();

  await dbQuery(() =>
    supabase
      .from('flow_runs')
      .update(newRun)
      .eq('id', newRun.id)
  );

  return {
    run: newRun,
    actions,
    nextStep: currentStepIndex < flow.steps.length ? flow.steps[currentStepIndex] : undefined,
  };
}

export async function resumeFlowFromButton(
  runId: number,
  buttonIndex: number,
  buttonValue: string
): Promise<{ run: FlowRun; actions: any[] } | null> {
  const run = await getFlowRun(runId);
  if (!run) return null;

  const flow = await getFlow(run.flow_id);
  if (!flow) return null;

  if (!run.context) run.context = { _journey: [] };

  // D4: Parse FLOW:{flowId}:{stepId}:{buttonIndex} ou FLOWGATE:{flowId}:{stepId}
  let targetStepId: string | null = null;
  let buttonHandle: string | null = null;

  if (buttonValue.startsWith('FLOW:')) {
    const parts = buttonValue.split(':');
    if (parts.length === 4) {
      const [, parsedFlowId, parsedStepId, parsedBtnIdx] = parts;
      if (parseInt(parsedFlowId) === flow.id) {
        targetStepId = parsedStepId;
        buttonHandle = `btn:${parsedBtnIdx}`;
      }
    }
  } else if (buttonValue.startsWith('FLOWGATE:')) {
    const parts = buttonValue.split(':');
    if (parts.length === 3) {
      const [, parsedFlowId, parsedStepId] = parts;
      if (parseInt(parsedFlowId) === flow.id) {
        // Reconfere o portão no MESMO step (não avança)
        targetStepId = parsedStepId;
        buttonHandle = null; // Stay on same step to recheck gate
      }
    }
  } else {
    // Fallback: tratamento de legado (buttonValue simples)
    const currentStep = flow.steps[run.current_step];
    if (!currentStep) return null;

    if (currentStep.type === 'collect_data' && currentStep.field_name === 'email') {
      const email = extractEmail(buttonValue);
      if (!email || !isValidEmail(email)) {
        const retryCount = (run.context._email_retry_count || 0);
        if (retryCount < 1) {
          run.context._email_retry_count = retryCount + 1;
          run.status = 'waiting';
          await dbQuery(() =>
            supabase
              .from('flow_runs')
              .update({ context: run.context, atualizado_em: new Date().toISOString() })
              .eq('id', run.id)
          );
          return {
            run,
            actions: [
              {
                type: 'send_message',
                text: 'Acho que esse e-mail saiu errado, me manda só o e-mail',
                is_private: true,
              },
            ],
          };
        }
      }
      if (email) {
        run.context[currentStep.field_name] = email;
        // CRM: grava o e-mail coletado no lead (+ auditoria). Não bloqueia o fluxo.
        await persistCollectedLeadData(run, { [currentStep.field_name]: email }).catch((e) =>
          console.warn('⚠️ persistCollectedLeadData (email) falhou:', e)
        );
      }
      // Segue por 'next' handle
      targetStepId = proximoNo(flow.edges, currentStep.id, 'next');
    } else if (currentStep.type === 'collect_data' && currentStep.field_name) {
      run.context[currentStep.field_name] = buttonValue;
      // CRM: grava o dado coletado (nome/telefone/etc.) no lead (+ auditoria).
      await persistCollectedLeadData(run, { [currentStep.field_name]: buttonValue }).catch((e) =>
        console.warn('⚠️ persistCollectedLeadData falhou:', e)
      );
      targetStepId = proximoNo(flow.edges, currentStep.id, 'next');
    } else {
      // Fallback para compatibilidade: simplesmente avança de índice
      run.current_step += 1;
      run.status = 'running';
      return executeRun(run, flow);
    }
  }

  // D3/D4: Se temos um handle (btn:X), segue a edge correspondente
  if (buttonHandle && targetStepId) {
    const nextId = proximoNo(flow.edges, targetStepId, buttonHandle);
    if (nextId) {
      targetStepId = nextId;
    }
  }

  // Atualiza o step atual para o destino
  if (targetStepId) {
    const targetIdx = findStepIndexById(flow.steps, targetStepId);
    if (targetIdx !== -1) {
      run.current_step = targetIdx;
    }
  }

  run.context.last_button_clicked = buttonValue;
  run.context.button_step = run.current_step;
  run.status = 'running';

  // Re-executa o fluxo
  return executeRun(run, flow);
}

function interpolate(text: string, context: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return context[key] || '';
  });
}

function checkCondition(context: Record<string, any>, step: FlowStep): boolean {
  // Compara o valor esperado (condition_equals) com o que o cliente clicou/respondeu.
  // Ex.: botão "Sim!" tem postback 'yes' e a condição espera condition_equals='yes'.
  const clicado = context.last_button_clicked;
  if (step.condition_equals !== undefined && step.condition_equals !== '') {
    return String(clicado) === String(step.condition_equals);
  }
  // Sem valor esperado: qualquer clique satisfaz (comportamento antigo, como fallback).
  return !!clicado;
}

// ============================================================================
// CRM — grava os dados coletados (collect_data) no LEAD correspondente.
// O collect_data só guardava a resposta em flow_runs.context[field_name]; sem este
// elo o dado morria no run e NUNCA chegava ao CRM. Aqui resolvemos o lead pelo
// conversation_id do run (→ zernio_conversations.zernio_conversa → id numérico →
// leads.zernio_conversa_id) ou pelo @ do participante, e gravamos usando SÓ colunas
// que existem: nome→leads.nome, telefone→leads.telefone, e todo o resto (email etc.)
// dentro de leads.perfil (jsonb). SEMPRE registra um crm_eventos de auditoria, mesmo
// quando o lead ainda não existe — assim o dado coletado nunca se perde.
export async function persistCollectedLeadData(
  run: FlowRun,
  collected: Record<string, any>,
): Promise<{ leadId: number | null; persisted: boolean }> {
  if (!supabase) return { leadId: null, persisted: false };

  // Só campos "de verdade" (ignora chaves internas _journey/_follows_account/etc.).
  const campos: Record<string, string> = {};
  for (const [k, v] of Object.entries(collected || {})) {
    if (!k || k.startsWith('_')) continue;
    if (v == null) continue;
    const s = String(v).trim();
    if (s === '') continue;
    campos[k] = s;
  }
  if (Object.keys(campos).length === 0) return { leadId: null, persisted: false };

  // 1. Resolve a conversa interna (numérica) + @ do participante pelo id externo do run.
  let conversaId: number | null = null;
  let username: string | null = null;
  const { data: conv } = await dbQuery(() =>
    supabase
      .from('zernio_conversations')
      .select('id, participant_username')
      .eq('zernio_conversa', run.conversation_id)
      .maybeSingle()
  );
  if (conv) {
    conversaId = (conv as any).id ?? null;
    username = (conv as any).participant_username ?? null;
  }

  // 2. Localiza o lead: primeiro pela conversa vinculada, senão pelo @ (instagram).
  let leadId: number | null = null;
  let perfilAtual: Record<string, unknown> = {};
  let leadRow: any = null;
  if (conversaId != null) {
    const { data } = await dbQuery(() =>
      supabase.from('leads').select('id, nome, telefone, perfil').eq('zernio_conversa_id', conversaId).maybeSingle()
    );
    leadRow = data;
  }
  if (!leadRow && username) {
    const { data } = await dbQuery(() =>
      supabase.from('leads').select('id, nome, telefone, perfil').eq('instagram', username).maybeSingle()
    );
    leadRow = data;
  }
  if (leadRow) {
    leadId = (leadRow as any).id ?? null;
    const p = (leadRow as any).perfil;
    perfilAtual = p && typeof p === 'object' ? p : {};
  }

  // 3. Atualiza o lead (colunas existentes): nome/telefone diretos, resto no perfil jsonb.
  if (leadId != null) {
    const alvo = leadId;
    const patch: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
    if (campos.nome) patch.nome = campos.nome.slice(0, 200);
    if (campos.telefone) patch.telefone = campos.telefone.slice(0, 40);
    patch.perfil = { ...perfilAtual, ...campos, dados_coletados_em: new Date().toISOString() };
    await dbQuery(() =>
      supabase.from('leads').update(patch).eq('id', alvo).select('id')
    );
  }

  // 4. Auditoria: o dado coletado FICA REGISTRADO mesmo sem lead resolvido.
  await dbQuery(() =>
    supabase.from('crm_eventos').insert({
      tipo: 'lead_dados_coletados',
      canal: 'instagram',
      origem: 'automacao',
      lead_id: leadId,
      conversa_id: conversaId,
      ator: 'flow',
      payload: { flow_id: run.flow_id, run_id: run.id, ig_user_id: run.ig_user_id, campos },
    }).select('id')
  );

  return { leadId, persisted: leadId != null };
}

export async function listFlows(enabled?: boolean): Promise<Flow[]> {
  let query = supabase.from('flows').select('*').order('priority', { ascending: false });

  if (enabled !== undefined) {
    query = query.eq('enabled', enabled);
  }

  const { data } = await dbQuery(() => query);
  return (data as Flow[]) || [];
}

// C4: Buscar fluxos que casam com trigger, keyword e opcionalmente media_id
export async function matchFlows(
  triggerType: string,
  keyword: string,
  mediaId?: string
): Promise<Flow[]> {
  if (!supabase) return [];

  try {
    // Buscar fluxos ativos
    const { data: flows, error } = await dbQuery(() =>
      supabase
        .from('flows')
        .select('*')
        .eq('enabled', true)
        .eq('trigger_type', triggerType)
        .order('priority', { ascending: false })
    );

    if (error || !flows) return [];

    // Importar normalizeText aqui (para evitar circular imports)
    const { normalizeText } = await import('./utils');
    const normalizedKeyword = normalizeText(keyword);

    // Filtrar por palavra-chave e media_id
    const matched = (flows as Flow[]).filter((flow) => {
      // Se fluxo está amarrado a um post específico, comparar media_id
      if (flow.post_ig_id && flow.post_ig_id !== mediaId) {
        return false;
      }

      // Se não tem keyword, casou (qualquer acionamento vale)
      if (!flow.trigger_value || flow.trigger_value.trim() === '') {
        return true;
      }

      // Comparar keyword(s) usando normalizeText e match_mode
      const keywords = flow.trigger_value
        .split(',')
        .map((k) => normalizeText(k))
        .filter((k) => k);

      // Normaliza o vocabulário: a UI/templates/DirectPro gravam em INGLÊS
      // ('contains'/'exact'/'begins'), a engine falava só PORTUGUÊS → nenhum funil
      // com palavra-chave casava. Aceita os dois.
      const raw = (flow.match_mode || 'contem').toLowerCase();
      const matchMode =
        raw === 'exact' || raw === 'exata' ? 'exata' :
        raw === 'begins' || raw === 'starts' || raw === 'comeca' || raw === 'começa' ? 'comeca' :
        'contem'; // 'contains'/'contem'/qualquer outro = contém

      for (const kw of keywords) {
        if (matchMode === 'exata' && normalizedKeyword === kw) {
          return true;
        }
        if (matchMode === 'comeca' && normalizedKeyword.startsWith(kw)) {
          return true;
        }
        if (matchMode === 'contem' && normalizedKeyword.includes(kw)) {
          return true;
        }
      }

      return false;
    });

    return matched;
  } catch (err) {
    console.error('Erro em matchFlows:', err);
    return [];
  }
}

export async function createFlow(flowData: Partial<Flow>): Promise<Flow | null> {
  const { data } = await dbQuery(() =>
    supabase.from('flows').insert([flowData]).select().single()
  );
  return (data as Flow) || null;
}

export async function updateFlow(flowId: number, updates: Partial<Flow>): Promise<Flow | null> {
  const { data } = await dbQuery(() =>
    supabase
      .from('flows')
      .update({ ...updates, atualizado_em: new Date().toISOString() })
      .eq('id', flowId)
      .select()
      .single()
  );
  return (data as Flow) || null;
}

export async function deleteFlow(flowId: number): Promise<boolean> {
  const { error } = await dbQuery(() =>
    supabase.from('flows').delete().eq('id', flowId)
  );
  return !error;
}

// ============================================================================
// DISPATCH — o elo que faltava: transforma as ACTIONS do executeRun em envios
// REAIS, enfileirando na send_queue (que drena via Zernio, com gate). Alinhado ao
// DirectPro: comentário → private_reply (fura a janela 24h, 1×) + comment_reply
// (público); DM/story e passos seguintes → dm. 'wait' vira not_before do próximo.
// NÃO envia nada por si — só enfileira; o envio real depende do drain (travado).
// ============================================================================

interface FlowActionLike {
  type: string;
  text?: string;
  caption?: string;
  media_url?: string;
  media_type?: string;
  is_private?: boolean;
  delay_seconds?: number;
  quick_replies?: Array<{ label: string; postback?: string }>;
}

export interface DispatchContext {
  accountId: string; // conta que envia (zernio account_id)
  triggerType: 'comment' | 'story_reply' | 'dm';
  commentId?: string;
  conversationId?: string;
  contactId?: string;
  flowId: number;
  runId: number;
}

// Fecha o loop ManyChat: quando chega uma DM de alguém que tem um fluxo EM ESPERA,
// tenta casar o texto com um botão do menu (ou responder um collect_data) e RETOMA
// o fluxo — a próxima mensagem/DM (ex.: o link) é enfileirada. Retorna resumed=false
// se não há fluxo em espera ou o texto não casa (aí o webhook segue o fluxo normal).
export async function tryResumeFlow(ctx: {
  accountId: string;
  contactId: string;
  conversationId?: string;
  messageText: string;
}): Promise<{ resumed: boolean; enqueued?: number }> {
  if (!supabase || !ctx.contactId) return { resumed: false };
  const { data: run } = await dbQuery(() =>
    supabase
      .from('flow_runs')
      .select('*')
      .eq('ig_user_id', ctx.contactId)
      .eq('status', 'waiting')
      .order('id', { ascending: false })
      .limit(1)
      .single()
  );
  if (!run) return { resumed: false };
  const r = run as FlowRun;
  const flow = await getFlow(r.flow_id);
  if (!flow) return { resumed: false };
  const step = flow.steps[r.current_step];
  if (!step) return { resumed: false };

  const texto = (ctx.messageText || '').trim();
  const txtLow = texto.toLowerCase();
  let buttonIndex = 0;
  let buttonValue: string;

  if (step.type === 'quick_replies' && step.buttons?.length) {
    const idx = step.buttons.findIndex((b) => {
      const lbl = (b.label || '').trim().toLowerCase();
      return !!lbl && (txtLow === lbl || txtLow.includes(lbl) || lbl.includes(txtLow));
    });
    if (idx < 0) return { resumed: false }; // não casou nenhum botão → não é resposta ao menu
    buttonIndex = idx;
    buttonValue = `FLOW:${flow.id}:${step.id}:${idx}`;
  } else {
    buttonValue = texto; // collect_data / resposta livre
  }

  const result = await resumeFlowFromButton(r.id, buttonIndex, buttonValue);
  if (!result) return { resumed: false };
  const enqueued = await dispatchFlowActions(result.actions, {
    accountId: ctx.accountId,
    triggerType: 'dm',
    conversationId: ctx.conversationId,
    contactId: ctx.contactId,
    flowId: flow.id,
    runId: r.id,
  });
  return { resumed: true, enqueued };
}

export async function dispatchFlowActions(actions: FlowActionLike[], ctx: DispatchContext): Promise<number> {
  let enqueued = 0;
  let delayMs = 0;
  let usouPrivadaDoComentario = false;

  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    if (a.type === 'wait') {
      delayMs += (a.delay_seconds || 0) * 1000;
      continue;
    }
    if (a.type !== 'send_message' && a.type !== 'send_media') continue; // notify_admin etc. são internos

    // Zernio não tem botão rico: anexa os quick_replies como linhas no texto.
    const base = a.text || a.caption || '';
    const botoes = (a.quick_replies || []).map((q) => `▸ ${q.label}`).join('\n');
    const message = botoes ? `${base}\n\n${botoes}`.trim() : base;

    let kind: 'dm' | 'comment_reply' | 'private_reply';
    if (ctx.triggerType === 'comment' && a.is_private && !usouPrivadaDoComentario) {
      kind = 'private_reply'; // fura a janela de 24h, 1× por comentário
      usouPrivadaDoComentario = true;
    } else if (!a.is_private && ctx.commentId) {
      kind = 'comment_reply'; // resposta pública no comentário
    } else {
      kind = 'dm'; // dentro da janela de 24h
    }

    const ok = await enqueue({
      account_id: ctx.accountId,
      kind,
      contact_id: ctx.contactId,
      conversation_id: ctx.conversationId,
      comment_id: ctx.commentId,
      message,
      media_url: a.type === 'send_media' ? a.media_url : undefined,
      media_type: a.type === 'send_media' ? a.media_type : undefined,
      dedupe_key: `flow:${ctx.flowId}:${ctx.runId}:${i}:${ctx.commentId || ctx.conversationId || ctx.contactId || 'x'}`,
      not_before: delayMs > 0 ? new Date(Date.now() + delayMs) : undefined,
    });
    if (ok) enqueued++;
  }
  return enqueued;
}
