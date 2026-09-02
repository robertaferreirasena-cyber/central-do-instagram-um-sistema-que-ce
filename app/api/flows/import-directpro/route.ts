import { NextRequest, NextResponse } from 'next/server';
import { supabase, dbQuery } from '@/lib/db';
import { mapDirectProToFlow } from '@/lib/flowImport';
import fluxo01 from '@/data/directpro-fluxos/01-isca-digital.json';
import fluxo02 from '@/data/directpro-fluxos/02-lista-de-espera.json';
import fluxo03 from '@/data/directpro-fluxos/03-cupom-primeira-compra.json';
import fluxo04 from '@/data/directpro-fluxos/04-qualificacao-de-lead.json';
import fluxo05 from '@/data/directpro-fluxos/05-menu-do-story.json';
import fluxo06 from '@/data/directpro-fluxos/06-objecao-de-preco.json';
import fluxo07 from '@/data/directpro-fluxos/07-agendamento.json';
import fluxo08 from '@/data/directpro-fluxos/08-aula-ao-vivo.json';
import fluxo09 from '@/data/directpro-fluxos/09-atendimento-24h.json';
import fluxo10 from '@/data/directpro-fluxos/10-quiz-de-segmentacao.json';

function readDirectProFlows() {
  const flows = [];
  const packages = [fluxo01, fluxo02, fluxo03, fluxo04, fluxo05, fluxo06, fluxo07, fluxo08, fluxo09, fluxo10];

  for (const pkg of packages) {
    if ((pkg as any).fluxos && Array.isArray((pkg as any).fluxos)) {
      flows.push(...(pkg as any).fluxos);
    }
  }

  return flows;
}

export async function POST(request: NextRequest) {
  try {
    const directProFlows = readDirectProFlows();

    if (directProFlows.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum fluxo DirectPro encontrado' },
        { status: 404 }
      );
    }

    const importedFlows = [];

    for (const directProFlow of directProFlows) {
      const mappedFlow = mapDirectProToFlow(directProFlow);

      // Verifica se já existe um fluxo com esse nome (dedup)
      const { data: existing } = await dbQuery(() =>
        supabase
          .from('flows')
          .select('id')
          .eq('nome', mappedFlow.nome)
          .limit(1)
          .single()
      );

      if (existing) {
        // Fluxo já existe, pula
        continue;
      }

      // Cria novo fluxo com edges
      const { data: newFlow } = await dbQuery(() =>
        supabase
          .from('flows')
          .insert([
            {
              nome: mappedFlow.nome,
              descricao: mappedFlow.descricao,
              trigger_type: mappedFlow.trigger_type,
              trigger_value: mappedFlow.trigger_value,
              match_mode: mappedFlow.match_mode,
              steps: mappedFlow.steps,
              edges: mappedFlow.edges,
              enabled: mappedFlow.enabled,
              priority: mappedFlow.priority,
              cooldown_minutes: 5,
            },
          ])
          .select()
          .single()
      );

      if (newFlow) {
        importedFlows.push({
          id: (newFlow as any).id,
          nome: (newFlow as any).nome,
          descricao: (newFlow as any).descricao,
          status: 'rascunho',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Importados ${importedFlows.length} fluxos DirectPro`,
      flows: importedFlows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error importing DirectPro flows:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
