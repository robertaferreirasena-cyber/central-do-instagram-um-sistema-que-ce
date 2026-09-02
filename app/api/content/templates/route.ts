import { NextRequest, NextResponse } from 'next/server';
import { supabase, dbQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const formato = searchParams.get('formato');
    const objetivo = searchParams.get('objetivo');
    const marca = searchParams.get('marca');

    let query = supabase
      .from('content_templates')
      .select('*')
      .eq('account_id', 'default-account')
      .order('criado_em', { ascending: false });

    if (formato) query = query.eq('formato', formato);
    if (objetivo) query = query.eq('objetivo', objetivo);
    if (marca) query = query.eq('marca', marca);

    const { data, error } = await dbQuery(() => query);

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching templates:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
