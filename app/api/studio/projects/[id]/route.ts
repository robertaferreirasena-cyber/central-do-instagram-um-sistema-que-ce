import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import type { ProjectData } from "@/lib/studio/types";

const ACCOUNT_ID = "default-account";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("studio_projects")
      .select("*")
      .eq("id", id)
      .eq("account_id", ACCOUNT_ID)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/studio/projects/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, status, caption, hashtags, data } = body;

    const updateObj: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateObj.title = title;
    if (status !== undefined) updateObj.status = status;
    if (caption !== undefined) updateObj.caption = caption;
    if (hashtags !== undefined) updateObj.hashtags = hashtags;
    if (data !== undefined) updateObj.data = data;

    const { data: updated, error } = await supabase
      .from("studio_projects")
      .update(updateObj)
      .eq("id", id)
      .eq("account_id", ACCOUNT_ID)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/studio/projects/[id]:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from("studio_projects")
      .delete()
      .eq("id", id)
      .eq("account_id", ACCOUNT_ID);

    if (error) throw error;

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("DELETE /api/studio/projects/[id]:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
