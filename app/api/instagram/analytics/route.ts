import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { zernio } from '@/lib/zernio';

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

    // Buscar config do Zernio (último cache)
    const { data: configData } = await supabase
      .from('crm_config')
      .select('zernio_analytics')
      .eq('account_id', accountId)
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

    if (configData?.zernio_analytics) {
      analyticsData = configData.zernio_analytics;
    }

    // Buscar KPIs de leads
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
