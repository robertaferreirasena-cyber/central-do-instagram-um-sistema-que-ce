import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { cerebro } from "@/lib/agente";
import { loadBrain, buildSystemPrompt } from "@/lib/brain";

interface GenerateRequest {
  templateId: string;
  briefing?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { templateId, briefing }: GenerateRequest = await req.json();

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId é obrigatório" },
        { status: 400 }
      );
    }

    // 1. Carregar template do banco
    const { data: template, error: templateError } = await supabase
      .from("studio_templates")
      .select("template_json, name")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    // 2. Extrair elementos text do slide[0]
    const slide = template.template_json?.slides?.[0];
    if (!slide) {
      return NextResponse.json(
        { error: "Template sem slides" },
        { status: 400 }
      );
    }

    const textElements = slide.elements
      .filter((el: any) => el.element_type === "text")
      .map((el: any) => el.content || "")
      .filter((text: string) => text.trim());

    // 3. Carregar Brain do IA Club
    const brain = await loadBrain("iaclub-default");
    let systemPrompt = "Você é um gerador de conteúdo para Instagram.";
    if (brain) {
      systemPrompt = buildSystemPrompt(
        brain,
        "Gere textos curtos para cada elemento de um post: handle/etiqueta, manchete, corpo, CTA, etc. Sempre no tom IA Club, conciso, sem HTML."
      );
    }

    // 4. Montar prompt estruturado
    const prompt = buildGeneratePrompt(
      template.name,
      textElements.length,
      briefing
    );

    // 5. Chamar IA
    const response = await cerebro(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      1024,
      0.7
    );

    // 6. Fallback determinístico se IA falhar
    if (!response.success || !response.content) {
      return NextResponse.json({
        success: true,
        fallback: true,
        aviso: response.error || "IA indisponível — usando fallback",
        data: fallbackGeneration(textElements.length, briefing),
      });
    }

    // 7. Parse resposta
    let generated;
    try {
      const content = response.content || "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      generated = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (e) {
      return NextResponse.json({
        success: true,
        fallback: true,
        aviso: "Resposta da IA fora do formato — usando fallback",
        data: fallbackGeneration(textElements.length, briefing),
      });
    }

    // 8. Validar e retornar
    const texts = Array.isArray(generated.texts)
      ? generated.texts.slice(0, textElements.length)
      : [generated.text || ""];

    // Preencer com fallback se não tiver suficientes
    while (texts.length < textElements.length) {
      texts.push(`Texto ${texts.length + 1}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        texts,
        caption: generated.caption || "#iaclubedu",
        hashtags: Array.isArray(generated.hashtags)
          ? generated.hashtags
          : ["#iaclubedu"],
      },
    });
  } catch (error) {
    console.error("POST /api/studio/generate:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function buildGeneratePrompt(
  templateName: string,
  textElementCount: number,
  briefing?: string
): string {
  return `Gere conteúdo para o template "${templateName}" com ${textElementCount} elementos de texto.
${briefing ? `Briefing: ${briefing}` : ""}

Retorne um JSON com:
{
  "texts": ["texto1", "texto2", ...],
  "caption": "Legenda para Instagram (max 2200 chars)",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}

IMPORTANTE:
- texts deve ter exatamente ${textElementCount} strings
- Cada texto deve ser curto, impactante, sem HTML
- Caption deve ser envolvente, chamar ação nos comentários
- Hashtags relevantes para IA, educação e negócios
- Sempre em português`;
}

function fallbackGeneration(count: number, briefing?: string) {
  const tema = briefing || "IA Club";
  const base = `Conteúdo ${tema}`;

  return {
    texts: Array.from({ length: count }, (_, i) => {
      const labels = [
        "@iaclubedu • conteúdo",
        "Manchete impactante",
        "Desenvolvemos isso aqui",
        "Chama nos comentários",
      ];
      return labels[i % labels.length] || `Texto ${i + 1}`;
    }),
    caption: `${base} 👇\n\nEssencial para quem quer escalar com inteligência. Salva e comenta o que você ia tentar primeiro! 💡\n\n#iaclubedu #contentmarketing #marketingdigital`,
    hashtags: [
      "#iaclubedu",
      "#marketingdigital",
      "#contentstrategy",
      "#negociosdigitais",
      "#entrepreneurship",
    ],
  };
}
