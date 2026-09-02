import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { initBrain, updateBrain, computeScore } from '@/lib/brain';

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: 'accountId required' }, { status: 400 });
    }

    // Inicializar ou resetar Brain
    await initBrain(accountId);

    // Seed com dados da IA Club (IA_CLUB_TREINO_AGENTE.md)
    const seeded = await updateBrain(accountId, {
      empresa: {
        nome: 'IA Club',
        descricao: 'A maior comunidade de IA aplicada para empreendedores brasileiros',
        founder: 'Allessandra Sinisgalli',
        historia:
          'Comunidade viva com +500 membros. Você aprende aplicando, com quem já está fazendo. Tudo prático, sem enrolação.',
      },
      produtos_ofertas: {
        items: [
          {
            nome: 'IA Club',
            descricao: 'Acesso a automações, prompts testados e estratégias de marketing com IA',
            preco: 'R$ 358/ano',
            url: 'iaclubcomunidade.com.br',
          },
          {
            nome: 'Café com AI',
            descricao: 'Newsletter gratuita: as bombas da semana em IA explicadas em 5 minutos',
            preco: 'Grátis',
            url: 'iaclubcomunidade.com.br',
          },
        ],
      },
      publico: {
        persona: 'Empreendedor que quer usar IA no negócio de forma prática',
        pain_points: [
          'Não sabe por onde começar com IA',
          'Quer automatizar processos',
          'Precisa gerar mais leads/vendas',
          'Busca estratégias práticas, não teoria',
        ],
        where_encontra: 'Instagram @iaclubcomunidade, Newsletter Café com AI',
      },
      tom_de_voz: {
        como_falamos:
          'Direto, objetivo, estratégico. Frases curtas com impacto. Foco em resultado. Educativo e prático. Acessível.',
        palavras_que_usamos: [
          'Direto',
          'Humano',
          'Claro',
          'Prático',
          'Confiável',
          'Transformação',
          'Resultado',
          'Aplicando',
        ],
        palavras_que_evitamos: [
          'Complicado',
          'Técnico demais',
          'Enrolação',
          'Promessas vazias',
          'Difícil',
          'Milagre',
          'Atalho mágico',
        ],
        exemplo_resposta: {
          pergunta: 'Preciso de quanto tempo pra começar?',
          resposta:
            'Se você sabe usar WhatsApp, você consegue aplicar. Começa hoje mesmo: acessa a comunidade, pega o primeiro prompt testado, e aplica no seu negócio. Sem teorema, só resultado.',
        },
      },
      perguntas_frequentes: {
        items: [
          {
            pergunta: 'Quanto custa?',
            resposta:
              'A IA Club é R$ 358 por ano, com 7 dias de garantia. Acesso a automações, prompts testados e estratégias de marketing com IA toda semana.',
          },
          {
            pergunta: 'O que é a IA Club?',
            resposta:
              'É a maior comunidade de IA aplicada pra empreendedores do Brasil. Não é curso nem teoria — é comunidade viva: você aprende aplicando, com quem já está fazendo.',
          },
          {
            pergunta: 'Como funciona?',
            resposta:
              'Toda semana você recebe automações, prompts testados e estratégias práticas de IA pro seu negócio, e troca com uma comunidade de +500 membros. Tudo direto ao ponto.',
          },
          {
            pergunta: 'Tem garantia?',
            resposta:
              'Tem: 7 dias de garantia. Você entra, testa e, se não for pra você, é só pedir reembolso nesse prazo.',
          },
          {
            pergunta: 'Serve pra mim / preciso saber programar?',
            resposta:
              'Se você sabe usar WhatsApp, você consegue aplicar. É pra empreendedor que quer usar IA no negócio de forma prática, sem enrolação.',
          },
          {
            pergunta: 'O que é o Café com AI?',
            resposta:
              'É nossa newsletter gratuita: as bombas da semana em IA explicadas em 5 minutos, toda terça. Já são +22.000 assinantes.',
          },
          {
            pergunta: 'Como entro?',
            resposta:
              'É só entrar em iaclubcomunidade.com.br e garantir sua vaga. Qualquer dúvida antes, me chama que te ajudo.',
          },
        ],
      },
      politicas: {
        nao_pode_dizer: [
          'preço diferente de R$ 358/ano',
          'prazo maior que 7 dias de garantia',
          'promessa de resultado garantido',
          'milagre ou atalho mágico',
          'qualquer bonus não mencionado aqui',
        ],
        regras: [
          'ESCOPO: só fala da IA Club, Café com AI e imersões',
          'NUNCA inventar preço, condição, prazo, bônus ou promessa fora disto',
          'Se não sabe, transbordo humano (chama a Allessandra/time)',
          'Objetivo: qualificar interesse e levar a entrar em iaclubcomunidade.com.br ou assinar Café com AI',
          'Sem promessa de resultado garantido',
        ],
      },
      diferenciais: {
        items: [
          {
            diferencial: 'Comunidade viva',
            descricao: 'Aprenda aplicando com +500 empreendedores fazendo na prática',
          },
          {
            diferencial: 'Prático, sem teoria',
            descricao: 'Automações, prompts e estratégias prontas pra usar',
          },
          {
            diferencial: '7 dias de garantia',
            descricao: 'Teste sem risco. Se não for pra você, reembolso integral',
          },
          {
            diferencial: '+22k assinantes na newsletter',
            descricao: 'Café com AI chega toda terça com as melhores dicas em IA',
          },
        ],
      },
      conteudos_aprovados: {
        items: [
          {
            titulo: 'Reels sobre cases de IA aplicada',
            tipo: 'Video',
          },
          {
            titulo: 'Carrossel educativo "5 erros que cometem com IA"',
            tipo: 'Carrossel',
          },
          {
            titulo: 'Post "IA não é um atalho mágico"',
            tipo: 'Post',
          },
        ],
      },
    });

    if (!seeded) {
      return NextResponse.json(
        { error: 'Falha ao atualizar brain' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Brain seedado para ${accountId}`,
      score: seeded.score,
      status: seeded.status,
    });
  } catch (error) {
    console.error('Erro ao seed brain:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST para seedar o brain' });
}
