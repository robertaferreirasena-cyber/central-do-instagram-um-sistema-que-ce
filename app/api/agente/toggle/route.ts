import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: current } = await supabase
      .from('crm_config')
      .select('value')
      .eq('key', 'agente_ativo')
      .single();

    const newValue = current?.value === 'true' ? 'false' : 'true';

    await supabase
      .from('crm_config')
      .update({ value: newValue })
      .eq('key', 'agente_ativo');

    return NextResponse.json(
      {
        success: true,
        agenteAtivo: newValue === 'true',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao toggle agente:', error);
    return NextResponse.json(
      { error: 'Erro ao toggle agente' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('crm_config')
      .select('value')
      .eq('key', 'agente_ativo')
      .single();

    return NextResponse.json(
      {
        success: true,
        agenteAtivo: data?.value === 'true',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao obter status agente:', error);
    return NextResponse.json(
      { error: 'Erro ao obter status', agenteAtivo: false },
      { status: 200 }
    );
  }
}
