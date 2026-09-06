import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function PUT(req: NextRequest, context: any) {
  try {
    const supabase = getSupabase();
    const params = await context.params;
    const id = params.id;
    const body = await req.json();

    const { data, error } = await supabase
      .from('leads')
      .update({
        vendedor_id: body.vendedor_id,
        interesse: body.interesse,
        score: body.score,
        status: body.status,
        resultado: body.resultado,
      })
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
