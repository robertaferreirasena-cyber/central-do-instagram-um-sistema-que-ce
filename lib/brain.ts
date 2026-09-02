import { supabase } from './db';

// ============================================================================
// TYPES
// ============================================================================

export interface BrainSection {
  empresa?: {
    nome?: string;
    descricao?: string;
    founder?: string;
    historia?: string;
  };
  produtos_ofertas?: {
    items?: Array<{ nome: string; descricao: string; preco?: string; url?: string }>;
  };
  publico?: {
    persona?: string;
    pain_points?: string[];
    where_encontra?: string;
  };
  tom_de_voz?: {
    como_falamos?: string;
    palavras_que_usamos?: string[];
    palavras_que_evitamos?: string[];
    exemplo_resposta?: { pergunta: string; resposta: string };
  };
  perguntas_frequentes?: {
    items?: Array<{ pergunta: string; resposta: string }>;
  };
  politicas?: {
    nao_pode_dizer?: string[];
    regras?: string[];
  };
  conteudos_aprovados?: {
    items?: Array<{ titulo: string; url?: string; tipo?: string }>;
  };
  diferenciais?: {
    items?: Array<{ diferencial: string; descricao?: string }>;
  };
}

export interface Brain {
  id: number;
  account_id: string;
  secoes: BrainSection;
  score: number;
  status: 'draft' | 'active' | 'archived';
  atualizado_em: string;
  criado_em: string;
}

interface Violation {
  tipo: 'politica' | 'tom';
  mensagem: string;
  palavra?: string;
}

// Cache para brain (60 segundos)
const brainCache = new Map<string, { data: Brain; timestamp: number }>();
const CACHE_TTL = 60000;

// ============================================================================
// CARREGAR BRAIN (COM CACHE)
// ============================================================================

export async function loadBrain(accountId: string): Promise<Brain | null> {
  const now = Date.now();
  const cached = brainCache.get(accountId);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('brain')
      .select('*')
      .eq('account_id', accountId)
      .single();

    if (error) {
      console.error(`Erro ao carregar brain para ${accountId}:`, error);
      return null;
    }

    if (data) {
      brainCache.set(accountId, { data, timestamp: now });
      return data;
    }

    return null;
  } catch (err) {
    console.error('Erro ao loadBrain:', err);
    return null;
  }
}

// ============================================================================
// MONTAR SYSTEM PROMPT A PARTIR DO BRAIN
// ============================================================================

export function buildSystemPrompt(brain: Brain, extra?: string): string {
  const sec = brain.secoes;

  const empresa = sec.empresa
    ? `**Empresa:** ${sec.empresa.nome || 'N/A'}
${sec.empresa.descricao ? `Descrição: ${sec.empresa.descricao}` : ''}
${sec.empresa.founder ? `Fundadora: ${sec.empresa.founder}` : ''}
${sec.empresa.historia ? `História: ${sec.empresa.historia}` : ''}`
    : '';

  const produtos = sec.produtos_ofertas?.items
    ? `**Produtos & Ofertas:**\n${sec.produtos_ofertas.items
        .map((p) => `- ${p.nome}${p.preco ? ` (${p.preco})` : ''}: ${p.descricao || 'sem descrição'}`)
        .join('\n')}`
    : '';

  const publico = sec.publico
    ? `**Público-alvo:** ${sec.publico.persona || 'não definido'}
${sec.publico.pain_points?.length ? `Dores: ${sec.publico.pain_points.join(', ')}` : ''}
${sec.publico.where_encontra ? `Onde encontra: ${sec.publico.where_encontra}` : ''}`
    : '';

  const tom = sec.tom_de_voz
    ? `**Tom de voz:**
Como falamos: ${sec.tom_de_voz.como_falamos || 'não definido'}
${sec.tom_de_voz.palavras_que_usamos?.length ? `Palavras que USAMOS: ${sec.tom_de_voz.palavras_que_usamos.join(', ')}` : ''}
${sec.tom_de_voz.palavras_que_evitamos?.length ? `NUNCA usar: ${sec.tom_de_voz.palavras_que_evitamos.join(', ')}` : ''}
${sec.tom_de_voz.exemplo_resposta ? `Exemplo: P: "${sec.tom_de_voz.exemplo_resposta.pergunta}" R: "${sec.tom_de_voz.exemplo_resposta.resposta}"` : ''}`
    : '';

  const faq = sec.perguntas_frequentes?.items
    ? `**Perguntas frequentes:**\n${sec.perguntas_frequentes.items
        .map((q) => `Q: ${q.pergunta}\nR: ${q.resposta}`)
        .join('\n\n')}`
    : '';

  const politicas = sec.politicas
    ? `**Políticas & Regras:**
${sec.politicas.nao_pode_dizer?.length ? `NUNCA diga: ${sec.politicas.nao_pode_dizer.join(', ')}` : ''}
${sec.politicas.regras?.length ? `Regras: ${sec.politicas.regras.join(' | ')}` : ''}`
    : '';

  const conteudo = sec.conteudos_aprovados?.items
    ? `**Conteúdos aprovados:**\n${sec.conteudos_aprovados.items
        .map((c) => `- ${c.titulo}${c.tipo ? ` (${c.tipo})` : ''}`)
        .join('\n')}`
    : '';

  const diferenciais = sec.diferenciais?.items
    ? `**Diferenciais:**\n${sec.diferenciais.items
        .map((d) => `- ${d.diferencial}${d.descricao ? `: ${d.descricao}` : ''}`)
        .join('\n')}`
    : '';

  const sections = [
    `=== BRAIN SYSTEM (Base de conhecimento canônica) ===`,
    empresa,
    publico,
    tom,
    diferenciais,
    produtos,
    faq,
    politicas,
    conteudo,
    extra ? `\n=== EXTRA ===\n${extra}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return sections;
}

// ============================================================================
// VALIDAR VIOLAÇÕES DE POLÍTICA/TOM
// ============================================================================

export async function checkViolations(texto: string, brain: Brain): Promise<Violation[]> {
  const violations: Violation[] = [];

  if (!brain.secoes) return violations;

  // Verificar palavras proibidas (políticas)
  const naoPoderDizer = brain.secoes.politicas?.nao_pode_dizer || [];
  for (const palavra of naoPoderDizer) {
    const regex = new RegExp(`\\b${palavra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(texto)) {
      violations.push({
        tipo: 'politica',
        mensagem: `Contém palavra proibida: "${palavra}"`,
        palavra,
      });
    }
  }

  // Verificar tom (palavras a evitar)
  const palavrasEvitar = brain.secoes.tom_de_voz?.palavras_que_evitamos || [];
  for (const palavra of palavrasEvitar) {
    const regex = new RegExp(`\\b${palavra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(texto)) {
      violations.push({
        tipo: 'tom',
        mensagem: `Linguagem inconsistente: evitar "${palavra}"`,
        palavra,
      });
    }
  }

  return violations;
}

// ============================================================================
// REGISTRAR VIOLAÇÃO
// ============================================================================

export async function logViolation(
  accountId: string,
  texto: string,
  violations: Violation[],
  contexto?: string
): Promise<void> {
  if (!supabase || violations.length === 0) return;

  try {
    await supabase.from('brain_violations').insert({
      account_id: accountId,
      texto,
      violacoes: violations,
      contexto: contexto || null,
      criado_em: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Erro ao logViolation:', err);
  }
}

// ============================================================================
// COMPUTAR SCORE DA COMPLETUDE DO BRAIN (0-100)
// ============================================================================

export function computeScore(brain: Brain): number {
  if (!brain.secoes) return 0;

  const sec = brain.secoes;
  let score = 0;
  const maxScore = 100;
  const weights: { [key: string]: number } = {
    empresa: 15,
    publico: 10,
    tom_de_voz: 20,
    perguntas_frequentes: 15,
    politicas: 20,
    produtos_ofertas: 10,
    diferenciais: 5,
    conteudos_aprovados: 5,
  };

  // Verificar completude de cada seção
  if (sec.empresa?.nome && sec.empresa.descricao) {
    score += weights.empresa;
  }

  if (sec.publico?.persona) {
    score += weights.publico;
  }

  if (
    sec.tom_de_voz?.como_falamos &&
    sec.tom_de_voz.palavras_que_usamos?.length &&
    sec.tom_de_voz.palavras_que_evitamos?.length
  ) {
    score += weights.tom_de_voz;
  }

  if (sec.perguntas_frequentes?.items?.length) {
    score += weights.perguntas_frequentes;
  }

  if (sec.politicas?.nao_pode_dizer?.length) {
    score += weights.politicas;
  }

  if (sec.produtos_ofertas?.items?.length) {
    score += weights.produtos_ofertas;
  }

  if (sec.diferenciais?.items?.length) {
    score += weights.diferenciais;
  }

  if (sec.conteudos_aprovados?.items?.length) {
    score += weights.conteudos_aprovados;
  }

  return Math.min(score, maxScore);
}

// ============================================================================
// ATUALIZAR BRAIN
// ============================================================================

export async function updateBrain(
  accountId: string,
  secoes: Partial<BrainSection>
): Promise<Brain | null> {
  if (!supabase) return null;

  try {
    // Buscar brain atual
    const brain = await loadBrain(accountId);
    if (!brain) return null;

    // Mesclar seções
    const newSecoes = {
      ...brain.secoes,
      ...secoes,
    };

    // Calcular novo score
    const newScore = computeScore({ ...brain, secoes: newSecoes });

    // Atualizar no banco
    const { data, error } = await supabase
      .from('brain')
      .update({
        secoes: newSecoes,
        score: newScore,
        atualizado_em: new Date().toISOString(),
      })
      .eq('account_id', accountId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao updateBrain:', error);
      return null;
    }

    // Invalidar cache
    brainCache.delete(accountId);

    return data;
  } catch (err) {
    console.error('Erro ao updateBrain:', err);
    return null;
  }
}

// ============================================================================
// CRIAR OU RESETAR BRAIN PARA CONTA
// ============================================================================

export async function initBrain(accountId: string): Promise<Brain | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('brain')
      .upsert(
        {
          account_id: accountId,
          secoes: {
            empresa: {},
            produtos_ofertas: {},
            publico: {},
            tom_de_voz: {},
            perguntas_frequentes: {},
            politicas: {},
            conteudos_aprovados: {},
            diferenciais: {},
          },
          score: 0,
          status: 'draft',
        },
        { onConflict: 'account_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Erro ao initBrain:', error);
      return null;
    }

    // Invalidar cache
    brainCache.delete(accountId);

    return data;
  } catch (err) {
    console.error('Erro ao initBrain:', err);
    return null;
  }
}
