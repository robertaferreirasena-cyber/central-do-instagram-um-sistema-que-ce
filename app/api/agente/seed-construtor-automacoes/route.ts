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

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    let existingAgent = null;
    try {
      const result = await supabase
        .from('agents')
        .select('id')
        .eq('name', 'Construtor de Automações')
        .single();
      existingAgent = result.data;
    } catch {
      existingAgent = null;
    }

    if (existingAgent) {
      return NextResponse.json(
        {
          success: true,
          message: 'Agente Construtor de Automações já existe',
          agentId: existingAgent.id,
        },
        { status: 200 }
      );
    }

    const { data: newAgent, error: agentError } = await supabase
      .from('agents')
      .insert([
        {
          name: 'Construtor de Automações',
          persona:
            'Especialista em automação de Instagram DM. Lê o brain da marca (tom de voz, contexto, valores) e o conteúdo do post/caption para construir fluxos de automação coerentes, diretos e eficientes. Monta sequências de blocos (gatilho → mensagem → botões → ação) que convertam comentários em leads qualificados.',
          escopo:
            'Análise de posts, capturas de intenção de público, construção de fluxos de automação com IA. Usa o brain da marca como base e respeita o tom IA Club.',
          tom: 'SIM: direto, prático, sem hype, resultado-orientado. NÃO: genérico, placeholder, vago.',
          status: 'active',
          funcao: 'automacao',
          objetivo: 'construção de automações',
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

    return NextResponse.json(
      {
        success: true,
        message: 'Agente Construtor de Automações criado com sucesso',
        agentId: newAgent?.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao seedar Construtor de Automações:', error);
    return NextResponse.json(
      { error: 'Erro interno ao seedar agente' },
      { status: 500 }
    );
  }
}
