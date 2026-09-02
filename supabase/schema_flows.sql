-- schema_flows.sql - Flow Engine (Upgrade 1)
-- Tabelas idempotentes para gestão de fluxos automáticos tipo ManyChat

CREATE TABLE IF NOT EXISTS flows (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  trigger_type TEXT NOT NULL,
  trigger_value TEXT,
  match_mode TEXT DEFAULT 'contains',
  steps JSONB DEFAULT '[]',
  post_ig_id TEXT,
  priority INT DEFAULT 0,
  enabled BOOLEAN DEFAULT false,
  cooldown_minutes INT DEFAULT 5,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flow_runs (
  id BIGSERIAL PRIMARY KEY,
  flow_id BIGINT NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  ig_user_id TEXT NOT NULL,
  conversation_id TEXT,
  current_step INT DEFAULT 0,
  context JSONB DEFAULT '{}',
  status TEXT DEFAULT 'running',
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flows_trigger ON flows(trigger_type, trigger_value);
CREATE INDEX IF NOT EXISTS idx_flows_enabled ON flows(enabled);
CREATE INDEX IF NOT EXISTS idx_flow_runs_flow_id ON flow_runs(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_runs_ig_user ON flow_runs(ig_user_id);
CREATE INDEX IF NOT EXISTS idx_flow_runs_status ON flow_runs(status);
