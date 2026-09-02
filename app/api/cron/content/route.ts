import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { zernio } from '@/lib/zernio';
import { ApiResponse } from '@/types';

// GET /api/cron/content - Cron para sincronizar posts/reels/stories a cada 1 hora
export async function GET(req: NextRequest) {
  try {
    // 1. Validar header de autorização (Vercel Cron)
    const authHeader = req.headers.get('authorization') || '';
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    if (cronSecret) {
      const token = authHeader.slice(7);
      if (token !== cronSecret) {
        return NextResponse.json(
          { success: false, error: 'Forbidden' } as ApiResponse<null>,
          { status: 403 }
        );
      }
    } else {
      console.warn('⚠️ CRON_SECRET não configurado (permitido em dev)');
    }

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // 2. Verificar throttle (120s) via crm_config
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
        console.log(`⏸️ Throttle ativo. Próxima sync em ${Math.ceil(120 - diffSeconds)}s`);
        return NextResponse.json(
          { success: true, data: { throttled: true, nextSyncIn: Math.ceil(120 - diffSeconds) } } as ApiResponse<any>
        );
      }
    }

    // 3. Chamar GET /analytics do Zernio
    const { data: analyticsData, error: analyticsError } = await zernio.getAnalytics('', 30);

    if (analyticsError || !analyticsData) {
      console.error('Erro ao buscar analytics do Zernio:', analyticsError);
      return NextResponse.json(
        { success: false, error: analyticsError || 'Erro ao buscar analytics' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // 4. Buscar a conta Instagram no banco
    const { data: account, error: accountError } = await supabase
      .from('zernio_accounts')
      .select('id, account_id')
      .eq('platform', 'instagram')
      .single();

    if (accountError || !account) {
      console.warn('Nenhuma conta Instagram encontrada:', accountError);
    }

    // 5. Upsert de cada post em instagram_media
    const posts = analyticsData.posts || [];
    let postsUpserted = 0;
    let postsError = 0;

    for (const post of posts) {
      try {
        const { error: upsertError } = await supabase
          .from('instagram_media')
          .upsert(
            {
              external_media_id: post._id,
              tipo: post.mediaType || null,
              permalink: post.platformPostUrl || null,
              caption: post.content || null,
              thumbnail_url: post.thumbnailUrl || null,
              media_url: null,
              publicado_em: post.publishedAt ? new Date(post.publishedAt) : null,
              sincronizado_em: new Date(),
              alcance: post.analytics?.reach || 0,
              curtidas: post.analytics?.likes || 0,
              comentarios: post.analytics?.comments || 0,
              salvos: post.analytics?.saves || 0,
              compartilhamentos: post.analytics?.shares || 0,
              origem_dados: 'zernio',
              ig_produto: post.mediaProductType || 'FEED',
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

    // 6. Sincronizar stories
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

    // 7. Guardar resumo em crm_config (cache para UI)
    const summaryData = {
      totalPosts: analyticsData.overview?.totalPosts || 0,
      totalReach: analyticsData.overview?.totalReach || 0,
      totalLikes: analyticsData.overview?.totalLikes || 0,
      totalComments: analyticsData.overview?.totalComments || 0,
      totalSaves: analyticsData.overview?.totalSaves || 0,
      followers: 0,
      engagement: 0,
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

    // 8. Atualizar throttle timestamp
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
    console.error('❌ Cron content error:', message);
    return NextResponse.json(
      { success: false, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
