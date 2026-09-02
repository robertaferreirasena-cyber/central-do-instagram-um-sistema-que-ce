import { NextRequest, NextResponse } from 'next/server';
import { cerebro } from '@/lib/agente';
import { ContentType } from '@/types';

interface GenerateRequest {
  type: ContentType;
  theme: string;
  account_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { type, theme, account_id } = body;

    if (!type || !theme || !account_id) {
      return NextResponse.json(
        { error: 'Tipo, tema e account_id são obrigatórios' },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(type, theme);

    const response = await cerebro(
      [
        {
          role: 'system',
          content: `Você é um especialista em criação de conteúdo para Instagram.
Gere um brief completo com ideia, roteiro curto, legenda pronta, hashtags relevantes e CTA.
Retorne em JSON com campos: idea, roteiro, caption, hashtags (array), cta.
Seja conciso e orientado para venda/engajamento.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      800,
      0.7
    );

    // Se a IA não estiver disponível (sem modelo/erro), usa fallback determinístico
    if (!response.success) {
      return NextResponse.json({
        success: true,
        fallback: true,
        aviso: response.error || 'IA indisponível — gerado por modelo determinístico',
        data: fallbackBrief(type, theme),
      });
    }

    let generated;
    try {
      const content = response.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      generated = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (e) {
      // Resposta veio, mas não era JSON válido: cai no fallback em vez de errar
      return NextResponse.json({
        success: true,
        fallback: true,
        aviso: 'Resposta da IA fora do formato — gerado por modelo determinístico',
        data: fallbackBrief(type, theme),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        idea: generated.idea || '',
        roteiro: generated.roteiro || '',
        caption: generated.caption || '',
        hashtags: Array.isArray(generated.hashtags) ? generated.hashtags : [],
        cta: generated.cta || 'Clique no link da bio',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar conteúdo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function buildPrompt(type: ContentType, theme: string): string {
  const typeLabel = {
    [ContentType.FEED]: 'foto/carrossel no feed',
    [ContentType.REEL]: 'vídeo (15-60s)',
    [ContentType.STORY]: 'story (vertical)',
    [ContentType.CAROUSEL]: 'carrossel de imagens',
  }[type] || 'conteúdo';

  return `Crie um brief para um ${typeLabel} sobre o tema: "${theme}".
Retorne um JSON com:
{
  "idea": "Ideia central em uma frase",
  "roteiro": "Roteiro curto (2-3 linhas)",
  "caption": "Legenda pronta para postar",
  "hashtags": ["tag1", "tag2", "tag3", "tag4"],
  "cta": "Call-to-action explícito"
}`;
}

// Fallback determinístico: gera um brief coerente a partir do tema, sem depender de IA.
function fallbackBrief(type: ContentType, theme: string) {
  const t = (theme || '').trim();
  const temaCurto = t.charAt(0).toUpperCase() + t.slice(1);
  const formato =
    {
      [ContentType.FEED]: 'post no feed',
      [ContentType.REEL]: 'Reel',
      [ContentType.STORY]: 'sequência de stories',
      [ContentType.CAROUSEL]: 'carrossel',
    }[type] || 'post';

  const palavras = t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((p) => p.length > 3)
    .slice(0, 4);
  const hashtags = Array.from(
    new Set([...palavras.map((p) => '#' + p), '#marketingdigital', '#instagram', '#iaparanegocios', '#conteudo'])
  ).slice(0, 6);

  return {
    idea: `${temaCurto}: mostre na prática, com um exemplo real, por que isso importa para quem acompanha.`,
    roteiro:
      `Gancho: uma dor/pergunta sobre "${t}".\n` +
      `Desenvolvimento: 3 pontos objetivos (o quê, por que, como aplicar hoje).\n` +
      `Fechamento: convite para a próxima ação.`,
    caption:
      `${temaCurto} 👇\n\n` +
      `A maioria trava aqui — e não precisava. Separei o essencial pra você aplicar ainda hoje, sem enrolação.\n\n` +
      `Salva esse ${formato} pra não perder e me conta nos comentários: qual parte você vai testar primeiro?`,
    hashtags,
    cta: 'Comenta LINK que eu te mando o passo a passo no direct',
  };
}
