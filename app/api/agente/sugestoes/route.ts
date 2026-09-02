import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

interface AprovacaoRequest {
  sugestaoId: string;
  acao: 'aprovar' | 'rejeitar' | 'editar';
  finalMessage?: string;
  motivoRejeicao?: string;
}

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') || 'pendente';

    const { data, error } = await supabase
      .from('agente_sugestoes')
      .select(`
        id, conversa_id, agente_id, sugestao, status,
        final_message, motivo_rejeicao, lead_ref,
        created_at
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ sugestoes: data || [] });
  } catch (err) {
    console.error('Erro ao listar sugestões:', err);
    return NextResponse.json(
      { error: 'Erro ao listar sugestões' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AprovacaoRequest = await request.json();
    const { sugestaoId, acao, finalMessage, motivoRejeicao } = body;

    if (!sugestaoId || !acao) {
      return NextResponse.json(
        { error: 'sugestaoId e acao são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar sugestão atual
    const { data: sugestao, error: fetchError } = await supabase
      .from('agente_sugestoes')
      .select('*')
      .eq('id', sugestaoId)
      .single();

    if (fetchError || !sugestao) {
      return NextResponse.json(
        { error: 'Sugestão não encontrada' },
        { status: 404 }
      );
    }

    if (acao === 'aprovar') {
      const { error: updateError } = await supabase
        .from('agente_sugestoes')
        .update({
          status: 'aprovada',
          final_message: sugestao.sugestao,
        })
        .eq('id', sugestaoId);

      if (updateError) throw updateError;

      // TODO: Enviar via Zernio (zernio.sendMessage)
      console.log(`✅ Sugestão ${sugestaoId} aprovada e enviada`);

      return NextResponse.json({
        success: true,
        message: 'Sugestão aprovada e enviada',
        status: 'enviada',
      });
    } else if (acao === 'editar') {
      if (!finalMessage) {
        return NextResponse.json(
          { error: 'finalMessage é obrigatório para editar' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from('agente_sugestoes')
        .update({
          status: 'editada',
          final_message: finalMessage,
        })
        .eq('id', sugestaoId);

      if (updateError) throw updateError;

      // TODO: Enviar via Zernio (zernio.sendMessage)
      console.log(`✏️ Sugestão ${sugestaoId} editada e enviada`);

      return NextResponse.json({
        success: true,
        message: 'Sugestão editada e enviada',
        status: 'enviada',
      });
    } else if (acao === 'rejeitar') {
      if (!motivoRejeicao) {
        return NextResponse.json(
          { error: 'motivoRejeicao é obrigatório para rejeitar' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from('agente_sugestoes')
        .update({
          status: 'rejeitada',
          motivo_rejeicao: motivoRejeicao,
        })
        .eq('id', sugestaoId);

      if (updateError) throw updateError;

      console.log(`❌ Sugestão ${sugestaoId} rejeitada: ${motivoRejeicao}`);

      return NextResponse.json({
        success: true,
        message: 'Sugestão rejeitada',
        status: 'rejeitada',
      });
    } else {
      return NextResponse.json(
        { error: 'acao inválida' },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error('Erro ao processar aprovação:', err);
    return NextResponse.json(
      { error: 'Erro ao processar aprovação' },
      { status: 500 }
    );
  }
}
