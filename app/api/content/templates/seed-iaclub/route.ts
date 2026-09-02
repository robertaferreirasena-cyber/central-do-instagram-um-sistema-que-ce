import { NextRequest, NextResponse } from 'next/server';
import { supabase, dbQuery } from '@/lib/db';

const TEMPLATES = [
  {
    nome: 'Carrossel educativo',
    descricao: 'Série de slides com dicas, estratégias ou passo a passo. Capa+slides+CTA, com manchete Archivo pesada.',
    formato: 'Carrossel',
    proporcao: '4:5',
    objetivo: 'Educar e gerar leads',
    marca: 'IA Club',
    campos: [
      { nome: 'Título', descricao: 'Manchete principal (Archivo 900)', tipo: 'text' },
      { nome: 'Gancho', descricao: 'Subtítulo ou hook (Instrument 400)', tipo: 'text' },
      { nome: 'CTA', descricao: 'Call to action (ex: ✦ Comente LINK)', tipo: 'text' },
      { nome: 'Imagens', descricao: 'Troque as imagens dos slides', tipo: 'media' },
    ],
    preview_url: null,
  },
  {
    nome: 'Capa de Reels',
    descricao: 'Frame de abertura 9:16 para vídeos curtos. Manchete grande com etiqueta mono cítrica.',
    formato: 'Reel',
    proporcao: '9:16',
    objetivo: 'Viralizar e gerar interação',
    marca: 'IA Club',
    campos: [
      { nome: 'Título', descricao: 'Frase principal (Archivo 900)', tipo: 'text' },
      { nome: 'Gancho', descricao: 'Subtítulo ou benefício', tipo: 'text' },
      { nome: 'Imagem', descricao: 'Imagem de fundo (pode ficar cinza no preview)', tipo: 'media' },
    ],
    preview_url: null,
  },
  {
    nome: 'Sequência de Stories',
    descricao: 'Série de 3 stories conectados com CTA progressivo e etiqueta mono em cada um.',
    formato: 'Stories',
    proporcao: '9:16',
    objetivo: 'Engajar diretamente',
    marca: 'IA Club',
    campos: [
      { nome: 'Mensagem 1', descricao: 'Texto do primeiro story', tipo: 'text' },
      { nome: 'Mensagem 2', descricao: 'Texto do segundo story', tipo: 'text' },
      { nome: 'Mensagem 3', descricao: 'Texto do terceiro story', tipo: 'text' },
      { nome: 'CTA', descricao: 'Call to action final (ex: ✦ Clique aqui)', tipo: 'text' },
    ],
    preview_url: null,
  },
  {
    nome: 'Post de frase',
    descricao: 'Imagem quadrada com citação Archivo sobre fundo petróleo e 3 pontos cítricos.',
    formato: 'Post',
    proporcao: '1:1',
    objetivo: 'Viralizar e compartilhar',
    marca: 'IA Club',
    campos: [
      { nome: 'Frase', descricao: 'Citação ou pensamento (Archivo 800, itálico)', tipo: 'text' },
      { nome: 'Autor', descricao: 'Quem disse (ex: IA Club)', tipo: 'text' },
      { nome: 'CTA', descricao: 'Texto opcional do CTA', tipo: 'text' },
    ],
    preview_url: null,
  },
  {
    nome: 'Post de lançamento',
    descricao: 'Anúncio visual 4:5 de novo produto/serviço. Gradiente petróleo + cítrico, CTA destacado.',
    formato: 'Post',
    proporcao: '4:5',
    objetivo: 'Converter para venda',
    marca: 'IA Club',
    campos: [
      { nome: 'Título', descricao: 'Nome do lançamento (Archivo 900)', tipo: 'text' },
      { nome: 'Benefício', descricao: 'Maior benefício ou promessa', tipo: 'text' },
      { nome: 'Oferta', descricao: 'Detalhe da oferta ou urgência', tipo: 'text' },
    ],
    preview_url: null,
  },
  {
    nome: 'Post checklist',
    descricao: 'Checklist visual 4:5 com 4+ itens, checkmarks cítricos, fundo gelo.',
    formato: 'Post',
    proporcao: '4:5',
    objetivo: 'Educar e salvar',
    marca: 'IA Club',
    campos: [
      { nome: 'Título', descricao: 'Tema do checklist (Archivo 800)', tipo: 'text' },
      { nome: 'Item 1', descricao: 'Primeiro item', tipo: 'text' },
      { nome: 'Item 2', descricao: 'Segundo item', tipo: 'text' },
      { nome: 'Item 3', descricao: 'Terceiro item', tipo: 'text' },
      { nome: 'Item 4', descricao: 'Quarto item', tipo: 'text' },
    ],
    preview_url: null,
  },
  {
    nome: 'Ferramenta da semana',
    descricao: 'Destaque semanal com etiqueta mono preto, manchete e cursor cítrico. Proporcao flexível.',
    formato: 'Post',
    proporcao: '4:5',
    objetivo: 'Destacar ferramenta/recurso',
    marca: 'IA Club',
    campos: [
      { nome: 'Título', descricao: 'Nome da ferramenta (Archivo 900)', tipo: 'text' },
      { nome: 'Descrição', descricao: 'O que faz e por que usar', tipo: 'text' },
      { nome: 'Link', descricao: 'URL ou CTA (ex: ✦ Acesse agora)', tipo: 'text' },
    ],
    preview_url: null,
  },
  {
    nome: 'Newsletter Café com AI',
    descricao: 'Card cítrico para email/DM com título, gancho e CTA. Fundo #D6F24B, texto petróleo.',
    formato: 'Card',
    proporcao: '4:5',
    objetivo: 'Engajar newsletter',
    marca: 'IA Club',
    campos: [
      { nome: 'Título', descricao: 'Tema do email (ex: As bombas da semana em IA)', tipo: 'text' },
      { nome: 'Descrição', descricao: 'Resumo ou teaser (2-3 linhas)', tipo: 'text' },
      { nome: 'CTA', descricao: 'Botão ou link (ex: ✦ Leia agora)', tipo: 'text' },
    ],
    preview_url: null,
  },
  {
    nome: 'Chamada de ação',
    descricao: '4:5 fundo 100% cítrico com manchete, subtítulo e botão petróleo. 1x por página.',
    formato: 'Post',
    proporcao: '4:5',
    objetivo: 'Converter agora',
    marca: 'IA Club',
    campos: [
      { nome: 'Título', descricao: 'Chamada principal (Archivo 900, cítrico)', tipo: 'text' },
      { nome: 'Descrição', descricao: 'Por que agir agora (tagline)', tipo: 'text' },
      { nome: 'CTA', descricao: 'Botão ou link (ex: ✦ Começar agora)', tipo: 'text' },
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
