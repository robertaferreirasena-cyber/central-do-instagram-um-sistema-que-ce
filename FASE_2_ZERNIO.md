# FASE 2: Integração REAL do Zernio

## O que foi implementado

Integração completa do Zernio API (WhatsApp Cloud + Instagram) com Next.js + Supabase, baseada no contrato testado empiricamente do `DOC_INSTAGRAM_CHIMAGI.md`.

### 1. **lib/zernio.ts** - Cliente Zernio completo
- ✅ `ZernioClient` class com todos os endpoints REAIS:
  - `listAccounts()` - GET /accounts (retorna array direto)
  - `listConversations()` - GET /inbox/conversations (LÊ `d.data`, NÃO `d.conversations`)
  - `getMessages()` - GET /inbox/conversations/{id}/messages (LÊ `d.messages`, NÃO `d.data`)
  - `sendMessage()` - POST /inbox/conversations/{id}/messages com suporte a buttons e quickReplies
  - `replyComment()` - POST /inbox/comments/{id} (resposta pública)
  - `privateReply()` - POST /inbox/comments/{id} com flag `private:true` (DM privada)
  - `createWebhook()` - POST /webhooks/settings (registrar webhook)
  - `ZernioClient.verifySignature()` - Validar HMAC-SHA256 (método estático)
- Auth: Bearer token via `ZERNIO_API_KEY`
- Base URL: `ZERNIO_BASE_URL` (default: https://zernio.com/api/v1)

### 2. **lib/storage.ts** - Gerenciamento de mídia
- ✅ `downloadMediaToStorage()` - Baixar mídia do IG (URLs expiram) para Supabase Storage
  - Nome estável: `ig_<sha1(key||url)>.<ext>`
  - Bucket: `ig-media` (criado automaticamente se não existir)
  - Retorna URL pública do arquivo armazenado
- ✅ `deleteMediaFromStorage()` - Remover arquivo do bucket
- ✅ `ensureBucket()` - Garantir que bucket exists

### 3. **supabase/schema_zernio.sql** - Schema idempotente
- ✅ `zernio_accounts` - Contas conectadas (platform, username, platform_user_id)
- ✅ `zernio_conversations` - Conversas do Direct (zernio_conversa UNIQUE)
- ✅ `zernio_messages` - Mensagens (id_externo UNIQUE para dedupe)
- ✅ `instagram_media` - Posts/reels/stories com analytics (origem_dados, ig_produto)
- ✅ `crm_config` - Cache de configs e flags (zernio_analytics, ig_stories_sync_at)
- ✅ `zernio_sync_control` - Controle de throttle e status de sync
- ✅ `ig_automacoes` - Automações estilo ManyChat (comentário, story, DM)
- ✅ `ig_automacao_botoes` - Botões de automação (quick / link)
- ✅ `ig_pendentes` - Fila de envios com delay
- Índices de performance inclusos
- Triggers para `updated_at` automático

### 4. **app/api/webhook/zernio/route.ts** - Webhook defensivo
- ✅ Lê corpo CRU e valida HMAC-SHA256 com secret do env
- ✅ Parsing defensivo: `parseEvento()` tolerante a aninhamento de dict/object
  - Coage dict→id para account_id, conversation_id (armadilha conhecida)
  - Detecta story reply por `reply_to.story` ou messageType
  - Extrai attachment.url ou attachment.payload.url
- ✅ Idempotência por `id_externo` (dedupe no banco)
- ✅ Downloada mídia via `downloadMediaToStorage()`
- ✅ Upsert de conversa (`zernio_conversa` UNIQUE)
- ✅ Inserção de mensagem com direcao (in/out/interna)
- ✅ Suporta message.received, conversation.started, comment.received (comentário em fase 4)
- Não auto-responde ainda (fase 4)

### 5. **app/api/zernio/sync/route.ts** - Sincronização sob demanda
- ✅ POST /api/zernio/sync - Botão "Sincronizar Direct" da inbox
- ✅ Puxa todas as conversas de todas as contas Zernio
- ✅ Dedupe de conversa por (zernio_conversa, zernio_account) UNIQUE
- ✅ Para cada conversa, puxa últimas 50 mensagens
- ✅ Dedupe de mensagem por (conversation_id, id_externo) UNIQUE
- ✅ Downloada mídia dos attachments (image/video)
- ✅ Atualiza estado `aguardando_humano` se há mensagens não lidas
- ✅ Retorna sumário por conta (synced, error)

### 6. **app/api/zernio/webhook-register/route.ts** - Registrar webhook
- ✅ POST /api/zernio/webhook-register (manual, não automático)
- ✅ Gera secret aleatório se não existir em env
- ✅ Registra webhook com eventos: message.received, message.sent, conversation.started, comment.received
- ✅ Retorna endpoint, secret, e resposta da API

## Variáveis de ambiente necessárias

```env
# Zernio
ZERNIO_API_KEY=sk_...
ZERNIO_BASE_URL=https://zernio.com/api/v1
ZERNIO_WEBHOOK_SECRET=<gerado-automaticamente-ou-manual>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000 (ou domínio de produção)
```

## Próximos passos (FASE 3+)

- **FASE 3**: Auto-responda via Claude (cérebro + REGRAS_COMERCIAIS)
- **FASE 4**: Motores de automação (comentário → resposta pública + DM privada)
- **FASE 5**: Crons (sync inbox 5min, analytics, stories, pendentes)

## Mudanças no visual

✅ **Zero mudanças** - IA Club e Supabase/Publora intactos.

## Build status

✅ `npm run build` passa SEM erros
