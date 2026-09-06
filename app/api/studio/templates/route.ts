import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

const ACCOUNT_ID = "default-account";

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("studio_templates")
      .select("*")
      .eq("account_id", ACCOUNT_ID)
      .order("sequence_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("GET /api/studio/templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

// Criar um modelo CUSTOM (a partir de um slide desenhado no Estúdio)
export async function POST(req: NextRequest) {
  try {
    const { name, category = "custom", template_json } = await req.json();
    if (!name || !template_json?.slides?.length) {
      return NextResponse.json({ error: "name e template_json (com slides) são obrigatórios" }, { status: 400 });
    }
    const format = template_json.format || (template_json.slides[0]?.canvas_height === 1440 ? "3:4" : "4:5");
    const { data, error } = await supabase
      .from("studio_templates")
      .insert({
        account_id: ACCOUNT_ID,
        name,
        category,
        format,
        template_json,
        preview_url: null,
        is_system: false,
        sequence_order: 100,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: "Já existe um modelo com esse nome." }, { status: 409 });
    }
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/studio/templates:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

// Excluir um modelo CUSTOM (nunca os de sistema)
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    const { error } = await supabase
      .from("studio_templates")
      .delete()
      .eq("account_id", ACCOUNT_ID)
      .eq("id", id)
      .eq("is_system", false); // trava: só custom
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/studio/templates:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
