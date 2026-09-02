import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { publora } from '@/lib/publora';

interface PublishRequest {
  brief_id: string;
  account_id: string;
  media_urls: string[];
  schedule_for?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PublishRequest = await request.json();
    const { brief_id, account_id, media_urls, schedule_for } = body;

    if (!brief_id || !account_id) {
      return NextResponse.json(
        { error: 'brief_id e account_id são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: brief, error: briefError } = await supabase
      .from('content_briefs')
      .select('*')
      .eq('id', brief_id)
      .single();

    if (briefError || !brief) {
      return NextResponse.json(
        { error: 'Brief não encontrado' },
        { status: 404 }
      );
    }

    if (brief.status !== 'approved') {
      return NextResponse.json(
        { error: 'Brief não está aprovado' },
        { status: 400 }
      );
    }

    const { data: account } = await supabase
      .from('instagram_accounts')
      .select('publora_channel_id')
      .eq('id', account_id)
      .single();

    if (!account?.publora_channel_id) {
      return NextResponse.json(
        {
          error: 'Conta não conectada ao Publora. Configure nas Configurações.',
          needsPubloraConnection: true,
        },
        { status: 400 }
      );
    }

    const { data: publishResult, error: publishError } = await publora.createPost(
      account.publora_channel_id,
      {
        caption: brief.caption,
        media_urls: media_urls || [],
        type: brief.type as any,
        hashtags: brief.hashtags,
        scheduled_at: schedule_for,
      }
    );

    if (publishError) {
      return NextResponse.json(
        { error: publishError },
        { status: 500 }
      );
    }

    const { data: asset, error: assetError } = await supabase
      .from('content_assets')
      .insert({
        brief_id,
        account_id,
        publora_post_id: publishResult?.id,
        publora_status: publishResult?.status,
        published_url: publishResult?.published_url,
        media_urls: media_urls || [],
        status: schedule_for ? 'scheduled' : 'published',
      })
      .select()
      .single();

    if (assetError) {
      console.error('Erro ao registrar asset:', assetError);
    }

    await supabase
      .from('content_briefs')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', brief_id);

    return NextResponse.json({
      success: true,
      data: {
        asset_id: asset?.id,
        publora_post_id: publishResult?.id,
        status: publishResult?.status,
        published_url: publishResult?.published_url,
      },
    });
  } catch (error) {
    console.error('Erro ao publicar:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
