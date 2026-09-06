import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// POST /api/instagram/upload — sobe uma imagem/vídeo do Direct pro Storage público
// e devolve a URL (o Zernio precisa de uma URL pública pra enviar como attachment).
export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
    }
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const tipo = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : 'file';
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `inbox/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

    const { data, error } = await supabase.storage.from('studio-media').upload(fileName, file, { upsert: true });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from('studio-media').getPublicUrl(data.path);
    return NextResponse.json({ url: urlData.publicUrl, type: tipo });
  } catch (error) {
    console.error('POST /api/instagram/upload:', error);
    return NextResponse.json({ error: 'Falha no upload' }, { status: 500 });
  }
}
