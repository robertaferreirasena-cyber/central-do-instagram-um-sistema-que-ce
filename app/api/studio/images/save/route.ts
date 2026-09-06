import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const runtime = "nodejs";

// Baixa uma imagem da web (resultado da busca) e SALVA no nosso bucket studio-media,
// junto de um sidecar .json com a PROVENIÊNCIA (autor/licença/fonte/banco).
// Regra de segurança: uso AUTOMÁTICO pelo agente exige crédito (autor+licença);
// sem isso, bloqueia — só salva sem crédito num clique MANUAL da pessoa.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, auto } = body;
    const credit = {
      bank: String(body.bank || "").slice(0, 40),
      title: String(body.title || "").slice(0, 200),
      creator: String(body.creator || "").slice(0, 120),
      license: String(body.license || "").slice(0, 80),
      source: String(body.source || "").slice(0, 400),
    };
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "url http(s) é obrigatória" }, { status: 400 });
    }
    // Trava de proveniência: no fluxo automático, sem autor+licença não salva.
    if (auto && (!credit.creator || !credit.license)) {
      return NextResponse.json(
        { error: "Uso automático bloqueado: imagem sem autor/licença. Escolha manualmente uma imagem creditada." },
        { status: 422 },
      );
    }
    const imgRes = await fetch(url, {
      headers: { "User-Agent": "IAClub-Central/1.0 (studio)" },
      signal: AbortSignal.timeout(25000),
    });
    if (!imgRes.ok) {
      return NextResponse.json({ error: `Não consegui baixar a imagem (${imgRes.status}).` }, { status: 400 });
    }
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "O link não é uma imagem." }, { status: 400 });
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    if (buf.length > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagem muito grande (>12MB)." }, { status: 400 });
    }
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : contentType.includes("gif") ? "gif" : "jpg";
    const base = `web/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const path = `${base}.${ext}`;
    const { data, error } = await supabase.storage
      .from("studio-media")
      .upload(path, buf, { contentType, upsert: true });
    if (error) throw error;
    const { data: pub } = supabase.storage.from("studio-media").getPublicUrl(data.path);

    // Sidecar de proveniência (best-effort; não bloqueia o retorno da imagem).
    const attribution = credit.creator
      ? `${credit.creator}${credit.license ? ` — ${credit.license}` : ""}${credit.bank ? ` (${credit.bank})` : ""}`
      : "";
    try {
      await supabase.storage
        .from("studio-media")
        .upload(`${base}.json`, Buffer.from(JSON.stringify({ ...credit, image: path, attribution, salvo_em: new Date().toISOString() }, null, 2)), {
          contentType: "application/json",
          upsert: true,
        });
    } catch {
      /* proveniência é best-effort */
    }

    return NextResponse.json({ url: pub.publicUrl, credit, attribution });
  } catch (error) {
    console.error("POST /api/studio/images/save:", error);
    return NextResponse.json({ error: "Falha ao salvar a imagem." }, { status: 500 });
  }
}
