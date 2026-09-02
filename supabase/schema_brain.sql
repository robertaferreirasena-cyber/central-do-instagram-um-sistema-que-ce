-- Brain System (BASE DE CONHECIMENTO CANÔNICA)
-- Schema idempotente para o Brain da IA Club

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'brain'
  ) then
    create table public.brain (
      id bigserial primary key,
      account_id text not null unique,
      secoes jsonb default '{"empresa": {}, "produtos_ofertas": {}, "publico": {}, "tom_de_voz": {}, "perguntas_frequentes": {}, "politicas": {}, "conteudos_aprovados": {}, "diferenciais": {}}'::jsonb,
      score int default 0,
      status text default 'draft',
      atualizado_em timestamptz default now(),
      criado_em timestamptz default now()
    );

    create index idx_brain_account_id on public.brain(account_id);
    create index idx_brain_status on public.brain(status);
  end if;
end $$;

-- Tabela de log de violações
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'brain_violations'
  ) then
    create table public.brain_violations (
      id bigserial primary key,
      account_id text not null,
      texto text,
      violacoes jsonb default '[]'::jsonb,
      contexto text,
      criado_em timestamptz default now()
    );

    create index idx_brain_violations_account_id on public.brain_violations(account_id);
  end if;
end $$;

-- Estrutura esperada do JSONB secoes:
-- empresa: { nome, descricao, founder, historia }
-- produtos_ofertas: { items: [{ nome, descricao, preco, url }] }
-- publico: { persona, pain_points, where_encontra }
-- tom_de_voz: { como_falamos, palavras_que_usamos: [], palavras_que_evitamos: [], exemplo_resposta: { pergunta, resposta } }
-- perguntas_frequentes: { items: [{ pergunta, resposta }] }
-- politicas: { nao_pode_dizer: [], regras: [] }
-- conteudos_aprovados: { items: [{ titulo, url, tipo }] }
-- diferenciais: { items: [{ diferencial, descricao }] }
