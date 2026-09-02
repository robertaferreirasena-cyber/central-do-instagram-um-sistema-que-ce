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

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Erro ao gerar conteúdo' },
        { status: 500 }
      );
    }

    let generated;
    try {
      const content = response.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      generated = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (e) {
      return NextResponse.json(
        { error: 'Erro ao processar resposta da IA' },
        { status: 500 }
      );
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
