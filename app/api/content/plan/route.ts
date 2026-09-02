import { NextRequest, NextResponse } from 'next/server';
import { cerebro } from '@/lib/agente';
import { loadBrain, buildSystemPrompt } from '@/lib/brain';
import { supabase } from '@/lib/db';

interface PlanRequest {
  accountId: string;
  horizon: number;
}

interface PostPlan {
  formato: string;
  visual_brief: string;
  copy_text: string;
  hashtags: string[];
  horario_sugerido: string;
  conecta_com: string;
}

interface DiaPlan {
  dia: number;
  data: string;
  funnel_stage: 'atracao' | 'consideracao' | 'decisao';
  papel: 'atrair' | 'nutrir' | 'prova' | 'oferta' | 'fechamento';
  posts: PostPlan[];
}

interface ContentPlan {
  output: DiaPlan[];
  fallback?: boolean;
}

async function gerarPlanoViaIA(
  accountId: string,
  horizon: number,
  brain: any
): Promise<ContentPlan | null> {
  try {
    const systemPrompt = brain ? buildSystemPrompt(brain) : '';

    const userPrompt = `Você é um estrategista de conteúdo para Instagram/TikTok.
Gere um PLANO NARRATIVO de ${horizon} dia(s) com posts estruturados.

Retorne em JSON válido com este schema:
{
  "output": [
    {
      "dia": 1,
      "data": "YYYY-MM-DD",
      "funnel_stage": "atracao|consideracao|decisao",
      "papel": "atrair|nutrir|prova|oferta|fechamento",
      "posts": [
        {
          "formato": "reel|carrossel|post|stories",
          "visual_brief": "o que fotografar/mostrar (concreto)",
          "copy_text": "legenda pronta (máx 300 chars)",
          "hashtags": ["tag1", "tag2", "tag3"],
          "horario_sugerido": "HH:MM",
          "conecta_com": "como conecta com o próximo post"
        }
      ]
    }
  ]
}

IMPORTANTE:
- Cada post é concreto e executável
- visual_brief: instrução visual, não descrição genérica
- copy_text: legenda pronta para usar
- Respeite a marca e tom de voz
- Máx 2 posts por dia`;

    const response = await cerebro(
      [
        {
          role: 'system',
          content: systemPrompt || 'Você é especialista em estratégia de conteúdo.',
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      1500,
      0.7
    );

    if (!response.success || !response.content) {
      return null;
    }

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as ContentPlan;
    return parsed;
  } catch (err) {
    console.error('Erro ao gerar plano via IA:', err);
    return null;
  }
}

function gerarPlanoFallback(horizon: number): ContentPlan {
  const plano: DiaPlan[] = [];
  const today = new Date();

  for (let i = 0; i < horizon; i++) {
    const data = new Date(today);
    data.setDate(data.getDate() + i);
    const dataStr = data.toISOString().split('T')[0];

    const funnels = ['atracao', 'consideracao', 'decisao'] as const;
    const papeis = ['atrair', 'nutrir', 'prova', 'oferta', 'fechamento'] as const;
    const formatos = ['reel', 'carrossel', 'post'] as const;
    const horas = ['09:00', '14:00', '19:00'] as const;

    plano.push({
      dia: i + 1,
      data: dataStr,
      funnel_stage: funnels[i % 3],
      papel: papeis[i % 5],
      posts: [
        {
          formato: formatos[i % 3],
          visual_brief: `Imagem impactante com call-to-action dia ${i + 1}`,
          copy_text: `Conteúdo de engajamento dia ${i + 1}. Não perca essa! 🎯`,
          hashtags: ['#dia' + (i + 1), '#conteudo', '#instagram'],
          horario_sugerido: horas[i % 3],
          conecta_com: 'Próximo post no mesmo dia ou dia seguinte',
        },
      ],
    });
  }

  return { output: plano, fallback: true };
}

export async function POST(request: NextRequest) {
  try {
    const body: PlanRequest = await request.json();
    const { accountId, horizon } = body;

    if (!accountId || !horizon) {
      return NextResponse.json(
        { error: 'accountId e horizon são obrigatórios' },
        { status: 400 }
      );
    }

    if (![1, 7, 15, 30].includes(horizon)) {
      return NextResponse.json(
        { error: 'horizon deve ser 1, 7, 15 ou 30' },
        { status: 400 }
      );
    }

    // Carregar Brain
    let brain = null;
    if (accountId && supabase) {
      try {
        brain = await loadBrain(accountId);
      } catch (err) {
        console.log('Brain não disponível, usando fallback');
      }
    }

    // Tentar gerar via IA
    let plano = await gerarPlanoViaIA(accountId, horizon, brain);

    // Fallback se IA falhar
    if (!plano) {
      console.log('IA falhou, usando fallback determinístico');
      plano = gerarPlanoFallback(horizon);
    }

    // Salvar como content_briefs (rascunho)
    if (supabase && plano.output && plano.output.length > 0) {
      const briefs = plano.output.flatMap(dia =>
        dia.posts.map(post => ({
          account_id: accountId,
          tipo: post.formato,
          titulo: `${dia.papel} - Dia ${dia.dia}`,
          copy_text: post.copy_text,
          visual_brief: post.visual_brief,
          hashtags: post.hashtags.join(', '),
          status: 'rascunho',
          scheduled_at: `${dia.data}T${post.horario_sugerido}:00Z`,
          metadata: {
            funnel_stage: dia.funnel_stage,
            papel: dia.papel,
            conecta_com: post.conecta_com,
          },
        }))
      );

      const { error: insertError } = await supabase
        .from('content_briefs')
        .insert(briefs);

      if (insertError) {
        console.error('Erro ao salvar briefs:', insertError);
      } else {
        console.log(`✅ ${briefs.length} posts salvos como rascunho`);
      }
    }

    return NextResponse.json(plano, { status: 200 });
  } catch (err) {
    console.error('Erro ao gerar plano:', err);
    return NextResponse.json(
      { error: 'Erro ao gerar plano de conteúdo' },
      { status: 500 }
    );
  }
}
