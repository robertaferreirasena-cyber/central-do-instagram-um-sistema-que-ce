import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

const FAQ_IACLUB = [
  {
    categoria: 'Preço',
    pergunta: 'Quanto custa?',
    resposta:
      'A IA Club é R$ 358 por ano, com 7 dias de garantia. Acesso a automações, prompts testados e estratégias de marketing com IA toda semana.',
  },
  {
    categoria: 'O que é',
    pergunta: 'O que é a IA Club?',
    resposta:
      'É a maior comunidade de IA aplicada pra empreendedores do Brasil. Não é curso nem teoria — é comunidade viva: você aprende aplicando, com quem já está fazendo.',
  },
  {
    categoria: 'Como funciona',
    pergunta: 'Como funciona?',
    resposta:
      'Toda semana você recebe automações, prompts testados e estratégias práticas de IA pro seu negócio, e troca com uma comunidade de +500 membros. Tudo direto ao ponto.',
  },
  {
    categoria: 'Garantia',
    pergunta: 'Tem garantia?',
    resposta:
      'Tem: 7 dias de garantia. Você entra, testa e, se não for pra você, é só pedir reembolso nesse prazo.',
  },
  {
    categoria: 'Pra quem',
    pergunta: 'Serve pra mim / preciso saber programar?',
    resposta:
      'Se você sabe usar WhatsApp, você consegue aplicar. É pra empreendedor que quer usar IA no negócio de forma prática, sem enrolação.',
  },
  {
    categoria: 'Newsletter',
    pergunta: 'O que é o Café com AI?',
    resposta:
      'É nossa newsletter gratuita: as bombas da semana em IA explicadas em 5 minutos, toda terça. Já são +22.000 assinantes.',
  },
  {
    categoria: 'Entrar',
    pergunta: 'Como entro?',
    resposta:
      'É só entrar em iaclubcomunidade.com.br e garantir sua vaga. Qualquer dúvida antes, me chama que te ajudo.',
  },
];

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // 1. Checar se agente IA Club já existe
    let existingAgent = null;
    try {
      const result = await supabase
        .from('agents')
        .select('id')
        .eq('name', 'IA Club')
        .single();
      existingAgent = result.data;
    } catch {
      existingAgent = null;
    }

    let agentId = existingAgent?.id;

    // 2. Se não existe, criar agente IA Club
    if (!agentId) {
      const { data: newAgent, error: agentError } = await supabase
        .from('agents')
        .insert([
          {
            name: 'IA Club',
            persona:
              'Direto, objetivo, estratégico. Frases curtas com impacto. Foco em resultado prático, sem enrolação. Acessível e educativo.',
            escopo:
              'Só responde sobre IA Club (comunidade, Café com AI, imersões). Fora disso, redireciona com educação.',
            tom: 'SIM: direto, objetivo, impacto, prático. NÃO: emoji, negrito excessivo, jargão técnico, promessa de milagre.',
            status: 'inactive',
          },
        ])
        .select('id')
        .single();

      if (agentError) {
        return NextResponse.json(
          { error: 'Erro ao criar agente', details: agentError.message },
          { status: 500 }
        );
      }

      agentId = newAgent?.id;
    }

    // 3. Semear FAQ (dedupe por pergunta)
    let seededCount = 0;

    for (const faq of FAQ_IACLUB) {
      // Checar se pergunta já existe
      let existing = null;
      try {
        const result = await supabase
          .from('base_conhecimento')
          .select('id')
          .eq('agent_id', agentId)
          .eq('pergunta', faq.pergunta)
          .single();
        existing = result.data;
      } catch {
        existing = null;
      }

      if (!existing) {
        const { error: insertError } = await supabase
          .from('base_conhecimento')
          .insert([
            {
              agent_id: agentId,
              categoria: faq.categoria,
              pergunta: faq.pergunta,
              resposta: faq.resposta,
              ativo: true,
            },
          ]);

        if (!insertError) {
          seededCount++;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Agente IA Club semeado com sucesso (${seededCount} FAQ novas)`,
        agentId,
        totalFaqConfigured: FAQ_IACLUB.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao seedar IA Club:', error);
    return NextResponse.json(
      { error: 'Erro interno ao seedar agente' },
      { status: 500 }
    );
  }
}
