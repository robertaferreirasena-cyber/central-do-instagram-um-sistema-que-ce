-- Adicionar account_id à tabela flows (idempotente)
ALTER TABLE flows
ADD COLUMN IF NOT EXISTS account_id TEXT DEFAULT 'default-account';
