import { NextRequest, NextResponse } from 'next/server';
import { supabase, dbQuery } from '@/lib/db';

const TEMPLATES = [
  {
    nome: 'Carrossel educativo',
    descricao: 'Série de slides com dicas, estratégias ou passo a passo',
    formato: 'Carrossel',
    proporcao: '4:5',
    objetivo: 'Educar e gerar leads',
    marca: 'IA Club',
    campos: [
      { nome: 'Título', descricao: 'Título principal do conteúdo', tipo: 'text' },
      { nome: 'Gancho', descricao: 'Frase de impacto para o gancho', tipo: 'text' },
      { nome: 'CTA', descricao: 'Texto do call to action final', tipo: 'text' },
      { nome: 'Imagens', descricao: 'Troque as imagens do modelo', tipo: 'media' },
    ],
    preview_url: null,
  },
  {
    nome: 'Capa de Reels',
    descricao: 'Frame de abertura impactante para vídeos curtos',
    formato: 'Reel',
    proporcao: '9:16',
    objetivo: 'Viralizar e gerar interação',
    marca: 'IA Club',
    campos: [
      { nome: 'Título', descricao: 'Frase principal da capa', tipo: 'text' },
      { nome: 'Gancho', descricao: 'Hook visual', tipo: 'text' },
      { nome: 'Imagem', descricao: 'Imagem de fundo', tipo: 'media' },
    ],
    preview_url: null,
  },
  {
    nome: 'Sequência de Stories',
    descricao: 'Série de stories conectados com CTA progressivo',
    formato: 'Stories',
    proporcao: '9:16',
    objetivo: 'Engajar diretamente',
    marca: 'IA Club',
    campos: [
      { nome: 'Mensagem 1', descricao: 'Primeiro story', tipo: 'text' },
      { nome: 'Mensagem 2', descricao: 'Segundo story', tipo: 'text' },
      { nome: 'CTA', descricao: 'Call to action final', tipo: 'text' },
    ],
    preview_url: null,
  },
  {
    nome: 'Post de frase',
    descricao: 'Imagem com citação inspiradora e call to action',
    formato: 'Post',
    proporcao: '1:1',
    objetivo: 'Viralizar e compartilhar',
    marca: 'IA Club',
    campos: [
      { nome: 'Frase', descricao: 'Citação ou pensamento inspirador', tipo: 'text' },
      { nome: 'Autor', descricao: 'Quem disse a frase', tipo: 'text' },
      { nome: 'CTA', descricao: 'Texto do call to action', tipo: 'text' },
    ],
    preview_url: null,
  },
  {
    nome: 'Post de lançamento',
    descricao: 'Anúncio visual de novo produto, serviço ou oportunidade',
    formato: 'Post',
    proporcao: '4:5',
    objetivo: 'Converter para venda',
    marca: 'IA Club',
    campos: [
      { nome: 'Título', descricao: 'Nome do lançamento', tipo: 'text' },
      { nome: 'Benefício', descricao: 'Maior benefício ou promessa', tipo: 'text' },
      { nome: 'Oferta', descricao: 'Detalhe da oferta especial', tipo: 'text' },
    ],
    preview_url: null,
  },
  {
    nome: 'Post checklist',
    descricao: 'Checklist visual com itens práticos',
    formato: 'Post',
    proporcao: '4:5',
    objetivo: 'Educar e salvar',
    marca: 'IA Club',
    campos: [
      { nome: 'Título', descricao: 'Tema do checklist', tipo: 'text' },
      { nome: 'Item 1', descricao: 'Primeiro item', tipo: 'text' },
      { nome: 'Item 2', descricao: 'Segundo item', tipo: 'text' },
    ],
    preview_url: null,
  },
];

export async function POST(request: NextRequest) {
  try {
    const accountId = 'default-account';

    for (const template of TEMPLATES) {
      await dbQuery(() =>
        supabase.from('content_templates').upsert(
          [
            {
              account_id: accountId,
              ...template,
            },
          ],
          { onConflict: 'account_id, nome' }
        )
      );
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${TEMPLATES.length} templates`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error seeding templates:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
