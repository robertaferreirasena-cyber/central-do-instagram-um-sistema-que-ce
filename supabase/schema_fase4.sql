-- FASE 4: Agente de Atendimento (Idempotente)
-- Tabelas para agents (agentes de IA) e ia_modelos (cascata de modelos)

-- Tabela: agents
CREATE TABLE IF NOT EXISTS public.agents (
  id bigserial PRIMARY KEY,
  nome text NOT NULL,
  persona text NOT NULL,
  funcao text NOT NULL,
  instrucoes text DEFAULT '',
  ativo boolean DEFAULT true,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_ativo ON public.agents(ativo);

-- Trigger para atualizado_em
CREATE OR REPLACE FUNCTION update_agents_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_agents_atualizado_em ON public.agents;
CREATE TRIGGER trigger_agents_atualizado_em
BEFORE UPDATE ON public.agents
FOR EACH ROW
EXECUTE FUNCTION update_agents_atualizado_em();

-- Tabela: ia_modelos (cascata de modelos com fallback)
CREATE TABLE IF NOT EXISTS public.ia_modelos (
  id bigserial PRIMARY KEY,
  model_id text NOT NULL UNIQUE,
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  status text DEFAULT 'unknown',
  testado_em timestamp with time zone,
  criado_em timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ia_modelos_ordem_ativo ON public.ia_modelos(ordem, ativo);

-- Adicionar coluna agente_id em zernio_conversations (referência ao agente escolhido)
ALTER TABLE public.zernio_conversations
ADD COLUMN IF NOT EXISTS agente_id bigint REFERENCES public.agents(id) ON DELETE SET NULL;

ALTER TABLE public.zernio_conversations
ADD COLUMN IF NOT EXISTS modo text DEFAULT 'humano';

CREATE INDEX IF NOT EXISTS idx_zernio_conversations_agente_id ON public.zernio_conversations(agente_id);
