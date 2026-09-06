import { NextRequest, NextResponse } from "next/server";
import { resolveBrandKit } from "@/lib/studio/brandKit";
import { updateBrain } from "@/lib/brain";
import { BRAIN_ACCOUNT } from "@/lib/tenant";

export const runtime = "nodejs";

// GET: Brand Kit RESOLVIDO (design do brain sobre o default IA Club V2).
export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("account_id") || BRAIN_ACCOUNT;
  const kit = await resolveBrandKit(accountId);
  return NextResponse.json({ kit });
}

// PUT: grava os tokens de design na seção design do brain (merge) e devolve o kit resolvido.
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const accountId = body.account_id || BRAIN_ACCOUNT;
    const design = body.design || {};
    await updateBrain(accountId, { design });
    const kit = await resolveBrandKit(accountId);
    return NextResponse.json({ kit, saved: true });
  } catch (e) {
    console.error("PUT /api/studio/brand-kit:", e);
    return NextResponse.json({ error: "Falha ao salvar Brand Kit" }, { status: 500 });
  }
}
