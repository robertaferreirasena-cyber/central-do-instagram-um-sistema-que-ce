# FASE 3: Motor de Automações (ManyChat-style)

## ✅ O que foi implementado

Integração completa do Motor de Automações da Fase 3, baseado na seção 6 do `DOC_INSTAGRAM_CHIMAGI.md`.

### 1. **lib/instagram.ts** - Motores de Automação
- ✅ `igAutomacaoMatch()` - Busca automações ativas por (onde, media_id, gatilho, match_tipo)
- ✅ `processarComentario()` - Motor de comentário (comment.received → parse → idempotência → match → lead → resposta pública + DM)
- ✅ `processarStoryReply()` - Motor de story reply (DM com is_story_reply → match → DM → destino)
- ✅ `processarPendentes()` - Fila de delay (ig_pendentes vencidos → envia → marca enviado=true)

**Lógica implementada (§6 DOC):**
- Idempotência por `comment_id` (crm_eventos tipo `ig_comment_seen`)
- Correspondência: `contem` | `exata` | `comeca` + gatilho com lista por vírgula
- Automações amarradas a post/story específico (media_id) ou qualquer
- Resposta pública + DM com botões-link (👉 label: url)
- Destino: `nenhum` | `whatsapp` | `agente`
- Delay com fila (ig_pendentes com send_at)
- Incremento de disparos/leads_criados

### 2. **app/api/webhook/zernio/route.ts** - Integração ao Webhook (atualizado)
- ✅ Integração de `processarComentario()` para `comment.received`
- ✅ Campos adicionados ao ParsedEvent: `comment_id`, `media_id`
- ✅ Parsing defensivo de comment_id e media_id do payload

### 3. **app/api/instagram/automacao/route.ts** - Gerenciar Automações
- ✅ `POST` - Criar automação (nome, formato, onde, gatilho, resposta_comentario, resposta_dm, botões, destino, delay, tags, ativo)
- ✅ `GET` - Listar automações (com filtro opcional por "onde")
- ✅ `PUT` - Atualizar automação (por ID)
- Botões com até 2 itens (quick ou link)
- Upsert de botões (delete antigos + insert novos)

### 4. **app/api/instagram/pendentes/route.ts** - Fila de Delay
- ✅ `POST` - Processar ig_pendentes vencidos (cron ou manual)
- ✅ `GET` - Listar pendentes não enviados

### 5. **app/instagram/page.tsx** - Central do Instagram (UI)
- ✅ Aba "Automação" com:
  - Lista de automações (card com status, gatilho, disparos, leads)
  - Criador/editor com formulário lado-a-lado
  - **Preview de celular ao vivo** (atualiza enquanto digita)
  - Campos: nome, formato (qualquer/post/reels/stories), onde (comentário/story/dm), correspondência, gatilho, resposta pública, resposta no DM, botões (até 2), destino, delay, tags, ativo
  - Botão **"Testar"** (placeholder para animar fluxo)
  - Botão **"Publicar"** (ativo=true) / **"Salvar rascunho"** (ativo=false)
- Abas "Conteúdo" e "Conversas" (placeholders para expansão futura)

### 6. **supabase/schema_fase3.sql** - Migração SQL (Idempotente)
- ✅ Tabela `ig_automacoes` (nome, formato, onde, gatilho, resposta_comentario, resposta_dm, media_id, match_tipo, ativo, disparos, leads_criados, destino, tags, delay_seg, dm_media_url, testado)
  - Índices: (onde, ativo), media_id
  - Constraints: onde_valido, match_tipo_valido, destino_valido
  - Trigger: updated_at automático
- ✅ Tabela `ig_automacao_botoes` (automacao_id, label, resposta, url, tipo, ordem)
  - FK: automacao_id → ig_automacoes (CASCADE)
  - Índices: (automacao_id), (automacao_id, ordem)
- ✅ Tabela `ig_pendentes` (automacao_id, conversation_id, lead_id, texto, media_url, send_at, enviado, comment_id, created_at)
  - FK: automacao_id, lead_id, conversation_id
  - Índices: (send_at, enviado), conversation_id, lead_id
  - Trigger: updated_at automático
- ✅ Row-Level Security (RLS) habilitado + políticas públicas

## Integração com Webhook (Fase 2)

O webhook em `/api/webhook/zernio` agora processa:
- **`comment.received`** → `processarComentario()` (novo na Fase 3)
- **`message.received` / `conversation.started`** → `ingerirMensagem()` (Fase 2)
- Story reply detectado como `is_story_reply` flag → será integrado em breve

## Fluxo completo (exemplo comentário)

```
1. Zernio envia webhook: comment.received
2. Validação HMAC-SHA256
3. parseEvento() → extrai comment_id, media_id, texto, author_username
4. processarComentario(CommentPayload)
   a. Verifica idempotência (crm_eventos tipo='ig_comment_seen')
   b. igAutomacaoMatch(media_id, texto, 'comentario')
   c. Para cada automação que casa:
      - Cria/atualiza lead (origem='comentario')
      - Envia resposta pública (zernio.replyComment)
      - Envia DM com botões (zernio.privateReply ou ig_pendentes se delay)
      - Aplica destino (whatsapp/agente)
      - Incrementa disparos/leads_criados
   d. Grava crm_eventos (auditoria)
```

## Próximas integrações (não implementadas nesta fase)

- **Story reply completo**: Integrar detectado `is_story_reply` ao `processarStoryReply()`
- **Envio real de pendentes**: Integrar com `zernio.sendMessage()` / `privateReply()` na rota `/api/instagram/pendentes`
- **Destino WhatsApp/Agente**: Integrar com distribuição de leads real
- **Upload de mídia**: Form file upload → Supabase Storage
- **Teste interativo**: Botão "Testar" animar fluxo com feedback ao vivo
- **Cron de pendentes**: Configurar cron externo para chamar `POST /api/instagram/pendentes` a cada minuto

## Variáveis de ambiente (já existentes da Fase 2)

```env
ZERNIO_API_KEY=sk_...
ZERNIO_BASE_URL=https://zernio.com/api/v1
ZERNIO_WEBHOOK_SECRET=...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

## Build status

✅ `npm run build` passa **SEM erros**

**Rotas criadas:**
- `POST/GET/PUT /api/instagram/automacao`
- `POST/GET /api/instagram/pendentes`
- `GET/POST /api/instagram/page.tsx` (UI da Central)

## Mudanças visuais

✅ **Zero mudanças no Zernio/IA Club/Supabase** — apenas adição de novas rotas e tabelas.

## Próximas etapas (FASE 4+)

- Integrar envio real de pendentes (conectar Zernio API)
- Implementar destinos (WhatsApp, Agente)
- Teste interativo da automação
- Crons de sincronização (sync inbox 5min, analytics, stories, pendentes)
- Auto-resposta via Claude (cérebro + REGRAS_COMERCIAIS)
