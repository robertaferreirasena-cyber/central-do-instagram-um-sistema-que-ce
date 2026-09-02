# Fila de Envio Robusta (U6) — Implementação

## Status Atual

✅ **CONSTRUÍDO** — Fila implementada mas **NÃO ATIVADA** para produção.
- Schema SQL: `schema_fila_envio.sql` (idempotente)
- Motor: `lib/sendQueue.ts` com `enqueue()` e `drainQueue()`
- Rota: `POST /api/queue/tick` (protegida por token)
- Integração: `lib/instagram.ts` usa `enqueue()` para todos os envios
- Anti-loop: Webhook valida `isOurComment` e `parent_id`
- Portão gracioso: `lib/variables.ts` com `canSendFollowReminder()`

## Regras de Segurança (invioláveis)

A fila é construída mas **NÃO drena sozinha**:
- ❌ Sem `node_modules/@hourly-cron` ou similar ativo
- ❌ `agente_ativo` continua `false`
- ❌ Webhook NÃO registrado em Zernio
- ❌ Nada é enviado de verdade até ativar manualmente

## Como Funciona a Fila

### 1. Enqueueing (Entrada)

Sempre que um evento dispara (comentário, story reply, DM), o sistema chama:

```typescript
await enqueue({
  account_id: 'seu_account_id',
  kind: 'dm' | 'comment_reply' | 'private_reply',
  contact_id: '123', // lead ID, opcional
  conversation_id: 'conv_456', // para DMs
  comment_id: 'comment_789', // para respostas a comentário
  message: 'Texto com {{first_name|Olá}}',
  media_url: 'https://...', // opcional
  media_type: 'image', // opcional
  dedupe_key: 'unique_event_id', // OBRIGATÓRIO
  not_before: new Date(Date.now() + 1000 * 60), // opcional (delay)
});
```

**Idempotência**: Se `dedupe_key` já existe, o item NÃO é inserido (evita duplicação).

### 2. Draining (Saída) — Controlado

Rodar manual ou via cron:

```bash
curl -X POST http://localhost:3000/api/queue/tick \
  -H "Authorization: Bearer seu_QUEUE_TICK_TOKEN"
```

**O que acontece:**
1. Busca itens com `status='pending'` E `not_before <= now()`
2. Recupera itens presos em `sending` há >3min
3. Filtra contas que atingiram teto horário (~190/h)
4. **Claim atômico**: marca como `sending` + `claimed_at=now` (sem race condition)
5. Processa lote de 15 itens, com ~600ms entre envios
6. Renderiza variáveis (`{{first_name}}`)
7. Envia anexo em mensagem separada (se falhar, continua com texto)
8. Marca como `sent` + `sent_at=now`

### 3. Janela de 24h para DMs Comuns

`kind: 'dm'` só sai se última resposta do contato foi <24h atrás (margem 5min).
Se fora da janela → rebota para `pending` (tenta novamente depois).

**Exceção**: `kind: 'private_reply'` fura a janela (resposta privada a comentário sempre sai).

### 4. Limite de Tentativas

- `comment_reply`: Máx 1x (attempts > 1 pula)
- `private_reply`: Sem limite
- `dm`: Tenta até 3x antes de desistir

## Anti-Loop de Comentário

Webhook detecta **2 trancas**:

1. **É comentário nosso?**
   ```
   from.id == account_id E @username (normalizado) == nosso
   ```
   → Ignora, registra `own_comment` nos logs.

2. **Resposta em thread?**
   ```
   parent_id presente → Ignora
   ```
   → Impede loop quando trava 1 não reconhece a conta.

## Portão de Seguidor (Degradação Graciosa)

Se `followsAccount` voltar `null` (Meta não informou):
- ✅ **LIBERA** e continua o fluxo
- 📝 Registra em `crm_eventos` como `flow_follow_gate_degraded`
- Nunca **prende** a base inteira

Máx 5 lembretes de follow **por pessoa/dia**:
- Contagem rejeita por `person_id`
- Reseteia a cada 24h
- Acima de 5: pula o lembrete, continua fluxo

## Variáveis Renderizadas

Resolução acontece na **hora do envio** (ponto único em `drainQueue`):

```
{{first_name}} → Pega contato.nome, extrai primeiro nome
{{first_name|Amigo}} → Fallback se não encontrar
Insensível a acento: "José" == "Jose"
```

Falha aberta: se chave não resolve, usa string vazia ou fallback.

## Como Ativar (Checklist para Produção)

1. ✅ Aplicar `schema_fila_envio.sql` ao Supabase
2. ✅ Testar enqueue/dequeue em staging (manualmente via `/api/queue/tick`)
3. ✅ Confirmar `QUEUE_TICK_TOKEN` definido em `.env`
4. ✅ Montar cron (ex: `0 * * * *` = a cada hora) via scheduler externo
5. ✅ Ativar webhook em Zernio (produção só depois)
6. ✅ Monitorar `crm_eventos` para erros de envio
7. ✅ Validar métricas: enviados/hora, taxa de erro, latência

## Variáveis de Ambiente

```env
QUEUE_TICK_TOKEN=seu_token_super_secreto
ZERNIO_API_KEY=...
ZERNIO_WEBHOOK_SECRET=...
```

## Migração de `ig_pendentes` → `send_queue`

A tabela antiga `ig_pendentes` **continua funcionando** (compatibilidade).
Gradualmente:
1. Novos envios já usam `send_queue`
2. Desligar criação de novos `ig_pendentes`
3. Migrar registros antigos se necessário
4. Remover `ig_pendentes` (não mais usado)

## Estrutura da Tabela

```sql
send_queue
├── id: BIGSERIAL (PK)
├── account_id: TEXT (quem envia)
├── kind: TEXT (dm|comment_reply|private_reply)
├── contact_id: TEXT (lead ID, opcional)
├── conversation_id: TEXT (para DMs)
├── comment_id: TEXT (para comentários)
├── payload: JSONB (message, media_url, media_type)
├── dedupe_key: TEXT UNIQUE (anti-duplicação)
├── status: TEXT (pending|sending|sent|error)
├── attempts: INT (contador de tentativas)
├── not_before: TIMESTAMPTZ (quando libera para envio)
├── claimed_at: TIMESTAMPTZ (quando marcou sending)
├── sent_at: TIMESTAMPTZ (quando enviou)
├── error: TEXT (descrição do erro)
└── criado_em: TIMESTAMPTZ
```

## Monitoramento

**Queries úteis:**

```sql
-- Items pendentes
SELECT COUNT(*) FROM send_queue WHERE status='pending';

-- Taxa de erro
SELECT status, COUNT(*) FROM send_queue GROUP BY status;

-- Idade dos itens em sending (presos?)
SELECT id, claimed_at, EXTRACT(EPOCH FROM (now() - claimed_at))/60 as mins_claimed
FROM send_queue WHERE status='sending' ORDER BY claimed_at DESC;

-- Últimas falhas
SELECT id, account_id, error FROM send_queue WHERE status='error' LIMIT 10;
```

---

**Data de Entrega**: 2026-09-02
**Status**: ✅ Implementado, ❌ Não ativado para produção
