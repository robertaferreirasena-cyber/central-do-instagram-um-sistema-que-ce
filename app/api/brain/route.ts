import { NextRequest, NextResponse } from 'next/server';
import { loadBrain, updateBrain, initBrain, Brain, BrainSection } from '@/lib/brain';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('account_id') || 'iaclub-default';

    const brain = await loadBrain(accountId);

    if (!brain) {
      // Tentar inicializar se não existir
      const initialized = await initBrain(accountId);
      if (!initialized) {
        return NextResponse.json(
          { error: 'Brain não encontrado e falha ao inicializar' },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: initialized });
    }

    return NextResponse.json({ data: brain });
  } catch (error) {
    console.error('Erro ao carregar brain:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar brain' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { account_id, secoes } = await request.json();

    if (!account_id || !secoes) {
      return NextResponse.json(
        { error: 'account_id e secoes são obrigatórios' },
        { status: 400 }
      );
    }

    const updated = await updateBrain(account_id, secoes);

    if (!updated) {
      return NextResponse.json(
        { error: 'Falha ao atualizar brain' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Erro ao atualizar brain:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar brain' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  // PATCH é idêntico a POST (merge de seções)
  return POST(request);
}
