import { NextRequest, NextResponse } from "next/server";
import { cerebro } from "@/lib/agente";
import { loadBrain, buildSystemPrompt } from "@/lib/brain";

// Habilidade de criação de conteúdo (metodologia carrossel-instagram / ibe.IA),
// adaptada para a Central IA Club. A IA atua como EDITORA: organiza e empacota,
// não inventa casos/dados; densidade 40-80 palavras; humanizador anti-IA; voz PT-BR.

interface RoteiroReq {
  tema: string;
  objetivo?: "salvar" | "compartilhar" | "seguir" | "vender";
  arquetipo?: string;
  numSlides?: number;
}

function systemPrompt(brainPrompt: string): string {
  const metodo = `Você é uma EDITORA estratégica de conteúdo para Instagram (não criadora).
REGRAS NÃO-NEGOCIÁVEIS:
- Você organiza e empacota; NUNCA invente casos, alunos, números ou opiniões falsas. Se faltar dado real, use afirmações gerais verdadeiras, nunca fabrique estatística.
- DENSIDADE: cada slide de miolo tem 40 a 80 palavras. Capa (slide 1) e CTA (último) podem ser mais curtos, mas nunca preguiçosos.
- ESTRUTURA: slide 1 = capa (gancho forte, frase completa e natural, sem "arrasta"). slide 2 = re-hook (funciona como segunda capa). slides do meio = uma ideia por slide, terminando com micro-gancho. último slide = CTA específico conforme o objetivo.
- HUMANIZADOR ANTI-IA: proibido travessão longo (—), proibido "não é X, é Y", proibido voz de coach, proibido meta ("no próximo slide vou..."), proibido clichê ("isso vai mudar sua vida", "num mundo cada vez mais digital"). Quebra de linha por sentença. Frases completas e naturais, não telegrafadas.
- VOZ: PT-BR direto, contrações (pra, tá, dá pra), "você"/"a gente", oralidade escrita, sem corporativês, sem emoji decorativo.`;
  return `${metodo}\n\nMARCA/VOZ DO CLIENTE (use como referência de tom, temas e termos aprovados):\n${brainPrompt}`;
}

function userPrompt(r: RoteiroReq, n: number): string {
  return `Crie um carrossel de Instagram COMPLETO.
TEMA: ${r.tema}
OBJETIVO: ${r.objetivo || "seguir"} (define o CTA e o tom)
ARQUÉTIPO: ${r.arquetipo || "escolha o mais forte para o tema"}
QUANTIDADE DE SLIDES: ${n}

Retorne SOMENTE um JSON válido, sem texto fora do JSON, no formato:
{
  "arquetipo": "<arquétipo usado>",
  "objetivo": "<objetivo>",
  "slides": [
    { "titulo": "<manchete curta do slide>", "corpo": "<corpo do slide, 40-80 palavras nos slides de miolo>", "tipo": "<um de: capa | conteudo | numero | citacao | lista | comparativo | cta>" }
  ],
  "caption": "<legenda envolvente pro post, chama ação nos comentários, sem clichê>",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}
Exatamente ${n} slides. Português. Sem travessão longo.
Classifique o "tipo" de cada slide: o slide 1 é sempre "capa"; o último é "cta"; use "numero" se o slide gira em torno de uma estatística/percentual; "citacao" para uma frase de efeito curta; "lista" para enumeração de itens; "comparativo" para antes/depois; senão "conteudo".`;
}

function fallback(r: RoteiroReq, n: number) {
  const tema = r.tema || "IA aplicada ao seu negócio";
  const slides = [] as { titulo: string; corpo: string; tipo: string }[];
  slides.push({ titulo: tema, corpo: "", tipo: "capa" });
  for (let i = 1; i < n - 1; i++) {
    slides.push({
      titulo: `Ponto ${i}`,
      corpo: `Aqui entra uma ideia concreta sobre ${tema}. Traga um exemplo real, um passo prático ou um dado verdadeiro. Esse é um rascunho de fallback: edite com o material do cliente antes de publicar.`,
      tipo: "conteudo",
    });
  }
  slides.push({ titulo: "Bora?", corpo: "Salva esse carrossel e comenta o que você vai testar primeiro.", tipo: "cta" });
  return {
    arquetipo: r.arquetipo || "educativo",
    objetivo: r.objetivo || "seguir",
    slides,
    caption: `${tema} 👇\n\nSalva pra aplicar depois e comenta o que faz sentido pro seu momento.`,
    hashtags: ["#iaclub", "#inteligenciaartificial", "#conteudo", "#marketingdigital", "#produtividade"],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: RoteiroReq = await req.json();
    if (!body?.tema?.trim()) {
      return NextResponse.json({ error: "tema é obrigatório" }, { status: 400 });
    }
    const n = Math.min(Math.max(body.numSlides || 7, 3), 12);

    const brain = await loadBrain("iaclub-default");
    const brainPrompt = brain
      ? buildSystemPrompt(brain, "Gere conteúdo de carrossel no tom e nos temas da marca.")
      : "Marca: IA Club — comunidade de IA aplicada. Tom próximo, direto, sem hype.";

    const resp = await cerebro(
      [
        { role: "system", content: systemPrompt(brainPrompt) },
        { role: "user", content: userPrompt(body, n) },
      ],
      2048,
      0.75,
    );

    if (!resp.success || !resp.content) {
      return NextResponse.json({ success: true, fallback: true, aviso: resp.error || "IA indisponível", data: fallback(body, n) });
    }

    let parsed: any;
    try {
      const m = resp.content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : JSON.parse(resp.content);
    } catch {
      return NextResponse.json({ success: true, fallback: true, aviso: "Resposta fora do formato", data: fallback(body, n) });
    }

    // valida e normaliza
    let slides = Array.isArray(parsed.slides) ? parsed.slides : [];
    const TIPOS = ["capa", "conteudo", "numero", "citacao", "lista", "comparativo", "cta"];
    slides = slides
      .filter((s: any) => s && (s.titulo || s.corpo))
      .map((s: any, i: number, arr: any[]) => ({
        titulo: String(s.titulo || "").trim(),
        corpo: String(s.corpo || "").trim(),
        tipo: TIPOS.includes(String(s.tipo)) ? String(s.tipo) : (i === 0 ? "capa" : i === arr.length - 1 ? "cta" : "conteudo"),
      }))
      .slice(0, n);
    if (slides.length < 3) {
      return NextResponse.json({ success: true, fallback: true, aviso: "IA retornou poucos slides", data: fallback(body, n) });
    }

    return NextResponse.json({
      success: true,
      data: {
        arquetipo: parsed.arquetipo || body.arquetipo || "educativo",
        objetivo: parsed.objetivo || body.objetivo || "seguir",
        slides,
        caption: parsed.caption || "",
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 8) : [],
      },
    });
  } catch (e) {
    console.error("POST /api/studio/roteiro:", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
