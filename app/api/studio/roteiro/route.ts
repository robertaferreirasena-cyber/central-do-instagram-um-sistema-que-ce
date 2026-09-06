import { NextRequest, NextResponse } from "next/server";
import { cerebro } from "@/lib/agente";
import { loadBrain, buildSystemPrompt } from "@/lib/brain";
import { gerarComClaude, claudeLocalDisponivel } from "@/lib/claudeLocal";

export const runtime = "nodejs"; // precisa de child_process pro Claude local

// Chama a IA: MOTOR CLAUDE LOCAL primeiro (o mesmo que a chefe roda; só em dev),
// e cai no NVIDIA (cerebro) como fallback — inclusive na Vercel (sem CLI).
async function chamarIA(system: string, user: string): Promise<string | null> {
  if (claudeLocalDisponivel()) {
    const c = await gerarComClaude(user, { system, model: "sonnet", timeoutMs: 90000 });
    if (c && c.trim()) return c;
  }
  const resp = await cerebro(
    [{ role: "system", content: system }, { role: "user", content: user }],
    3800,
    0.8,
  );
  return resp.success ? resp.content || null : null;
}

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
  return `Você é a EDITORA de conteúdo do IA Club — comunidade de IA APLICADA pra empreendedores brasileiros. Escreve carrossel de Instagram no nível de storytelling de negócio (referência: Tallis Gomes): específico, adulto, faz PENSAR e SENTIR.

REGRA DE OURO: o conteúdo NÃO é sobre a tecnologia/notícia — é sobre o EMPREENDEDOR e o negócio DELE. A tecnologia é só o veículo. Todo slide fala com ele, da dor e do desejo íntimo dele (sair do operacional, previsibilidade, liberdade, não ficar pra trás). Nunca venda a ferramenta — venda a transformação do negócio dele.

FÓRMULA (distribua ao longo dos slides): 1) gancho na dor/identidade dele; 2) verdade desconfortável; 3) mecanismo/história com insight (analogia, caso, número real); 4) conecta ("é exatamente onde você está"); 5) gatilho (o que mudou agora — aqui entra a notícia/tecnologia); 6) o que está em jogo (MEDO do concorrente sair na frente / janela fechando + DESEJO de entregar como uma equipe); 7) transformação sentida (cena concreta do "depois"); 8) CTA-ponte pro IA Club (sem hype, com prova +500 membros e garantia 7 dias).

ESTRUTURA (skill carrossel-instagram): slide 1 (capa) = gancho que funciona sozinho; slide 2 = SEGUNDO gancho independente (o Instagram re-serve a partir dele); slides do meio = 1 ideia densa cada; slide ~5 = quebra de padrão (frase de impacto/dado); último = CTA-ponte. Escolha 1 arquétipo forte (revelação, diagnóstico, jornada, provocativo, comparativo) e mantenha o arco do começo ao fim.

HUMANIZADOR — escreva como GENTE, não como IA. PROIBIDO (volta pra reescrita): travessão longo — ou – (use vírgula, ponto ou dois-pontos); "não é X, é Y" e variantes (afirme direto); clichê vazio ("muda o jogo", "divisor de águas", "num mundo cada vez mais", "revolucione"); promessa vaga sem número/mecanismo; inflar importância ("marca um momento histórico"); gerúndio acessório no fim ("refletindo", "sublinhando"); atribuição vaga ("especialistas dizem"); cópula rebuscada ("serve como/atua como" — use "é/tem"); META (falar do próprio post: "nesse post", "no próximo slide", "vou te mostrar"); caveman/telegráfico (frase sem artigo/verbo); voz de coach com dedo apontado ("você precisa", "acorda"); pedido de engajamento genérico ("salve agora"). Frases COMPLETAS e naturais, leia em voz alta. Nunca invente estatística; se não tiver número real, dê mecanismo/passo concreto.

OUTROS PROIBIDOS: abrir com "a IA X foi lançada"; explicar tecnologia por explicar; placeholder; jargão técnico (LLM, prompt engineering); "fique rico/renda garantida". Voz PT-BR, contrações (pra, tá, dá pra). Slide de miolo com 40-90 palavras de substância REAL.

IMAGEM (regra de ouro): a imagem CONTA e REFORÇA a narrativa do slide, nunca é enfeite. Para cada slide decida se uma imagem reforça o argumento. Use imagem em POUCOS slides: a capa sempre, e no miolo no máximo 2 (os de VIRADA ou de PROVA). Quando usar, a busca é uma CENA ou METÁFORA VISUAL CONCRETA do que ESTE slide diz — ex.: slide sobre o cliente desistir da compra → "frustrated person closing laptop at night"; slide sobre operacional te prendendo → "tired business owner buried in paperwork". NUNCA o print literal da tecnologia, NUNCA termo genérico ("business", "technology", "success", "office"). Escreva a busca em INGLÊS (2 a 6 palavras, achando melhor no banco). Se o slide for abstrato e nenhuma imagem reforçar de verdade, marque usar=false — melhor sem imagem do que com imagem genérica.
${brainPrompt}`;
}

function userPrompt(r: RoteiroReq, n: number): string {
  return `Crie um carrossel de Instagram COMPLETO.
TEMA: ${r.tema}
OBJETIVO: ${r.objetivo || "seguir"} (define o CTA e o tom)
ARQUÉTIPO: ${r.arquetipo || "escolha o mais forte para o tema"}
QUANTIDADE DE SLIDES: ${n}

Responda IMEDIATAMENTE com o JSON, sem raciocinar, sem explicar e sem texto antes ou depois. SOMENTE um JSON válido, no formato:
{
  "arquetipo": "<arquétipo usado>",
  "objetivo": "<objetivo>",
  "slides": [
    { "titulo": "<manchete curta do slide>", "corpo": "<corpo do slide, 40-80 palavras nos slides de miolo>", "tipo": "<um de: capa | conteudo | numero | citacao | lista | comparativo | cta>", "imagem": { "usar": true, "papel": "<PT curto: o que a imagem mostra e como reforça ESTE ponto>", "busca": "<EN: cena/metáfora visual concreta, 2-6 palavras>" } }
  ],
  "caption": "<legenda envolvente pro post, chama ação nos comentários, sem clichê>",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}
Exatamente ${n} slides. Português. Sem travessão longo.
Cada slide precisa de um ângulo ESPECÍFICO do tema (um exemplo, um passo, um erro comum, um dado concreto) — NADA de frase genérica que serviria pra qualquer assunto, NADA de "Ponto 1/Texto aqui". Se não souber um número real, dê um mecanismo ou passo concreto.
Classifique o "tipo" de cada slide: o slide 1 é sempre "capa"; o último é "cta"; use "numero" se o slide gira em torno de uma estatística/percentual; "citacao" para uma frase de efeito curta; "lista" para enumeração de itens; "comparativo" para antes/depois; senão "conteudo".
Em "imagem": a capa sempre tem imagem que reforça o gancho; no miolo escolha no MÁXIMO 2 slides (os de virada/prova) com usar=true e o resto usar=false; a "busca" é uma cena/metáfora visual concreta em inglês que REFORÇA o argumento daquele slide (nunca genérica, nunca o print da ferramenta).`;
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

const TIPOS = ["capa", "conteudo", "numero", "citacao", "lista", "comparativo", "cta"];

// Conceito de imagem POR slide: a imagem deve reforçar a narrativa daquele slide.
// A capa sempre reforça o gancho; o CTA nunca leva imagem; no miolo respeita o que
// a IA marcou (usar=false quando nenhuma imagem reforça de verdade).
function normalizaImagem(im: any, i: number, total: number): { usar: boolean; papel: string; busca: string } {
  const ehCta = i === total - 1;
  const busca = String(im?.busca || "").trim().slice(0, 120);
  const papel = String(im?.papel || "").trim().slice(0, 200);
  // capa sempre usa; cta nunca; miolo segue a IA (default false se sem busca)
  const usar = ehCta ? false : i === 0 ? true : Boolean(im?.usar) && busca.length > 0;
  return { usar, papel, busca };
}

// Rejeita SÓ placeholder literal (a saída real do modelo, mesmo imperfeita, é melhor que o fallback).
function ehGenerico(slides: { titulo: string; corpo: string }[]): boolean {
  const junto = slides.map((s) => `${s.titulo} ${s.corpo}`).join(" ").toLowerCase();
  return /\bponto \d\b|texto aqui|lorem ipsum/i.test(junto);
}

function normaliza(parsed: any, n: number) {
  let slides = Array.isArray(parsed?.slides) ? parsed.slides : [];
  slides = slides
    .filter((s: any) => s && (s.titulo || s.corpo))
    .map((s: any, i: number, arr: any[]) => ({
      titulo: String(s.titulo || "").trim(),
      corpo: String(s.corpo || "").trim(),
      tipo: TIPOS.includes(String(s.tipo)) ? String(s.tipo) : i === 0 ? "capa" : i === arr.length - 1 ? "cta" : "conteudo",
      imagem: normalizaImagem(s.imagem, i, arr.length),
    }))
    .slice(0, n);
  return slides;
}

// Uma tentativa: chama a IA, parseia, valida. Retorna os dados ou null.
async function gerarUmaVez(body: RoteiroReq, n: number, brainPrompt: string) {
  // Claude local primeiro; fallback NVIDIA. maxTokens alto no fallback pra não truncar o JSON.
  const content = await chamarIA(systemPrompt(brainPrompt), userPrompt(body, n));
  if (!content) return null;
  let parsed: any;
  try {
    const m = content.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : JSON.parse(content);
  } catch {
    return null;
  }
  const slides = normaliza(parsed, n);
  if (slides.length < 3 || ehGenerico(slides)) return null;
  return {
    arquetipo: parsed.arquetipo || body.arquetipo || "educativo",
    objetivo: parsed.objetivo || body.objetivo || "seguir",
    slides,
    caption: parsed.caption || "",
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 8) : [],
  };
}

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body: RoteiroReq = await req.json();
    if (!body?.tema?.trim()) {
      return NextResponse.json({ error: "tema é obrigatório" }, { status: 400 });
    }
    const n = Math.min(Math.max(body.numSlides || 7, 3), 12);

    // Contexto de marca + RAIO-X DA PERSONA (o conteúdo é sempre modelado pra ela).
    const brain = await loadBrain("iaclub-default");
    const tv = brain?.secoes?.tom_de_voz;
    const pub: any = brain?.secoes?.publico || {};
    const usa = tv?.palavras_que_usamos?.length ? ` Palavras da marca: ${tv.palavras_que_usamos.slice(0, 8).join(", ")}.` : "";
    const evita = tv?.palavras_que_evitamos?.length ? ` Evite: ${tv.palavras_que_evitamos.slice(0, 8).join(", ")}.` : "";
    const desejos = pub.desejos_intimos?.length ? ` DESEJOS ÍNTIMOS dele: ${pub.desejos_intimos.slice(0, 4).join("; ")}.` : "";
    const medos = pub.medos_profundos?.length ? ` MEDOS: ${pub.medos_profundos.slice(0, 3).join("; ")}.` : "";
    const dores = pub.pain_points?.length ? ` DORES: ${pub.pain_points.slice(0, 3).join("; ")}.` : "";
    const brainPrompt = `PERSONA (fale SEMPRE com ele, do negócio DELE): ${pub.persona || "empreendedor brasileiro, dono de negócio pequeno, não-técnico"}.${desejos}${medos}${dores} A PONTE no CTA é o IA Club (comunidade de IA aplicada, fundada por Allessandra Sinisgalli; anual R$697/12x R$65 · mensal R$97 · garantia 7 dias · +500 membros · isca newsletter Café com AI).${usa}${evita}`;

    // 2 tentativas antes do fallback; a 1ª quase sempre resolve.
    for (let t = 0; t < 2; t++) {
      const data = await gerarUmaVez(body, n, brainPrompt).catch(() => null);
      if (data) return NextResponse.json({ success: true, data });
    }
    return NextResponse.json({ success: true, fallback: true, aviso: "A IA gratuita oscilou — rascunho de fallback. Tente gerar de novo.", data: fallback(body, n) });
  } catch (e) {
    console.error("POST /api/studio/roteiro:", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
