import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/types';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');
    const tipo = searchParams.get('tipo'); // filter by tipo (video/image/carousel/story)

    // Buscar posts reais de instagram_media
    let query = supabase
      .from('instagram_media')
      .select(
        'id, external_media_id, tipo, permalink, caption, thumbnail_url, media_url, publicado_em, alcance, curtidas, comentarios, salvos, ig_produto, origem_dados'
      )
      .order('publicado_em', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      console.error('Erro ao buscar posts:', postsError);
      return NextResponse.json(
        { success: false, error: postsError.message } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Buscar total de posts para paginação
    const { count: totalCount, error: countError } = await supabase
      .from('instagram_media')
      .select('*', { count: 'exact', head: true })
      .eq('origem_dados', 'zernio');

    return NextResponse.json(
      {
        success: true,
        data: posts || [],
        pagination: {
          offset,
          limit,
          total: totalCount || 0,
        },
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Content fetch error:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
