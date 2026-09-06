import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "bin";
    const fileName = `editor/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("studio-media")
      .upload(fileName, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from("studio-media").getPublicUrl(data.path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error("POST /api/studio/upload:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
