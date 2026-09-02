import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { zernio } from '@/lib/zernio';
import { ApiResponse } from '@/types';

// POST /api/zernio/sync-content - Sincronizar posts/reels/stories do Zernio Analytics
export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // 1. Verificar throttle (120s) via crm_config
    const { data: throttleData } = await supabase
      .from('crm_config')
      .select('valor')
      .eq('chave', 'zernio_content_sync_at')
      .single();

    if (throttleData?.valor) {
      const lastSync = new Date(throttleData.valor);
      const now = new Date();
      const diffSeconds = (now.getTime() - lastSync.getTime()) / 1000;

      if (diffSeconds < 120) {
        return NextResponse.json(
          { success: false, error: `Throttle ativo. Próxima sync em ${Math.ceil(120 - diffSeconds)}s` } as ApiResponse<null>,
          { status: 429 }
        );
      }
    }

    // 2. Chamar GET /analytics do Zernio (todas as plataformas — Central de Marketing multi-canal)
    const { data: analyticsData, error: analyticsError } = await zernio.getAnalytics('', 30);

    if (analyticsError || !analyticsData) {
      console.error('Erro ao buscar analytics do Zernio:', analyticsError);
      return NextResponse.json(
        { success: false, error: analyticsError || 'Erro ao buscar analytics' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // 3. Buscar a conta Instagram no banco (para account_id)
    const { data: account, error: accountError } = await supabase
      .from('zernio_accounts')
      .select('id, account_id')
      .eq('platform', 'instagram')
      .single();

    if (accountError || !account) {
      console.warn('Nenhuma conta Instagram encontrada:', accountError);
      // Continua mesmo sem account (usa null)
    }

    // 4. Upsert de cada post em instagram_media
    const posts = analyticsData.posts || [];
    let postsUpserted = 0;
    let postsError = 0;

    for (const post of posts) {
      try {
        // Mapear campos: Zernio -> instagram_media
        const { error: upsertError } = await supabase
          .from('instagram_media')
          .upsert(
            {
              external_media_id: post._id,
              tipo: post.mediaType || null, // video/image/carousel
              permalink: post.platformPostUrl || null,
              caption: post.content || null,
              thumbnail_url: post.thumbnailUrl || null,
              media_url: null, // Zernio não fornece URL completa de mídia neste endpoint
              publicado_em: post.publishedAt ? new Date(post.publishedAt) : null,
              sincronizado_em: new Date(),
              alcance: post.analytics?.reach || 0,
              curtidas: post.analytics?.likes || 0,
              comentarios: post.analytics?.comments || 0,
              salvos: post.analytics?.saves || 0,
              compartilhamentos: post.analytics?.shares || 0,
              origem_dados: 'zernio',
              ig_produto: post.mediaProductType || 'FEED', // FEED | REELS
              account_id: account?.id || null,
              updated_at: new Date(),
            },
            {
              onConflict: 'external_media_id',
            }
          );

        if (upsertError) {
          console.warn(`Erro ao upsert post ${post._id}:`, upsertError);
          postsError++;
        } else {
          postsUpserted++;
        }
      } catch (err) {
        console.error(`Erro ao processar post ${post._id}:`, err);
        postsError++;
      }
    }

    // 5. Sincronizar stories (se houver account_id válido)
    let storiesUpserted = 0;
    let storiesError = 0;

    if (account?.account_id) {
      const { data: storiesData, error: storiesFetchError } = await zernio.listStories(account.account_id);

      if (storiesFetchError) {
        console.warn('Erro ao buscar stories:', storiesFetchError);
      } else if (storiesData && storiesData.length > 0) {
        for (const story of storiesData) {
          try {
            const { error: upsertError } = await supabase
              .from('instagram_media')
              .upsert(
                {
                  external_media_id: story.id,
                  tipo: story.mediaType || null,
                  permalink: story.permalink || null,
                  caption: null,
                  thumbnail_url: story.thumbnailUrl || null,
                  media_url: story.mediaUrl || null,
                  publicado_em: story.timestamp ? new Date(story.timestamp) : null,
                  sincronizado_em: new Date(),
                  origem_dados: 'zernio',
                  ig_produto: 'STORY',
                  account_id: account?.id || null,
                  updated_at: new Date(),
                },
                {
                  onConflict: 'external_media_id',
                }
              );

            if (upsertError) {
              console.warn(`Erro ao upsert story ${story.id}:`, upsertError);
              storiesError++;
            } else {
              storiesUpserted++;
            }
          } catch (err) {
            console.error(`Erro ao processar story ${story.id}:`, err);
            storiesError++;
          }
        }
      }
    }

    // 6. Guardar resumo em crm_config.zernio_analytics (cache para UI)
    const summaryData = {
      totalPosts: analyticsData.overview?.totalPosts || 0,
      totalReach: analyticsData.overview?.totalReach || 0,
      totalLikes: analyticsData.overview?.totalLikes || 0,
      totalComments: analyticsData.overview?.totalComments || 0,
      totalSaves: analyticsData.overview?.totalSaves || 0,
      followers: 0, // TODO: puxar de outro endpoint se existir
      engagement: 0, // Calculado pela UI
      posts: posts
        .slice(0, 10)
        .map((p) => ({
          id: p._id,
          reach: p.analytics?.reach || 0,
          likes: p.analytics?.likes || 0,
          comments: p.analytics?.comments || 0,
          type: p.mediaType,
        })),
      lastSyncAt: new Date().toISOString(),
    };

    const { error: configError } = await supabase
      .from('crm_config')
      .upsert(
        {
          chave: 'zernio_analytics',
          valor: JSON.stringify(summaryData),
          tipo: 'json',
          updated_at: new Date(),
        },
        {
          onConflict: 'chave',
        }
      );

    if (configError) {
      console.warn('Erro ao guardar summary em crm_config:', configError);
    }

    // 7. Atualizar throttle timestamp
    const { error: throttleError } = await supabase
      .from('crm_config')
      .upsert(
        {
          chave: 'zernio_content_sync_at',
          valor: new Date().toISOString(),
          tipo: 'string',
          updated_at: new Date(),
        },
        {
          onConflict: 'chave',
        }
      );

    if (throttleError) {
      console.warn('Erro ao atualizar throttle:', throttleError);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          postsUpserted,
          postsError,
          storiesUpserted,
          storiesError,
          totalProcessed: postsUpserted + storiesUpserted,
        },
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Sync content error:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
