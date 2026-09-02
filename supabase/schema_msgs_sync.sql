-- Sincronização de mensagens em tempo real (throttle 20s por conversa)
-- IDEMPOTENT: ALTER TABLE com IF NOT EXISTS

ALTER TABLE zernio_conversations ADD COLUMN IF NOT EXISTS msgs_sync_em TIMESTAMPTZ;
