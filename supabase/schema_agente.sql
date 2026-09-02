-- CRM global configuration
CREATE TABLE IF NOT EXISTS crm_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agents available in the system
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  persona TEXT,
  escopo TEXT,
  tom TEXT,
  status TEXT DEFAULT 'inactive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base entries
CREATE TABLE IF NOT EXISTS base_conhecimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent response suggestions (draft mode)
CREATE TABLE IF NOT EXISTS agente_sugestoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id TEXT NOT NULL,
  agente_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  sugestao TEXT NOT NULL,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation modes (agente vs normal)
CREATE TABLE IF NOT EXISTS conversation_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id TEXT NOT NULL UNIQUE,
  mode TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default agente_ativo=false
INSERT INTO crm_config (key, value) VALUES ('agente_ativo', 'false')
ON CONFLICT (key) DO NOTHING;
