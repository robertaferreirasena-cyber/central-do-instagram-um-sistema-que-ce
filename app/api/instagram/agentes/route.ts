import { NextRequest, NextResponse } from 'next/server';
import {
  listarAgentes,
  criarAgente,
  atualizarAgente,
  deletarAgente,
  type Agent,
} from '@/lib/agente';
import { ApiResponse } from '@/types';

// GET - Listar agentes
export async function GET(req: NextRequest) {
  try {
    const agentes = await listarAgentes();
    return NextResponse.json(
      { success: true, data: agentes } as ApiResponse<Agent[]>,
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// POST - Criar agente
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const agente: Agent = {
      nome: body.nome,
      persona: body.persona,
      funcao: body.funcao,
      instrucoes: body.instrucoes || '',
      ativo: body.ativo !== false,
    };

    const criado = await criarAgente(agente);
    if (!criado) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar agente' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: criado } as ApiResponse<Agent>,
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 400 }
    );
  }
}

// PUT - Atualizar agente
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID obrigatório' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const atualizado = await atualizarAgente(id, updates);
    if (!atualizado) {
      return NextResponse.json(
        { success: false, error: 'Agente não encontrado' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: atualizado } as ApiResponse<Agent>,
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 400 }
    );
  }
}

// DELETE - Deletar agente
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID obrigatório' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const sucesso = await deletarAgente(parseInt(id));
    if (!sucesso) {
      return NextResponse.json(
        { success: false, error: 'Agente não encontrado' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: { deleted: true } } as ApiResponse<{ deleted: boolean }>,
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 400 }
    );
  }
}
