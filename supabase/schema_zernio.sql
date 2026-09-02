-- Integração Zernio - Schema do módulo Instagram
-- IDEMPOTENT: CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

-- Contas Zernio (conectadas via OAuth)
CREATE TABLE IF NOT EXISTS zernio_accounts (
  id BIGSERIAL PRIMARY KEY,
  account_id TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'whatsapp', 'facebook')),
  username TEXT NOT NULL,
  display_name TEXT,
  platform_user_id TEXT,
  followers_count INT DEFAULT 0,
  profile_picture_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversas do Direct/Inbox
CREATE TABLE IF NOT EXISTS zernio_conversations (
  id BIGSERIAL PRIMARY KEY,
  zernio_conversa TEXT NOT NULL,
  zernio_account TEXT NOT NULL REFERENCES zernio_accounts(account_id) ON DELETE CASCADE,
  account_id TEXT,
  participant_id TEXT,
  participant_username TEXT NOT NULL,
  participant_name TEXT,
  participant_picture_url TEXT,
  last_message TEXT,
  status TEXT DEFAULT 'open',
  unread_count INT DEFAULT 0,
  estado TEXT DEFAULT 'aguardando_humano' CHECK (estado IN ('novo', 'aguardando_humano', 'em_atendimento', 'resolvido', 'arquivado')),
  origem TEXT DEFAULT 'direct' CHECK (origem IN ('direct', 'comentario', 'story_reply', 'mencao')),
  updated_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(zernio_conversa, zernio_account)
);

-- Mensagens da conversa
CREATE TABLE IF NOT EXISTS zernio_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES zernio_conversations(id) ON DELETE CASCADE,
  id_externo TEXT NOT NULL,
  autor TEXT,
  direcao TEXT NOT NULL CHECK (direcao IN ('in', 'out', 'interna')),
  content TEXT,
  media_url TEXT,
  media_tipo TEXT CHECK (media_tipo IN ('image', 'video', 'file')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(conversation_id, id_externo)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_zernio_conversations_account ON zernio_conversations(zernio_account);
CREATE INDEX IF NOT EXISTS idx_zernio_conversations_participant ON zernio_conversations(participant_username);
CREATE INDEX IF NOT EXISTS idx_zernio_messages_conversation ON zernio_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_zernio_messages_created ON zernio_messages(created_at DESC);

-- Tabela de eventos de auditoria (cria se não existir)
CREATE TABLE IF NOT EXISTS crm_eventos (
  id BIGSERIAL PRIMARY KEY,
  tipo TEXT,
  canal TEXT,
  origem TEXT,
  lead_id BIGINT,
  conversa_id BIGINT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE crm_eventos ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE crm_eventos ADD COLUMN IF NOT EXISTS ator TEXT;

-- Tabela de posts/reels/stories do Instagram (para sync Zernio analytics)
CREATE TABLE IF NOT EXISTS instagram_media (
  id BIGSERIAL PRIMARY KEY,
  external_media_id TEXT UNIQUE,
  tipo TEXT,
  permalink TEXT,
  caption TEXT,
  thumbnail_url TEXT,
  media_url TEXT,
  publicado_em TIMESTAMP,
  sincronizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  alcance INT DEFAULT 0,
  curtidas INT DEFAULT 0,
  comentarios INT DEFAULT 0,
  salvos INT DEFAULT 0,
  compartilhamentos INT DEFAULT 0,
  taxa_engajamento DECIMAL(5,2),
  origem_dados TEXT DEFAULT 'graph' CHECK (origem_dados IN ('graph', 'zernio', 'story')),
  ig_produto TEXT DEFAULT 'FEED' CHECK (ig_produto IN ('FEED', 'REELS', 'STORY')),
  account_id BIGINT REFERENCES zernio_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para instagram_media
CREATE INDEX IF NOT EXISTS idx_instagram_media_account ON instagram_media(account_id);
CREATE INDEX IF NOT EXISTS idx_instagram_media_produto ON instagram_media(ig_produto);
CREATE INDEX IF NOT EXISTS idx_instagram_media_publicado ON instagram_media(publicado_em DESC);

-- Config do CRM (cache de analytics, flags, etc)
CREATE TABLE IF NOT EXISTS crm_config (
  chave TEXT PRIMARY KEY,
  valor TEXT,
  tipo TEXT DEFAULT 'string' CHECK (tipo IN ('string', 'json', 'bool', 'int')),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice de sincronização (throttle e rastreamento)
CREATE TABLE IF NOT EXISTS zernio_sync_control (
  id BIGSERIAL PRIMARY KEY,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('inbox', 'messages', 'analytics', 'stories')),
  account_id TEXT REFERENCES zernio_accounts(account_id) ON DELETE CASCADE,
  last_sync_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'error')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sync_type, account_id)
);

-- Comentários e automações (tabelas de suporte)
CREATE TABLE IF NOT EXISTS ig_automacoes (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT REFERENCES zernio_accounts(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  formato TEXT DEFAULT 'qualquer' CHECK (formato IN ('qualquer', 'post', 'reels', 'stories')),
  onde TEXT DEFAULT 'comentario' CHECK (onde IN ('comentario', 'dm', 'story_reply')),
  gatilho TEXT,
  resposta_comentario TEXT,
  resposta_dm TEXT,
  ativo BOOLEAN DEFAULT FALSE,
  media_id TEXT,
  disparos INT DEFAULT 0,
  leads_criados INT DEFAULT 0,
  match_tipo TEXT DEFAULT 'contem' CHECK (match_tipo IN ('contem', 'exata', 'comeca')),
  testado BOOLEAN DEFAULT FALSE,
  destino TEXT DEFAULT 'nenhum' CHECK (destino IN ('nenhum', 'whatsapp', 'agente')),
  tags TEXT,
  delay_seg INT DEFAULT 0,
  dm_media_url TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ig_automacao_botoes (
  id BIGSERIAL PRIMARY KEY,
  automacao_id BIGINT NOT NULL REFERENCES ig_automacoes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  resposta TEXT,
  ordem INT,
  url TEXT,
  tipo TEXT DEFAULT 'quick' CHECK (tipo IN ('quick', 'link'))
);

-- Fila de delay (envios agendados)
CREATE TABLE IF NOT EXISTS ig_pendentes (
  id BIGSERIAL PRIMARY KEY,
  conversa_id BIGINT REFERENCES zernio_conversations(id) ON DELETE CASCADE,
  lead_id TEXT,
  texto TEXT NOT NULL,
  media_url TEXT,
  send_at TIMESTAMP NOT NULL,
  enviado BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ig_pendentes_send_at ON ig_pendentes(send_at);
CREATE INDEX IF NOT EXISTS idx_ig_pendentes_enviado ON ig_pendentes(enviado);

-- Triggers para updated_at (opcional, depende do Postgres version)
-- Esta parte é apenas um exemplo - pode ser customizada conforme necessário
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_zernio_conversations_updated_at ON zernio_conversations;
CREATE TRIGGER update_zernio_conversations_updated_at
BEFORE UPDATE ON zernio_conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_zernio_messages_updated_at ON zernio_messages;
CREATE TRIGGER update_zernio_messages_updated_at
BEFORE UPDATE ON zernio_messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
