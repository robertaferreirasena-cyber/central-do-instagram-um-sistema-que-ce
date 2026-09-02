import { supabase } from './db';

// As tabelas de CONTEUDO (content_briefs, content_calendar_items, content_campaigns,
// media_library) usam account_id UUID com FK para instagram_accounts(id) — diferente do
// tenant TEXT 'default-account' usado por zernio/flows/templates. Este helper resolve o
// UUID da conta de Instagram conectada (single-tenant), com cache e fallback.
let _cached: string | null = null;

const FALLBACK_CONTENT_ACCOUNT_ID = '84391c32-d32b-41f1-a8f0-67f929c9fb0b'; // iaclubcomunidade

export async function getContentAccountId(): Promise<string> {
  if (_cached) return _cached;
  try {
    if (!supabase) return FALLBACK_CONTENT_ACCOUNT_ID;
    const { data } = await supabase
      .from('instagram_accounts')
      .select('id')
      .eq('status', 'connected')
      .limit(1)
      .maybeSingle();
    _cached = ((data as any)?.id as string) || FALLBACK_CONTENT_ACCOUNT_ID;
    return _cached;
  } catch {
    return FALLBACK_CONTENT_ACCOUNT_ID;
  }
}
