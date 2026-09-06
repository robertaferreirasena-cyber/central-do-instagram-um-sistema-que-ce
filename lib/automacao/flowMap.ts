import { AutomacaoFlow, AutomacaoBlock } from './types';
import { Flow, FlowStep, FlowEdge } from '../flowEngine';

// Gera as EDGES (ligações) que a engine usa pra ramificar — a lógica do ManyChat:
// - bloco com BOTÕES (quick_replies): cada botão 'próximo passo' liga ao seu ALVO
//   (btn.next) ou, se não definido, ao próximo bloco na sequência (handle btn:i).
//   Botões url/whatsapp abrem link e NÃO geram ligação de fluxo.
// - condição: liga aos blocos sim/não (handle yes/no).
// - demais blocos (texto, mídia, delay): ligam linear ao próximo (handle next).
function buildEdges(blocks: AutomacaoBlock[]): FlowEdge[] {
  const edges: FlowEdge[] = [];
  const ids = new Set(blocks.map((b) => b.id));
  blocks.forEach((block, i) => {
    const next = blocks[i + 1];
    if (block.type === 'condition') {
      if (block.yes_step && ids.has(block.yes_step)) edges.push({ from: block.id, to: block.yes_step, handle: 'yes' });
      if (block.no_step && ids.has(block.no_step)) edges.push({ from: block.id, to: block.no_step, handle: 'no' });
    } else if (block.type === 'quick_replies' && block.buttons?.length) {
      block.buttons.forEach((btn, j) => {
        const roteia = btn.action_type === 'next_block' || btn.action_type === 'trigger_flow' || !btn.action_type;
        if (!roteia) return; // url/whatsapp abrem link, não ramificam
        const alvo = (btn.next && ids.has(btn.next)) ? btn.next : next?.id;
        if (alvo) edges.push({ from: block.id, to: alvo, handle: `btn:${j}` });
      });
    } else if (block.type !== 'end_flow' && next) {
      edges.push({ from: block.id, to: next.id, handle: 'next' });
    }
  });
  return edges;
}

export function automacaoToFlow(automacao: AutomacaoFlow): Flow {
  const steps: FlowStep[] = automacao.blocks.map((block) => automacaoBlockToStep(block));

  return {
    id: automacao.id || 0,
    nome: automacao.nome,
    descricao: automacao.descricao || '',
    trigger_type: automacao.trigger_type,
    trigger_value: automacao.trigger_value || '',
    match_mode: automacao.match_mode,
    enabled: automacao.enabled,
    steps,
    edges: buildEdges(automacao.blocks),
    post_ig_id: '',
    priority: 0,
    cooldown_minutes: 0,
    criado_em: automacao.criado_em || new Date().toISOString(),
    atualizado_em: automacao.atualizado_em || new Date().toISOString(),
  };
}

export function flowToAutomacao(flow: Flow): AutomacaoFlow {
  const edges = flow.edges || [];
  const blocks: AutomacaoBlock[] = flow.steps.map((step) => {
    const block = stepToAutomacaoBlock(step);
    // Reconstrói os ALVOS a partir das edges (pra não perder a ramificação ao salvar).
    for (const e of edges.filter((x) => x.from === step.id)) {
      if (e.handle === 'yes') block.yes_step = e.to;
      else if (e.handle === 'no') block.no_step = e.to;
      else if (e.handle?.startsWith('btn:')) {
        const j = parseInt(e.handle.slice(4), 10);
        if (block.buttons && block.buttons[j]) block.buttons[j].next = e.to;
      }
    }
    return block;
  });

  return {
    id: flow.id,
    nome: flow.nome,
    descricao: flow.descricao,
    trigger_type: flow.trigger_type as any,
    trigger_value: flow.trigger_value,
    match_mode: flow.match_mode as any,
    enabled: flow.enabled,
    blocks,
    priority: flow.priority,
    criado_em: flow.criado_em,
    atualizado_em: flow.atualizado_em,
  };
}

function automacaoBlockToStep(block: AutomacaoBlock): FlowStep {
  return {
    id: block.id,
    type: block.type === 'tag' ? 'tag' : block.type,
    content: block.content || '',
    buttons: block.buttons?.map((btn) => ({
      label: btn.label,
      postback: btn.postback,
      url: btn.url,
    })) || [],
    field_name: block.field_name,
    field_label: block.content,
    delay_seconds: block.wait_seconds ?? (block.wait_minutes ? block.wait_minutes * 60 : undefined),
    media_url: block.media_url,
    media_type: block.media_type,
    tag_to_apply: block.tag_to_apply,
    yes_step: block.yes_step,
    no_step: block.no_step,
    condition_field: block.condition_field,
    condition_equals: block.condition_equals,
  };
}

function stepToAutomacaoBlock(step: FlowStep): AutomacaoBlock {
  const block: AutomacaoBlock = {
    id: step.id,
    type: step.type as any,
    content: step.content,
    buttons: step.buttons?.map((btn) => ({
      label: btn.label,
      postback: btn.postback,
      url: btn.url,
      // Reconstrói o action_type (não é persistido no FlowStep): botão com url é link,
      // senão vai pro próximo bloco. Sem isso, buildEdges tratava link como ramificação.
      action_type: (btn.url ? 'url' : 'next_block') as 'url' | 'next_block',
    })) || [],
    field_name: step.field_name,
    media_url: step.media_url,
    media_type: step.media_type as any,
    tag_to_apply: step.tag_to_apply,
    condition_field: step.condition_field || step.field_name,
    condition_equals: step.condition_equals,
    yes_step: step.yes_step,
    no_step: step.no_step,
    wait_seconds: step.delay_seconds,
  };
  return block;
}
