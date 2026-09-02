import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const body = await req.json();

    // Validar campos obrigatórios
    if (!body.nome || !body.onde) {
      return NextResponse.json(
        { success: false, error: 'Nome e "Onde" são obrigatórios' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Inserir automação
    const { data: automacao, error: autoError } = await supabase
      .from('ig_automacoes')
      .insert({
        nome: body.nome,
        formato: body.formato || 'qualquer',
        onde: body.onde,
        gatilho: body.gatilho || '',
        resposta_comentario: body.resposta_comentario || '',
        resposta_dm: body.resposta_dm || '',
        media_id: body.media_id || null,
        match_tipo: body.match_tipo || 'contem',
        ativo: body.ativo || false,
        destino: body.destino || 'nenhum',
        tags: body.tags || '',
        delay_seg: body.delay_seg || 0,
        dm_media_url: body.dm_media_url || null,
        testado: body.testado || false,
        disparos: 0,
        leads_criados: 0,
        created_at: new Date(),
      })
      .select()
      .single();

    if (autoError || !automacao) {
      console.error('Erro ao criar automação:', autoError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar automação' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // Inserir botões se houver
    const botoes = body.botoes || [];
    if (botoes.length > 0) {
      const { error: botaoError } = await supabase
        .from('ig_automacao_botoes')
        .insert(
          botoes.map((botao: any, idx: number) => ({
            automacao_id: automacao.id,
            label: botao.label || '',
            resposta: botao.resposta || '',
            url: botao.url || null,
            tipo: botao.tipo || (botao.url ? 'link' : 'quick'),
            ordem: idx + 1,
          }))
        );

      if (botaoError) {
        console.error('Erro ao criar botões:', botaoError);
      }
    }

    console.log('✅ Automação criada:', automacao.id);

    return NextResponse.json(
      { success: true, data: automacao } as ApiResponse<any>,
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Erro ao salvar automação:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const onde = req.nextUrl.searchParams.get('onde');

    let query = supabase.from('ig_automacoes').select('*');

    if (onde) {
      query = query.eq('onde', onde);
    }

    const { data: automacoes, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // Para cada automação, buscar seus botões
    const autocoesComBotoes = await Promise.all(
      automacoes?.map(async (auto: any) => {
        const { data: botoes } = await supabase
          .from('ig_automacao_botoes')
          .select('*')
          .eq('automacao_id', auto.id)
          .order('ordem', { ascending: true });

        return { ...auto, botoes: botoes || [] };
      }) || []
    );

    return NextResponse.json(
      { success: true, data: autocoesComBotoes } as ApiResponse<any>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Erro ao buscar automações:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const body = await req.json();
    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Atualizar automação
    const { error: updateError } = await supabase
      .from('ig_automacoes')
      .update({
        nome: body.nome,
        formato: body.formato,
        onde: body.onde,
        gatilho: body.gatilho,
        resposta_comentario: body.resposta_comentario,
        resposta_dm: body.resposta_dm,
        media_id: body.media_id,
        match_tipo: body.match_tipo,
        ativo: body.ativo,
        destino: body.destino,
        tags: body.tags,
        delay_seg: body.delay_seg,
        dm_media_url: body.dm_media_url,
        testado: body.testado,
      })
      .eq('id', Number(id));

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // Atualizar botões (delete antigos, insert novos)
    await supabase.from('ig_automacao_botoes').delete().eq('automacao_id', Number(id));

    if (body.botoes && body.botoes.length > 0) {
      await supabase.from('ig_automacao_botoes').insert(
        body.botoes.map((botao: any, idx: number) => ({
          automacao_id: Number(id),
          label: botao.label,
          resposta: botao.resposta,
          url: botao.url || null,
          tipo: botao.tipo || (botao.url ? 'link' : 'quick'),
          ordem: idx + 1,
        }))
      );
    }

    console.log('✅ Automação atualizada:', id);

    return NextResponse.json(
      { success: true, data: { id } } as ApiResponse<any>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Erro ao atualizar automação:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
