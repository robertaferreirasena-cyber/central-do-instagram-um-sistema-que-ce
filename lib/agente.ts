import { supabase } from './db';

// ============================================================================
// NVIDIA GRÁTIS - CASCATA DE MODELOS
// ============================================================================

const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export async function cerebro(
  messages: LLMMessage[],
  maxTokens = 420,
  temperature = 0.6
): Promise<LLMResponse> {
  if (!NVIDIA_API_KEY) {
    return {
      success: false,
      error: 'IA não configurada (NVIDIA_API_KEY ausente)',
    };
  }

  // Busca cascata de modelos ativos ordenados por ordem
  const { data: modelos } = await supabase
    .from('ia_modelos')
    .select('model_id, ordem')
    .eq('ativo', true)
    .order('ordem', { ascending: true })
    .limit(10);

  if (!modelos || modelos.length === 0) {
    return {
      success: false,
      error: 'Nenhum modelo de IA configurado',
    };
  }

  // Tentar cada modelo na cascata
  for (const model of modelos) {
    const response = await chamaNvidia(messages, model.model_id, maxTokens, temperature);
    if (response.success) {
      return response;
    }

    // Se 404 ou 410, desativar o modelo
    if (response.error?.includes('404') || response.error?.includes('410')) {
      console.log(`Modelo ${model.model_id} desativado (${response.error})`);
      await supabase
        .from('ia_modelos')
        .update({ ativo: false, status: 'indisponivel' })
        .eq('model_id', model.model_id);
    }
  }

  return {
    success: false,
    error: 'Todos os modelos falharam',
  };
}

async function chamaNvidia(
  messages: LLMMessage[],
  model: string,
  maxTokens: number,
  temperature: number
): Promise<LLMResponse> {
  try {
    const response = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      const code = response.status;
      return {
        success: false,
        error: `${code}: ${data.error?.message || 'erro desconhecido'}`,
      };
    }

    const content = data.choices?.[0]?.message?.content || '';
    return { success: true, content };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'erro na chamada',
    };
  }
}

// ============================================================================
// SYSTEM PROMPT (ORDEM IMPORTA)
// ============================================================================

export async function agenteSysPrompt(
  agenteFuncao: string,
  agentePessoa: string,
  agenteInstrucoes: string
): Promise<string> {
  const baseConhecimento = await lerBaseConhecimento();
  const regrasComercias = obterRegrasComercias();

  const prompt = `${ESCOPO_AGENTE}

==== PERSONA ====
${agentePessoa}

==== FUNÇÃO (${agenteFuncao}) ====
${FUNCOES[agenteFuncao as keyof typeof FUNCOES] || FUNCOES.geral}

==== BASE DE CONHECIMENTO ====
${baseConhecimento}

${agenteInstrucoes ? `==== INSTRUÇÕES DO AGENTE ====\n${agenteInstrucoes}\n` : ''}

==== REGRAS COMERCIAIS (FONTE DE VERDADE = CRM) ====
${regrasComercias}

==== QUALIFICAÇÃO ====
Varie as perguntas pelo tipo de cliente: varejo (uma unidade), atacado (volume > 10), corporativo (3+ meses).

==== RESPOSTA ====
Responda APENAS a mensagem final do usuário. Resposta CURTA, em pt-BR, SEM raciocínio, máx 600 caracteres.

==== TRANSBORDO ====
Redirecione para humano se: pedido complexo, dúvida sobre saúde, devolução/reclamação, solicitação fora do escopo.
`;

  return prompt;
}

const ESCOPO_AGENTE = `Você é um assistente de atendimento de IA para a ChimaGi.
Fale APENAS sobre produtos, serviços e políticas da ChimaGi.
Se a pergunta for fora do escopo (política, saúde, finança, técnica geral), redirecione com educação:
"Desculpe, não posso ajudar com isso. Fale com um vendedor se precisar de outra coisa 😊"
Sempre: respostas variadas, sem repetir.`;

const FUNCOES = {
  geral: `Assistente geral: responda dúvidas sobre produtos, preços, prazo, disponibilidade.
Pode: qualificar por volume, sugerir produtos, oferecer descontos se autorizado.
Não pode: fazer promessas de saúde, prometer financiamento, alterar pedidos já confirmados.`,

  orquestrador: `Diretor de conversa: roteia para o agente certo (comercial, suporte, legal).
Pode: fazer perguntas de diagnóstico.
Não pode: responder direto (passa adiante).`,

  qualificacao: `Qualificador: detecta intenção (varejo, atacado, interesse) e passa pro time.
Pode: fazer perguntas exploratórias.
Não pode: fazer oferta (passa adiante).`,

  comercial: `Vendedor: fecha vendas, negocia volume, oferece condições.
Pode: sugerir descontos, falar sobre prazo de entrega, frete.
Não pode: prometer saúde, alterar política de devolução.`,

  suporte: `Suporte: resolve problemas técnicos, rastreia pedidos, processa devoluções.
Pode: reembolsar, abrir chamado.
Não pode: fazer nova venda (passa pro comercial).`,

  followup: `Follow-up: retoma contatos warm (já visitou, mas não comprou).
Pode: oferecer desconto especial, lembrar de benefício que deixou passar.
Não pode: fazer spam (máx 1x semana).`,

  conteudo: `Criador de conteúdo: responde sobre rotina, benefícios, receitas.
Pode: sugerir produtos, fazer perguntas sobre hábito.
Não pode: fazer promessas de resultado (sempre "pode variar").`,

  monitoramento: `Monitor: lê métricas, avisa se algo está errado.
Pode: levantar alerta, pedir confirmação.
Não pode: agir sem autorização (passa adiante).`,

  pre_atendimento: `Pré-atendimento: primeira resposta, coleta dados, prioriza.
Pode: tirar dúvida simples, agendar consulta.
Não pode: vender direto (passa pro comercial).`,
};

function obterRegrasComercias(): string {
  return `1. PREÇO: NUNCA invente. Consulte a tabela de preços (realtime do banco).
2. ESTOQUE: NUNCA prometa se não confirmado no banco.
3. FRETE: Calcule sempre pelo CEP (se disponível). NUNCA chute.
4. PRAZO: Sempre a data certa (não "cerca de").
5. PROMOÇÃO: NUNCA ofereça desconto sem autorização. Cheque se o cliente tem qualificação.
6. SAÚDE: NUNCA faça promessa ("cura", "elimina"). Use "pode contribuir", "auxilia", "suporta".
7. OPT-IN: Sempre pergunte antes de adicionar a lista de marketing.
8. VAREJO ≠ ATACADO: Varejo = 1-5 un. Atacado = 10+. Regras diferentes (prazo, desconto).
9. FORA DO ESCOPO: Não responda sobre concorrente, estilo de vida, finanças pessoais.
10. HONESTIDADE: Se não sabe, diga "vou verificar". NUNCA imagine.`;
}

async function lerBaseConhecimento(): Promise<string> {
  if (!supabase) return 'Base de conhecimento indisponível.';

  try {
    const { data } = await supabase
      .from('base_conhecimento')
      .select('topico, conteudo')
      .limit(10);

    if (!data || data.length === 0) {
      return 'Base de conhecimento vazia.';
    }

    return data
      .map((row: any) => `**${row.topico}**: ${row.conteudo}`)
      .join('\n\n');
  } catch (err) {
    console.error('Erro ao ler base_conhecimento:', err);
    return 'Erro ao carregar base de conhecimento.';
  }
}

// ============================================================================
// AUTO RESPONDER - RESPOSTA AO VIVO
// ============================================================================

export async function autoResponder(conversationId: string): Promise<void> {
  if (!supabase) return;

  try {
    // 1. Verificar se a conversa está em modo='agente' e não resolvida
    const { data: conversation } = await supabase
      .from('zernio_conversations')
      .select('id, agente_id, modo')
      .eq('id', conversationId)
      .single();

    if (!conversation || conversation.modo !== 'agente') {
      console.log(`Conversa ${conversationId} não está em modo agente`);
      return;
    }

    if (!conversation.agente_id) {
      console.log(`Conversa ${conversationId} sem agente selecionado`);
      return;
    }

    // 2. Buscar agente
    const { data: agente } = await supabase
      .from('agents')
      .select('nome, persona, funcao, instrucoes')
      .eq('id', conversation.agente_id)
      .single();

    if (!agente) {
      console.log(`Agente ${conversation.agente_id} não encontrado`);
      return;
    }

    // 3. Buscar últimas 8 mensagens
    const { data: messages } = await supabase
      .from('zernio_messages')
      .select('autor, content, direcao, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(8);

    if (!messages || messages.length === 0) {
      return;
    }

    // 4. Montar histórico para LLM
    const systemPrompt = await agenteSysPrompt(agente.funcao, agente.persona, agente.instrucoes);
    const llmMessages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.direcao === 'in' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      })),
    ];

    // 5. Chamar LLM
    let response = await cerebro(llmMessages, 420, 0.6);

    if (!response.success || !response.content) {
      // Retry com temp menor
      response = await cerebro(llmMessages, 420, 0.4);
    }

    if (!response.success || !response.content) {
      // Redirect padrão
      const redirect = redirecionamentoPadrao(conversationId);
      console.log(`Agente falhou, usando redirect: ${redirect}`);
      // TODO: Enviar redirect via Zernio
      return;
    }

    // 6. Validar e limpar resposta
    let resposta = response.content;
    if (!respostaValida(resposta)) {
      // Retry
      const retryResponse = await cerebro(llmMessages, 420, 0.4);
      if (!retryResponse.success || !retryResponse.content) {
        const redirect = redirecionamentoPadrao(conversationId);
        console.log(`Retry falhou, usando redirect: ${redirect}`);
        return;
      }
      resposta = retryResponse.content;
    }

    resposta = limparResposta(resposta);
    resposta = resposta.substring(0, 950); // Truncar para limite do DM

    console.log(`✅ Resposta agente (${agente.nome}): ${resposta.substring(0, 100)}`);
    // TODO: Enviar resposta via Zernio (zernio.sendMessage)
  } catch (err) {
    console.error('❌ Erro em autoResponder:', err);
  }
}

function respostaValida(resposta: string): boolean {
  if (!resposta || resposta.length < 8) return false;
  if (resposta.length > 600) return false;

  const markers = ['<think', 'thinking', 'as an ai', 'system prompt', 'reflecting', 'analyzing'];
  const lower = resposta.toLowerCase();
  if (markers.some(m => lower.includes(m))) return false;

  return true;
}

function limparResposta(resposta: string): string {
  // Remover <think>...</think>
  resposta = resposta.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // Se houver raciocínio óbvio, extrai a última fala entre aspas ou parágrafo curto
  if (resposta.length > 320) {
    const quoted = resposta.match(/"([^"]*)"/);
    if (quoted) return quoted[1];

    const lines = resposta.split('\n').filter(l => l.trim());
    const lastShort = lines.reverse().find(l => l.length < 150);
    if (lastShort) return lastShort;
  }

  return resposta.trim();
}

function redirecionamentoPadrao(convId: string): string {
  const pool = [
    'Desculpe, não consegui processar sua mensagem. Um vendedor vai responder em breve! 😊',
    'Parece complicado para mim. Vou chamar um colega humano para ajudar melhor.',
    'Deixa comigo! Vou transferir para um especialista que pode resolver isso.',
    'Você merece uma resposta de verdade. Um vendedor vai conversar com você agora.',
  ];

  // Rotaciona por conversation_id para variedade
  const idx = (parseInt(convId.replace(/\D/g, '')) || 0) % pool.length;
  return pool[idx];
}

// ============================================================================
// CRUD DE AGENTES
// ============================================================================

export interface Agent {
  id?: number;
  nome: string;
  persona: string;
  funcao: string;
  instrucoes?: string;
  ativo: boolean;
}

export async function listarAgentes(): Promise<Agent[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) {
    console.error('Erro ao listar agentes:', error);
    return [];
  }

  return data || [];
}

export async function criarAgente(agente: Agent): Promise<Agent | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('agents')
    .insert([agente])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar agente:', error);
    return null;
  }

  return data;
}

export async function atualizarAgente(id: number, agente: Partial<Agent>): Promise<Agent | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('agents')
    .update(agente)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar agente:', error);
    return null;
  }

  return data;
}

export async function deletarAgente(id: number): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar agente:', error);
    return false;
  }

  return true;
}

// ============================================================================
// IA CLUB - AGENTE COM MODO TREINO (DEFAULT OFF)
// ============================================================================

export async function toggleAgenteAtivo(): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data: current } = await supabase
      .from('crm_config')
      .select('value')
      .eq('key', 'agente_ativo')
      .single();

    const newValue = current?.value === 'true' ? 'false' : 'true';

    await supabase
      .from('crm_config')
      .update({ value: newValue })
      .eq('key', 'agente_ativo');

    return newValue === 'true';
  } catch (error) {
    console.error('Erro ao toggle agente:', error);
    return false;
  }
}

export async function getAgenteStatus(): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data } = await supabase
      .from('crm_config')
      .select('value')
      .eq('key', 'agente_ativo')
      .single();

    return data?.value === 'true';
  } catch {
    return false;
  }
}

export async function setConversationMode(
  conversa_id: string,
  mode: 'normal' | 'agente'
): Promise<void> {
  if (!supabase) return;

  try {
    const { data: existing } = await supabase
      .from('conversation_modes')
      .select('id')
      .eq('conversa_id', conversa_id)
      .single()
      .catch(() => ({ data: null }));

    if (existing) {
      await supabase
        .from('conversation_modes')
        .update({ mode })
        .eq('conversa_id', conversa_id);
    } else {
      await supabase.from('conversation_modes').insert({
        conversa_id,
        mode,
      });
    }
  } catch (error) {
    console.error('Erro ao setar modo conversa:', error);
  }
}
