import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Durante o build, as variáveis podem estar vazias. Isso é ok - elas serão validadas em runtime.
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null as any;

// Helper para executar queries com tratamento de erro
export async function dbQuery<T>(
  fn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const result = await fn();
    if (result.error) {
      console.error('DB Error:', result.error);
      return { data: null, error: result.error.message };
    }
    return { data: result.data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('DB Query Error:', message);
    return { data: null, error: message };
  }
}
