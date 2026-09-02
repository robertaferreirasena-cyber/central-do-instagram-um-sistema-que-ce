-- schema_fila_envio.sql - Fila de envio robusta (U6)
-- Tabela idempotente para gestão de envios via Zernio com deduplicação, janela de 24h e teto horário

CREATE TABLE IF NOT EXISTS send_queue (
  id BIGSERIAL PRIMARY KEY,
  account_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  contact_id TEXT,
  conversation_id TEXT,
  comment_id TEXT,
  payload JSONB DEFAULT '{}',
  dedupe_key TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  attempts INT DEFAULT 0,
  not_before TIMESTAMPTZ DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_send_queue_status ON send_queue(status);
CREATE INDEX IF NOT EXISTS idx_send_queue_account ON send_queue(account_id);
CREATE INDEX IF NOT EXISTS idx_send_queue_not_before ON send_queue(not_before) WHERE status='pending';
CREATE INDEX IF NOT EXISTS idx_send_queue_claimed_at ON send_queue(claimed_at) WHERE status='sending';
