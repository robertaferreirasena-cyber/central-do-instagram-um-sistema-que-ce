-- FASE 3: Motor de Automações (Idempotente)
-- Tabelas para ig_automacoes, ig_automacao_botoes, ig_pendentes

-- Tabela: ig_automacoes
CREATE TABLE IF NOT EXISTS public.ig_automacoes (
  id bigserial PRIMARY KEY,
  nome text NOT NULL,
  formato text DEFAULT 'qualquer', -- 'qualquer' | 'post' | 'reels' | 'stories'
  onde text NOT NULL, -- 'comentario' | 'story_reply' | 'dm'
  gatilho text DEFAULT '', -- lista por vírgula, vazio = qualquer interação
  resposta_comentario text DEFAULT '',
  resposta_dm text DEFAULT '',
  media_id text, -- amarra a automação a um post/story específico (NULL = qualquer)
  match_tipo text DEFAULT 'contem', -- 'contem' | 'exata' | 'comeca'
  ativo boolean DEFAULT false,
  disparos integer DEFAULT 0,
  leads_criados integer DEFAULT 0,
  destino text DEFAULT 'nenhum', -- 'nenhum' | 'whatsapp' | 'agente'
  tags text DEFAULT '', -- tags separadas por vírgula
  delay_seg integer DEFAULT 0, -- segundos de espera antes de enviar
  dm_media_url text, -- URL de mídia para anexar no DM
  testado boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT onde_valido CHECK (onde IN ('comentario', 'story_reply', 'dm')),
  CONSTRAINT match_tipo_valido CHECK (match_tipo IN ('contem', 'exata', 'comeca')),
  CONSTRAINT destino_valido CHECK (destino IN ('nenhum', 'whatsapp', 'agente'))
);

CREATE INDEX IF NOT EXISTS idx_ig_automacoes_onde_ativo ON public.ig_automacoes(onde, ativo);
CREATE INDEX IF NOT EXISTS idx_ig_automacoes_media_id ON public.ig_automacoes(media_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_ig_automacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ig_automacoes_updated_at ON public.ig_automacoes;
CREATE TRIGGER trigger_ig_automacoes_updated_at
BEFORE UPDATE ON public.ig_automacoes
FOR EACH ROW
EXECUTE FUNCTION update_ig_automacoes_updated_at();

-- Tabela: ig_automacao_botoes
CREATE TABLE IF NOT EXISTS public.ig_automacao_botoes (
  id bigserial PRIMARY KEY,
  automacao_id bigint NOT NULL REFERENCES public.ig_automacoes(id) ON DELETE CASCADE,
  label text NOT NULL,
  resposta text DEFAULT '', -- resposta rápida (para quick reply)
  url text, -- URL do botão (se for link)
  tipo text DEFAULT 'quick', -- 'quick' | 'link'
  ordem integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tipo_valido CHECK (tipo IN ('quick', 'link'))
);

CREATE INDEX IF NOT EXISTS idx_ig_automacao_botoes_automacao_id ON public.ig_automacao_botoes(automacao_id);
CREATE INDEX IF NOT EXISTS idx_ig_automacao_botoes_ordem ON public.ig_automacao_botoes(automacao_id, ordem);

-- Tabela: ig_pendentes (fila de envios com delay)
CREATE TABLE IF NOT EXISTS public.ig_pendentes (
  id bigserial PRIMARY KEY,
  automacao_id bigint REFERENCES public.ig_automacoes(id) ON DELETE SET NULL,
  conversation_id text, -- pode ser NULL para comentários
  lead_id bigint REFERENCES public.leads(id) ON DELETE SET NULL,
  texto text NOT NULL,
  media_url text,
  send_at timestamp with time zone NOT NULL,
  enviado boolean DEFAULT false,
  comment_id text, -- se veio de um comentário
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ig_pendentes_send_at_enviado ON public.ig_pendentes(send_at, enviado);
CREATE INDEX IF NOT EXISTS idx_ig_pendentes_conversation_id ON public.ig_pendentes(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ig_pendentes_lead_id ON public.ig_pendentes(lead_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_ig_pendentes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ig_pendentes_updated_at ON public.ig_pendentes;
CREATE TRIGGER trigger_ig_pendentes_updated_at
BEFORE UPDATE ON public.ig_pendentes
FOR EACH ROW
EXECUTE FUNCTION update_ig_pendentes_updated_at();

-- Garantir que leads e zernio_conversations existem (referências externas)
ALTER TABLE public.ig_pendentes
ADD CONSTRAINT fk_ig_pendentes_conversation_id
FOREIGN KEY (conversation_id) REFERENCES public.zernio_conversations(zernio_conversa) ON DELETE SET NULL
DEFERRABLE INITIALLY DEFERRED;

-- Granulação de permissões (se usando RLS)




-- Permitir leitura/escrita pública (ajuste conforme necessário)











