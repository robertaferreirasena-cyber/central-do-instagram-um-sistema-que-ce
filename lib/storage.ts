import { supabase } from '@/lib/db';
import { createHash } from 'crypto';

// Gerenciar mídia do Instagram (URLs expiram) - baixar para Supabase Storage
const BUCKET_NAME = 'ig-media';

export async function ensureBucket(): Promise<boolean> {
  if (!supabase) return false;

  try {
    // Tentar criar bucket (se não existir, vai dar erro 409)
    await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'],
    });
    return true;
  } catch (err: any) {
    // Bucket já existe (409) ou outro erro
    if (err.status !== 409) {
      console.error('Erro ao criar bucket:', err);
    }
    return true; // Prosseguir mesmo que já exista
  }
}

export async function downloadMediaToStorage(
  mediaUrl: string,
  mediaType: 'image' | 'video',
  key?: string
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) {
    return { url: null, error: 'Supabase não configurado' };
  }

  try {
    // Garantir bucket existe
    await ensureBucket();

    // Fazer download da mídia
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      return { url: null, error: `Erro ao baixar mídia: ${response.status}` };
    }

    const buffer = await response.arrayBuffer();

    // Gerar nome estável: ig_<sha1(key||url)>.<ext>
    const stableKey = key || mediaUrl;
    const hash = createHash('sha1').update(stableKey + mediaUrl).digest('hex');

    // Inferir extensão
    const contentType = response.headers.get('content-type') || '';
    let ext = 'bin';
    if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) ext = 'jpg';
    else if (contentType.includes('image/png')) ext = 'png';
    else if (contentType.includes('image/gif')) ext = 'gif';
    else if (contentType.includes('video/mp4')) ext = 'mp4';
    else if (contentType.includes('video/quicktime')) ext = 'mov';

    const fileName = `ig_${hash}.${ext}`;

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType,
        upsert: true, // Sobrescrever se já existe
      });

    if (error) {
      return { url: null, error: `Erro ao fazer upload: ${error.message}` };
    }

    // Gerar URL pública
    const { data: publicUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    return { url: publicUrl.publicUrl || null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return { url: null, error: message };
  }
}

export async function deleteMediaFromStorage(fileName: string): Promise<{ success: boolean; error: string | null }> {
  if (!supabase) {
    return { success: false, error: 'Supabase não configurado' };
  }

  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: message };
  }
}
