import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { publora } from '@/lib/publora';
import { telegram } from '@/lib/telegram';
import { ContentStatus, ApiResponse } from '@/types';

// POST - Aprovar e publicar brief
export async function POST(
  req: NextRequest,
  context: any
) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as { approved_by: string };

    // 1. Atualizar brief para aprovado
    const { data: brief, error: fetchError } = await supabase
      .from('content_briefs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !brief) {
      return NextResponse.json(
        { success: false, error: 'Brief não encontrado' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    const updateResult = await supabase
      .from('content_briefs')
      .update({
        status: ContentStatus.APPROVED,
        approved_by: body.approved_by,
        approved_at: new Date(),
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateResult.error) {
      return NextResponse.json(
        { success: false, error: updateResult.error.message } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // 2. Se agendado para agora, publicar via Publora
    const now = new Date();
    const scheduledAt = new Date(brief.scheduled_at);
    const shouldPublishNow = scheduledAt <= now;

    if (shouldPublishNow) {
      // Buscar account_id para Publora
      const { data: account } = await supabase
        .from('instagram_accounts')
        .select('publora_channel_id')
        .eq('id', brief.account_id)
        .single();

      if (!account?.publora_channel_id) {
        return NextResponse.json(
          { success: false, error: 'Publora não está configurado para esta conta' } as ApiResponse<null>,
          { status: 400 }
        );
      }

      // Publicar
      const publishResult = await publora.createPost(account.publora_channel_id, {
        caption: brief.caption,
        media_urls: [], // TODO: implementar upload de mídia
        type: brief.type,
        hashtags: brief.hashtags,
      });

      if (publishResult.error) {
        // Registrar erro, mas continuar
        await supabase
          .from('content_briefs')
          .update({
            status: ContentStatus.FAILED,
            error_message: publishResult.error,
          })
          .eq('id', id);

        // Notificar sobre erro de publicação
        await telegram.notifyPublished({
          post_type: brief.type,
          error: publishResult.error,
        });

        return NextResponse.json(
          { success: false, error: publishResult.error } as ApiResponse<null>,
          { status: 400 }
        );
      }

      // Criar asset e atualizar status
      const assetResult = await supabase.from('content_assets').insert([
        {
          brief_id: id,
          account_id: brief.account_id,
          publora_post_id: publishResult.data?.id,
          publora_status: publishResult.data?.status,
          published_url: publishResult.data?.published_url,
          media_urls: [],
          status: ContentStatus.PUBLISHED,
          published_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      if (assetResult.error) {
        console.error('Erro ao criar asset:', assetResult.error);
      }

      // Atualizar brief status
      await supabase
        .from('content_briefs')
        .update({ status: ContentStatus.PUBLISHED })
        .eq('id', id);

      // Notificar sobre publicação
      await telegram.notifyPublished({
        post_type: brief.type,
        published_url: publishResult.data?.published_url,
      });
    } else {
      // Apenas agendar para depois
      await supabase
        .from('content_briefs')
        .update({ status: ContentStatus.SCHEDULED })
        .eq('id', id);
    }

    return NextResponse.json({ success: true, data: { published: shouldPublishNow } } as ApiResponse<any>);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status: 500 });
  }
}
