import { NextRequest, NextResponse } from 'next/server';
import { supabase, dbQuery } from '@/lib/db';
import { mapDirectProToFlow } from '@/lib/flowImport';
import fs from 'fs';
import path from 'path';

const DIRECTPRO_FLOWS_DIR = path.join(process.cwd(), 'Base de Conhecimento', 'directpro-fluxos');

async function readDirectProFlows() {
  const flows = [];

  try {
    const files = fs.readdirSync(DIRECTPRO_FLOWS_DIR).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      if (file === 'LEIA-ME.md' || file === '00-pacote-completo.json') continue;

      const filePath = path.join(DIRECTPRO_FLOWS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (data.fluxos && Array.isArray(data.fluxos)) {
        flows.push(...data.fluxos);
      }
    }
  } catch (error) {
    console.error('Erro ao ler fluxos DirectPro:', error);
  }

  return flows;
}

export async function POST(request: NextRequest) {
  try {
    const directProFlows = await readDirectProFlows();

    if (directProFlows.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum fluxo DirectPro encontrado' },
        { status: 404 }
      );
    }

    const importedFlows = [];

    for (const directProFlow of directProFlows) {
      const mappedFlow = mapDirectProToFlow(directProFlow);

      // Verifica se já existe um fluxo com esse nome
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

      // Cria novo fluxo
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
