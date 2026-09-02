import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({
        success: true,
        analytics: {
          followers: 0,
          reach: 0,
          likes: 0,
          comments: 0,
          saves: 0,
          engagement: 0,
          posts: [],
        },
        kpis: {
          total: 0,
          qualified: 0,
          para_whatsapp: 0,
          pedidos: 0,
        },
      });
    }

    // 1. Buscar cache do Zernio analytics (crm_config.zernio_analytics)
    const { data: configData } = await supabase
      .from('crm_config')
      .select('valor')
      .eq('chave', 'zernio_analytics')
      .single();

    let analyticsData = {
      followers: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      saves: 0,
      engagement: 0,
      posts: [] as any[],
    };

    // Parsing do cache (stored as JSON string)
    if (configData?.valor) {
      try {
        const parsed = JSON.parse(configData.valor);
        analyticsData = {
          followers: parsed.followers || 0,
          reach: parsed.totalReach || 0,
          likes: parsed.totalLikes || 0,
          comments: parsed.totalComments || 0,
          saves: parsed.totalSaves || 0,
          engagement: parsed.engagement || 0,
          posts: parsed.posts || [],
        };
      } catch (e) {
        console.warn('Erro ao parsear zernio_analytics:', e);
      }
    }

    // 2. Se cache vazio, dispara sync UMA VEZ (via fetch sem await)
    if (!analyticsData.posts || analyticsData.posts.length === 0) {
      // Fire-and-forget: inicialar sync sem bloquear a response
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/zernio/sync-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => console.error('Erro ao disparar sync:', err));
    }

    // 3. Buscar KPIs de leads
    const { data: leadsData } = await supabase
      .from('leads')
      .select('status')
      .eq('account_id', accountId);

    const kpis = {
      total: leadsData?.length || 0,
      qualified: leadsData?.filter((l) => l.status === 'qualificado').length || 0,
      para_whatsapp: leadsData?.filter((l) => l.status === 'pra-whatsapp').length || 0,
      pedidos: leadsData?.filter((l) => l.status === 'pedido').length || 0,
    };

    return NextResponse.json({
      success: true,
      analytics: analyticsData,
      kpis,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
