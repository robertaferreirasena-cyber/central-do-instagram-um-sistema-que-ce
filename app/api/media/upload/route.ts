import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const account_id = formData.get('account_id') as string;

    if (!file || !account_id) {
      return NextResponse.json(
        { error: 'Arquivo e account_id são obrigatórios' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${account_id}/${Date.now()}-${file.name}`;

    const { data, error: uploadError } = await supabase.storage
      .from('ig-media')
      .upload(fileName, buffer, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('ig-media').getPublicUrl(data.path);

    const { data: mediaRecord, error: dbError } = await supabase
      .from('media_library')
      .insert({
        account_id,
        url: publicUrl,
        tipo: file.type.startsWith('video') ? 'video' : 'imagem',
        nome: file.name,
        tamanho: file.size,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao registrar mídia no banco:', dbError);
      return NextResponse.json(
        { error: 'Erro ao registrar mídia no banco' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: mediaRecord.id,
        url: publicUrl,
        nome: file.name,
        tipo: mediaRecord.tipo,
        tamanho: file.size,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const account_id = request.nextUrl.searchParams.get('account_id');

    if (!account_id) {
      return NextResponse.json(
        { error: 'account_id é obrigatório' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('media_library')
      .select('*')
      .eq('account_id', account_id)
      .order('criado_em', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao listar mídia' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Erro ao listar mídia:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
