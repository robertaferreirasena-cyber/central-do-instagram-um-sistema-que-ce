-- FASE 6: Funis Visuais + Analytics + CRM/Leads + Atribuição (Idempotente)
-- Tabelas para automação visual, gestão de leads e analytics

CREATE TABLE IF NOT EXISTS public.instagram_funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text DEFAULT '',
  status text NOT NULL DEFAULT 'rascunho',
  graph_json jsonb DEFAULT '{}'::jsonb,
  versao integer DEFAULT 1,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instagram_funnels_account_id ON public.instagram_funnels(account_id);
CREATE INDEX IF NOT EXISTS idx_instagram_funnels_status ON public.instagram_funnels(status);

CREATE OR REPLACE FUNCTION update_instagram_funnels_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  NEW.versao = COALESCE(NEW.versao, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_instagram_funnels_atualizado_em ON public.instagram_funnels;
CREATE TRIGGER trigger_instagram_funnels_atualizado_em
BEFORE UPDATE ON public.instagram_funnels
FOR EACH ROW
EXECUTE FUNCTION update_instagram_funnels_atualizado_em();

CREATE TABLE IF NOT EXISTS public.sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  nome text NOT NULL,
  contato text DEFAULT '',
  ativo boolean DEFAULT true,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sellers_account_id ON public.sellers(account_id);
CREATE INDEX IF NOT EXISTS idx_sellers_ativo ON public.sellers(ativo);

CREATE OR REPLACE FUNCTION update_sellers_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sellers_atualizado_em ON public.sellers;
CREATE TRIGGER trigger_sellers_atualizado_em
BEFORE UPDATE ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION update_sellers_atualizado_em();

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  nome text NOT NULL,
  telefone text DEFAULT '',
  instagram text DEFAULT '',
  origem text NOT NULL DEFAULT 'direct',
  interesse text DEFAULT '',
  score integer DEFAULT 0,
  status text NOT NULL DEFAULT 'novo',
  vendedor_id uuid REFERENCES public.sellers(id) ON DELETE SET NULL,
  resultado text DEFAULT '',
  historico jsonb DEFAULT '[]'::jsonb,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_account_id ON public.leads(account_id);
CREATE INDEX IF NOT EXISTS idx_leads_origem ON public.leads(origem);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_vendedor_id ON public.leads(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(score);

CREATE OR REPLACE FUNCTION update_leads_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_leads_atualizado_em ON public.leads;
CREATE TRIGGER trigger_leads_atualizado_em
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION update_leads_atualizado_em();

CREATE TABLE IF NOT EXISTS public.attribution_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  content_brief_id uuid REFERENCES public.content_briefs(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.content_campaigns(id) ON DELETE SET NULL,
  automation_id integer REFERENCES public.ig_automacoes(id) ON DELETE SET NULL,
  funnel_id uuid REFERENCES public.instagram_funnels(id) ON DELETE SET NULL,
  order_id text DEFAULT '',
  hora timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attribution_events_account_id ON public.attribution_events(account_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_lead_id ON public.attribution_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_campaign_id ON public.attribution_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_funnel_id ON public.attribution_events(funnel_id);
CREATE INDEX IF NOT EXISTS idx_attribution_events_hora ON public.attribution_events(hora);

CREATE TABLE IF NOT EXISTS public.instagram_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  media_id text UNIQUE,
  tipo text DEFAULT 'post',
  legenda text DEFAULT '',
  alcance integer DEFAULT 0,
  curtidas integer DEFAULT 0,
  comentarios integer DEFAULT 0,
  salvos integer DEFAULT 0,
  compartilhamentos integer DEFAULT 0,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instagram_media_account_id ON public.instagram_media(account_id);
CREATE INDEX IF NOT EXISTS idx_instagram_media_media_id ON public.instagram_media(media_id);

CREATE OR REPLACE FUNCTION update_instagram_media_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_instagram_media_atualizado_em ON public.instagram_media;
CREATE TRIGGER trigger_instagram_media_atualizado_em
BEFORE UPDATE ON public.instagram_media
FOR EACH ROW
EXECUTE FUNCTION update_instagram_media_atualizado_em();
