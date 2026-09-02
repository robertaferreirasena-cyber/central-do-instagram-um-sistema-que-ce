import { Flow, FlowStep } from './flowEngine';

export interface Aviso {
  tipo: 'erro' | 'aviso' | 'info';
  mensagem: string;
  nodeId?: string;
}

export interface ValidacaoGrafo {
  avisos: Aviso[];
  pendencias: number;
  temErros: boolean;
}

export function avisosDoGrafo(flow: Flow, trigger: any = null): ValidacaoGrafo {
  const avisos: Aviso[] = [];
  let pendencias = 0;

  if (!flow.steps || flow.steps.length === 0) {
    avisos.push({
      tipo: 'erro',
      mensagem: 'Fluxo vazio: adicione pelo menos um passo',
    });
    return { avisos, pendencias: 1, temErros: true };
  }

  const steps = flow.steps;
  const stepIds = new Set(steps.map((s) => s.id));

  // Verifica se há nó de start
  const hasStart = steps.some((s) => s.type === 'start');
  if (!hasStart) {
    avisos.push({
      tipo: 'aviso',
      mensagem: 'Nó de início (start) não encontrado. Adicione um nó trigger.',
    });
    pendencias++;
  }

  // Verifica gatilho ligado
  if (!trigger || !trigger.trigger_type) {
    avisos.push({
      tipo: 'aviso',
      mensagem: 'Gatilho não configurado. Configure o tipo de trigger e palavras-chave.',
    });
    pendencias++;
  }

  // Verifica blocos inalcançáveis
  const reachableIds = new Set<string>();
  const visited = new Set<string>();

  // Parse edges from flow structure (se houver)
  const edges = (flow as any).edges || [];

  function markReachable(stepId: string) {
    if (visited.has(stepId)) return;
    visited.add(stepId);
    reachableIds.add(stepId);

    const connectedEdges = edges.filter((e: any) => e.from === stepId);

    for (const edge of connectedEdges) {
      if (edge.to) {
        markReachable(edge.to);
      }
    }
  }

  // Começa do start ou do primeiro passo
  const startStep = steps.find((s) => s.type === 'start');
  if (startStep) {
    markReachable(startStep.id);
  } else if (steps.length > 0) {
    markReachable(steps[0].id);
  }

  // Encontra blocos inalcançáveis
  for (const step of steps) {
    if (!reachableIds.has(step.id) && step.type !== 'start') {
      avisos.push({
        tipo: 'aviso',
        mensagem: `Bloco "${step.id}" é inalcançável. Conecte-o ao fluxo principal.`,
        nodeId: step.id,
      });
      pendencias++;
    }
  }

  // Verifica ramificações com saída solta
  for (const step of steps) {
    if (step.type === 'quick_replies' && step.buttons && step.buttons.length > 0) {
      for (let i = 0; i < step.buttons.length; i++) {
        const buttonEdgeExists = false; // Simplificado: verificar se há edge para btn:N
        if (!buttonEdgeExists) {
          avisos.push({
            tipo: 'aviso',
            mensagem: `Botão ${i + 1} do bloco "${step.id}" não tem destino configurado.`,
            nodeId: step.id,
          });
          pendencias++;
        }
      }
    }
  }

  // Verifica etiquetas sem nome
  for (const step of steps) {
    if (step.type === 'tag' && !step.tag_to_apply) {
      avisos.push({
        tipo: 'aviso',
        mensagem: `Bloco de etiqueta "${step.id}" não tem nome definido.`,
        nodeId: step.id,
      });
      pendencias++;
    }
  }

  // Conta marcações entre colchetes [NOME] ou [SEU-LINK]
  const bracketRegex = /\[([^\]]+)\]/g;
  let bracketCount = 0;
  for (const step of steps) {
    if (step.content) {
      const matches = step.content.match(bracketRegex) || [];
      bracketCount += matches.length;
    }
  }

  if (bracketCount > 0) {
    avisos.push({
      tipo: 'info',
      mensagem: `[${bracketCount}] placeholders ainda precisam ser preenchidos (links, nomes de materiais, etc).`,
    });
  }

  const temErros = avisos.some((a) => a.tipo === 'erro');
  return { avisos, pendencias, temErros };
}

export function contarPendencias(flow: Flow): number {
  const validacao = avisosDoGrafo(flow);
  return validacao.pendencias;
}
