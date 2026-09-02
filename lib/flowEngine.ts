import { supabase, dbQuery } from './db';
import { canSendFollowReminder } from './variables';

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
  delay_seconds?: number;
  media_url?: string;
  media_type?: string;
  tag_to_apply?: string;
  x?: number;
  y?: number;
}

export interface Flow {
  id: number;
  nome: string;
  descricao: string;
  trigger_type: string;
  trigger_value: string;
  match_mode: string;
  steps: FlowStep[];
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

  let currentStepIndex = run.current_step;
  let newRun = { ...run };
  let isRunning = true;

  while (isRunning && currentStepIndex < flow.steps.length) {
    const step = flow.steps[currentStepIndex];
    const stepLog = { step: step.id, type: step.type, timestamp: new Date().toISOString() };

    // Log da jornada
    if (!context._journey) context._journey = [];
    context._journey.push(stepLog);

    switch (step.type) {
      case 'text':
        // Interpola variáveis {{nome}} etc
        const interpolatedText = interpolate(step.content || '', context);
        actions.push({
          type: 'send_message',
          text: interpolatedText,
          is_private: false,
        });
        currentStepIndex++;
        break;

      case 'quick_replies':
        // Para, aguarda resposta (status = waiting)
        actions.push({
          type: 'send_message',
          text: step.content || '',
          quick_replies: step.buttons || [],
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
        currentStepIndex++;
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

      case 'condition':
        // Verifica se a condição é verdadeira baseado no context
        const conditionMet = checkCondition(context, step);
        const nextStepId = conditionMet ? step.yes_target : step.no_target;
        const nextIdx = flow.steps.findIndex(s => s.id === nextStepId);
        if (nextIdx !== -1) {
          currentStepIndex = nextIdx;
        } else {
          currentStepIndex++;
        }
        break;

      case 'wait':
        actions.push({
          type: 'wait',
          delay_seconds: step.delay_seconds || 5,
        });
        currentStepIndex++;
        break;

      case 'notify_admin':
        // HANDOFF: passa pro agente mas não ativa (agente OFF)
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
        // Start é um nó inicializador, apenas avança
        currentStepIndex++;
        break;

      case 'follow_gate':
        // Portão de seguidor com degradação graciosa (null = libera, max 5 lembretes/dia)
        const followsAccount = context._follows_account;

        if (followsAccount === null || followsAccount === undefined) {
          // Meta não informou segue? status: Libera e registra
          console.log('ℹ️ Follow status null, liberando (degradação graciosa):', newRun.id);

          // Log em Atividade
          await supabase
            .from('crm_eventos')
            .insert({
              tipo: 'flow_follow_gate_degraded',
              payload: {
                run_id: newRun.id,
                reason: 'Meta did not return follow status',
                fallback: 'allowed',
              },
              created_at: new Date(),
            })
            .catch((err: any) => console.warn('⚠️ Erro ao registrar evento de degradação:', err));

          // Avança sem parar
          currentStepIndex++;
          break;
        }

        // Se segue? Avança; senão, oferece reminder
        if (followsAccount === true) {
          currentStepIndex++;
        } else if (followsAccount === false) {
          // Não segue: oferece reminder (máx 5/dia)
          const contactId = context._contact_id || '';
          if (contactId && canSendFollowReminder(contactId)) {
            actions.push({
              type: 'send_message',
              text: step.content || 'Siga-nos para continuar',
              quick_replies: step.buttons || [],
              is_private: true,
            });
            newRun.status = 'waiting';
            newRun.current_step = currentStepIndex;
            isRunning = false;
          } else {
            // Limite de lembretes atingido: salta para o próximo passo
            console.log('⏭️ Limite de lembretes de follow atingido, continuando:', contactId);
            currentStepIndex++;
          }
        } else {
          // Status desconhecido (booleano inválido): libera com cautela
          currentStepIndex++;
        }
        break;

      case 'tag':
        // Aplica etiqueta ao lead
        actions.push({
          type: 'apply_tag',
          tag: step.tag_to_apply || '',
        });
        currentStepIndex++;
        break;

      default:
        currentStepIndex++;
    }
  }

  // Se saiu do loop sem pausar, marca como completed
  if (isRunning || currentStepIndex >= flow.steps.length) {
    newRun.status = 'completed';
  }

  newRun.current_step = currentStepIndex;
  newRun.context = context;
  newRun.atualizado_em = new Date().toISOString();

  // Salva o run no banco
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

  const currentStep = flow.steps[run.current_step];
  if (!currentStep) return null;

  // Registra o botão clicado no context
  if (!run.context) run.context = { _journey: [] };
  run.context.last_button_clicked = buttonValue;
  run.context.button_step = run.current_step;

  // Avança para o próximo passo
  run.current_step += 1;
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
  // Verifica se última resposta atende a condição
  if (step.id && context.last_button_clicked) {
    return !!context.last_button_clicked;
  }
  return false;
}

export async function listFlows(enabled?: boolean): Promise<Flow[]> {
  let query = supabase.from('flows').select('*').order('priority', { ascending: false });

  if (enabled !== undefined) {
    query = query.eq('enabled', enabled);
  }

  const { data } = await dbQuery(() => query);
  return (data as Flow[]) || [];
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
