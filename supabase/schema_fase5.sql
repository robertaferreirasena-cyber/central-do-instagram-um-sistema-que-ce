-- FASE 5: Estúdio de Conteúdo + Calendário + Aprovação + Publicação + Biblioteca de Mídia (Idempotente)
-- Tabelas para campanhas, calendário editorial e biblioteca de mídia

-- Tabela: content_campaigns
CREATE TABLE IF NOT EXISTS public.content_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text DEFAULT '',
  start_date date,
  end_date date,
  theme text DEFAULT '',
  created_by text DEFAULT 'unknown',
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_campaigns_account_id ON public.content_campaigns(account_id);
CREATE INDEX IF NOT EXISTS idx_content_campaigns_date_range ON public.content_campaigns(start_date, end_date);

-- Trigger para atualizado_em
CREATE OR REPLACE FUNCTION update_content_campaigns_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_content_campaigns_atualizado_em ON public.content_campaigns;
CREATE TRIGGER trigger_content_campaigns_atualizado_em
BEFORE UPDATE ON public.content_campaigns
FOR EACH ROW
EXECUTE FUNCTION update_content_campaigns_atualizado_em();

-- Tabela: content_calendar_items
CREATE TABLE IF NOT EXISTS public.content_calendar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id uuid NOT NULL REFERENCES public.content_briefs(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.content_campaigns(id) ON DELETE SET NULL,
  account_id uuid NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  scheduled_at timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'agendado',
  order_index integer DEFAULT 0,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_calendar_items_account_id ON public.content_calendar_items(account_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_items_brief_id ON public.content_calendar_items(brief_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_items_campaign_id ON public.content_calendar_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_items_scheduled_at ON public.content_calendar_items(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_calendar_items_status ON public.content_calendar_items(status);

-- Trigger para atualizado_em
CREATE OR REPLACE FUNCTION update_content_calendar_items_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_content_calendar_items_atualizado_em ON public.content_calendar_items;
CREATE TRIGGER trigger_content_calendar_items_atualizado_em
BEFORE UPDATE ON public.content_calendar_items
FOR EACH ROW
EXECUTE FUNCTION update_content_calendar_items_atualizado_em();

-- Tabela: media_library
CREATE TABLE IF NOT EXISTS public.media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  url text NOT NULL,
  tipo text NOT NULL,
  nome text NOT NULL,
  tamanho integer DEFAULT 0,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_library_account_id ON public.media_library(account_id);
CREATE INDEX IF NOT EXISTS idx_media_library_tipo ON public.media_library(tipo);
CREATE INDEX IF NOT EXISTS idx_media_library_criado_em ON public.media_library(criado_em);

-- Trigger para atualizado_em
CREATE OR REPLACE FUNCTION update_media_library_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_media_library_atualizado_em ON public.media_library;
CREATE TRIGGER trigger_media_library_atualizado_em
BEFORE UPDATE ON public.media_library
FOR EACH ROW
EXECUTE FUNCTION update_media_library_atualizado_em();
