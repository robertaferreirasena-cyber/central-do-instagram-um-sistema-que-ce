-- schema_modelos.sql - Biblioteca de Modelos de Conteúdo (Upgrade 2)
-- Tabela idempotente para templates de conteúdo reutilizáveis

CREATE TABLE IF NOT EXISTS content_templates (
  id BIGSERIAL PRIMARY KEY,
  account_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  formato TEXT,
  proporcao TEXT,
  objetivo TEXT,
  marca TEXT,
  campos JSONB DEFAULT '[]',
  preview_url TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_templates_account ON content_templates(account_id);
CREATE INDEX IF NOT EXISTS idx_content_templates_formato ON content_templates(formato);
CREATE INDEX IF NOT EXISTS idx_content_templates_objetivo ON content_templates(objetivo);
