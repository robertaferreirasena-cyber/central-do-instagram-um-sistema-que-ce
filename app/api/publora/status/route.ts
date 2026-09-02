import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { publora } from '@/lib/publora';

export async function GET(request: NextRequest) {
  try {
    const asset_id = request.nextUrl.searchParams.get('asset_id');

    if (!asset_id) {
      return NextResponse.json(
        { error: 'asset_id é obrigatório' },
        { status: 400 }
      );
    }

    const { data: asset, error } = await supabase
      .from('content_assets')
      .select('*')
      .eq('id', asset_id)
      .single();

    if (error || !asset) {
      return NextResponse.json(
        { error: 'Asset não encontrado' },
        { status: 404 }
      );
    }

    if (!asset.publora_post_id) {
      return NextResponse.json({
        success: true,
        data: {
          status: asset.status,
          publora_post_id: null,
        },
      });
    }

    const { data: postStatus, error: statusError } = await publora.getPost(
      asset.publora_post_id
    );

    if (statusError) {
      return NextResponse.json(
        { error: statusError },
        { status: 500 }
      );
    }

    if (postStatus?.status !== asset.publora_status) {
      await supabase
        .from('content_assets')
        .update({
          publora_status: postStatus?.status,
          published_url: postStatus?.published_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', asset_id);
    }

    return NextResponse.json({
      success: true,
      data: {
        status: postStatus?.status,
        published_url: postStatus?.published_url,
        created_at: postStatus?.created_at,
        updated_at: postStatus?.updated_at,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
