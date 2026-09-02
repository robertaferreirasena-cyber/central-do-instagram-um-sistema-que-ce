-- UPGRADE 4 — FILA DE APROVACAO HUMANA
-- Extensão idempotente da tabela agente_sugestoes

ALTER TABLE agente_sugestoes ADD COLUMN IF NOT EXISTS final_message TEXT;
ALTER TABLE agente_sugestoes ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT;
ALTER TABLE agente_sugestoes ADD COLUMN IF NOT EXISTS lead_ref TEXT;
