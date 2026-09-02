interface DirectProNode {
  id: string;
  kind: string;
  text?: string;
  buttonMode?: 'reply' | 'url';
  buttons?: Array<{ label: string; url?: string }>;
  buttonLabel?: string;
  tag?: string;
  minutes?: number;
  x?: number;
  y?: number;
}

interface DirectProEdge {
  from: string;
  handle: string;
  to: string;
}

interface DirectProFlow {
  name: string;
  descricao: string;
  trigger: string;
  match_type: string;
  keywords: string[];
  public_replies: string[];
  nodes: DirectProNode[];
  edges: DirectProEdge[];
}

export interface MappedFlowStep {
  id: string;
  type: string;
  content?: string;
  buttons?: Array<{ label: string; postback?: string; url?: string }>;
  field_name?: string;
  field_label?: string;
  delay_seconds?: number;
  tag_to_apply?: string;
  x?: number;
  y?: number;
}

export interface MappedFlow {
  nome: string;
  descricao: string;
  trigger_type: string;
  trigger_value: string;
  match_mode: string;
  steps: MappedFlowStep[];
  edges: DirectProEdge[];
  enabled: boolean;
  priority: number;
}

export function mapDirectProToFlow(directProFlow: DirectProFlow): MappedFlow {
  const steps: MappedFlowStep[] = [];

  // Mapear cada nó DirectPro para o nosso modelo
  for (const node of directProFlow.nodes) {
    const step: MappedFlowStep = {
      id: node.id,
      type: mapNodeKind(node.kind),
      x: node.x,
      y: node.y,
    };

    switch (node.kind) {
      case 'start':
        // Start não precisa fazer nada especial
        break;

      case 'message':
        step.content = interpolateVariables(node.text || '');
        if (node.buttonMode === 'reply' && node.buttons) {
          step.buttons = node.buttons.map((btn) => ({
            label: btn.label,
            postback: btn.label, // usa o label como postback
          }));
        } else if (node.buttonMode === 'url' && node.buttons) {
          step.buttons = node.buttons.map((btn) => ({
            label: btn.label,
            url: btn.url,
          }));
        }
        break;

      case 'ask_email':
        step.type = 'collect_data';
        step.field_name = 'email';
        step.field_label = interpolateVariables(node.text || '');
        break;

      case 'follow_gate':
        step.type = 'follow_gate';
        step.content = interpolateVariables(node.text || '');
        step.buttons = node.buttonLabel
          ? [{ label: node.buttonLabel, postback: node.buttonLabel }]
          : [];
        break;

      case 'tag':
        step.type = 'tag';
        step.tag_to_apply = node.tag || '';
        break;

      case 'delay':
        step.type = 'wait';
        step.delay_seconds = (node.minutes || 0) * 60;
        break;

      case 'end_flow':
        step.type = 'end_flow';
        break;

      default:
        step.type = 'text';
        step.content = node.text || '';
    }

    steps.push(step);
  }

  const triggerMap: Record<string, string> = {
    comment: 'comment',
    story: 'story_reply',
    dm: 'dm',
  };

  return {
    nome: directProFlow.name,
    descricao: directProFlow.descricao,
    trigger_type: triggerMap[directProFlow.trigger] || 'comment',
    trigger_value: directProFlow.keywords.join(','),
    match_mode: directProFlow.match_type,
    steps,
    edges: directProFlow.edges,
    enabled: false, // Sempre importa pausado
    priority: 0,
  };
}

function mapNodeKind(kind: string): string {
  const map: Record<string, string> = {
    start: 'start',
    message: 'quick_replies',
    delay: 'wait',
    ask_email: 'collect_data',
    follow_gate: 'follow_gate',
    tag: 'tag',
    end_flow: 'end_flow',
  };
  return map[kind] || kind;
}

function interpolateVariables(text: string): string {
  // Preserva variáveis {{first_name}} e {{first_name|fallback}}
  return text;
}
