export type BlockType = 'text' | 'quick_replies' | 'collect_data' | 'media' | 'condition' | 'wait' | 'notify_admin' | 'end_flow' | 'tag';

export interface FlowButton {
  label: string;
  postback?: string;
  next?: string | null;
  action_type?: 'next_block' | 'url' | 'whatsapp' | 'trigger_flow';
  url?: string;
}

export interface AutomacaoBlock {
  id: string;
  type: BlockType;
  content?: string;
  buttons?: FlowButton[];
  field_name?: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  tag_to_apply?: string;
  condition_field?: string;
  condition_equals?: string;
  yes_step?: string;
  no_step?: string;
  wait_minutes?: number;
  wait_seconds?: number; // delay em segundos (estilo ManyChat "Waiting X sec")
}

export interface AutomacaoFlow {
  id?: number;
  nome: string;
  descricao?: string;
  trigger_type: 'comment' | 'story_reply' | 'dm';
  trigger_value?: string;
  match_mode: 'contains' | 'exact';
  enabled: boolean;
  blocks: AutomacaoBlock[];
  priority?: number;
  criado_em?: string;
  atualizado_em?: string;
}

export interface TriggerConfigState {
  postType: 'post' | 'reel';
  keyword: string;
  respondAll: boolean;
  humanHandoff: boolean;
}

export const BLOCK_ICONS: Record<BlockType, string> = {
  text: '💬',
  quick_replies: '🔘',
  collect_data: '📝',
  media: '🎬',
  condition: '🔀',
  wait: '⏳',
  notify_admin: '🔔',
  end_flow: '🏁',
  tag: '🏷️',
};

export const BLOCK_LABELS: Record<BlockType, string> = {
  text: 'Mensagem',
  quick_replies: 'Botões',
  collect_data: 'Coletar dado',
  media: 'Imagem/Vídeo',
  condition: 'Condição',
  wait: 'Aguardar',
  notify_admin: 'Notificar admin',
  end_flow: 'Encerrar',
  tag: 'Aplicar tag',
};
