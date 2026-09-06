import { NextRequest, NextResponse } from 'next/server';
import { cerebro } from '@/lib/agente';
import { loadBrain } from '@/lib/brain';
import { AutomacaoBlock, AutomacaoFlow } from '@/lib/automacao/types';

interface GerarReq {
  objetivo: 'captar_lead' | 'agendar' | 'vender' | 'tirar_duvida';
  keyword?: string;
  postCaption?: string;
}

function systemPrompt(brainPrompt: string): string {
  return `Você é um especialista em automação de Instagram DM. Cria fluxos de conversa estruturados, com gatilhos claros e CTAs diretos.
Responda com um JSON válido de fluxo de automação. Voz direta, sem hype, tom IA Club.
${brainPrompt}`;
}

function userPrompt(req: GerarReq): string {
  const caption = req.postCaption ? `\nLegenda do post:\n${req.postCaption}` : '';
  return `Crie um fluxo de automação de Instagram completo.
OBJETIVO: ${req.objetivo}
GATILHO: ${req.keyword || 'qualquer comentário'}${caption}

Responda IMEDIATAMENTE com um JSON válido, sem raciocinar antes. Apenas o JSON, formato:
{
  "nome": "<nome do fluxo>",
  "trigger_type": "comment",
  "trigger_value": "${req.keyword || ''}",
  "blocks": [
    { "id": "b_1", "type": "text", "content": "<mensagem pública curta>", "buttons": [] },
    { "id": "b_2", "type": "quick_replies", "content": "<texto inicial do DM>", "buttons": [
      { "label": "<opção 1>", "postback": "opt1" },
      { "label": "<opção 2>", "postback": "opt2" }
    ] },
    { "id": "b_3", "type": "tag", "content": "<nome da tag>", "tag_to_apply": "lead_${req.objetivo}" },
    { "id": "b_4", "type": "text", "content": "<mensagem final com CTA ou WhatsApp>", "buttons": [] },
    { "id": "b_5", "type": "end_flow", "content": "" }
  ]
}

Regras:
- Comece com "type": "text" (resposta pública no post/comment)
- Sempre tenha "type": "quick_replies" com 1-2 botões (vai pro DM)
- Se o objetivo é "captar_lead", inclua "type": "collect_data" pedindo email/telefone
- Se é "agendar", inclua um botão URL pro calendário
- Se é "vender", inclua um botão URL pro checkout ou WhatsApp
- Finalize com "type": "tag" e "type": "end_flow"
- IDs únicos (b_1, b_2, etc)
- Conteúdo direto, sem fluff, máx 150 chars por bloco
`;
}

function fallback(req: GerarReq): AutomacaoFlow {
  return {
    nome: `${req.objetivo === 'captar_lead' ? 'Captar Lead' : req.objetivo === 'agendar' ? 'Agendar Reunião' : 'Vender'} - IA`,
    trigger_type: 'comment',
    trigger_value: req.keyword || '',
    match_mode: 'contains',
    enabled: false,
    blocks: [
      {
        id: 'b_1',
        type: 'text',
        content: 'Obrigado pelo interesse! 🎉',
        buttons: [],
      },
      {
        id: 'b_2',
        type: 'quick_replies',
        content: 'Como posso ajudar?',
        buttons: [
          { label: 'Saber mais', postback: 'mais' },
          { label: 'Contato', postback: 'contato' },
        ],
      },
      {
        id: 'b_3',
        type: 'tag',
        content: `lead_${req.objetivo}`,
        tag_to_apply: `lead_${req.objetivo}`,
      },
      {
        id: 'b_4',
        type: 'end_flow',
        content: '',
      },
    ],
  };
}

async function gerarUmaVez(req: GerarReq, brainPrompt: string) {
  const resp = await cerebro(
    [
      { role: 'system', content: systemPrompt(brainPrompt) },
      { role: 'user', content: userPrompt(req) },
    ],
    2500,
    0.6,
  );

  if (!resp.success || !resp.content) return null;

  try {
    const m = resp.content.match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : JSON.parse(resp.content);

    if (!parsed.nome || !Array.isArray(parsed.blocks) || parsed.blocks.length === 0) {
      return null;
    }

    const blocks: AutomacaoBlock[] = parsed.blocks.map((b: any) => ({
      id: b.id || `b_${Math.random().toString(36).slice(2, 6)}`,
      type: b.type || 'text',
      content: b.content || '',
      buttons: Array.isArray(b.buttons) ? b.buttons : [],
      field_name: b.field_name,
      media_url: b.media_url,
      media_type: b.media_type,
      tag_to_apply: b.tag_to_apply,
      yes_step: b.yes_step,
      no_step: b.no_step,
      wait_seconds: b.wait_seconds,
      wait_minutes: b.wait_minutes,
    }));

    return {
      nome: parsed.nome || `${req.objetivo} - IA`,
      trigger_type: 'comment' as const,
      trigger_value: req.keyword || '',
      match_mode: 'contains' as const,
      enabled: false,
      blocks,
    };
  } catch {
    return null;
  }
}

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body: GerarReq = await req.json();
    if (!body?.objetivo) {
      return NextResponse.json({ error: 'objetivo é obrigatório' }, { status: 400 });
    }

    const brain = await loadBrain('iaclub-default');
    const tv = brain?.secoes?.tom_de_voz;
    const usa = tv?.palavras_que_usamos?.length ? ` Palavras: ${tv.palavras_que_usamos.slice(0, 5).join(', ')}.` : '';
    const brainPrompt = `Marca: IA Club — tom próximo, direto, sem hype.${usa}`;

    for (let t = 0; t < 2; t++) {
      const flow = await gerarUmaVez(body, brainPrompt).catch(() => null);
      if (flow) {
        return NextResponse.json({ success: true, flow });
      }
    }

    return NextResponse.json({
      success: true,
      fallback: true,
      aviso: 'IA retornou um rascunho. Edite antes de ativar.',
      flow: fallback(body),
    });
  } catch (e) {
    console.error('POST /api/automacao/gerar:', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
