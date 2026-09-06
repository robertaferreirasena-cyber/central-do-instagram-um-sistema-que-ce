import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import type { ProjectData } from "@/lib/studio/types";
import { CANVAS_DIMENSIONS } from "@/lib/studio/types";

const ACCOUNT_ID = "default-account";

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("studio_projects")
      .select("*")
      .eq("account_id", ACCOUNT_ID)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("GET /api/studio/projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, format = "4:5", template_id } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const dim = CANVAS_DIMENSIONS[format as "4:5" | "1:1" | "9:16"];

    // Start with empty slide or from template
    let initialData: ProjectData = {
      slides: [
        {
          id: `slide-${Date.now()}`,
          background_type: "solid",
          background_value: "#0E2A2E",
          overlay_color: "#000000",
          overlay_value: "0.3",
          canvas_width: dim.w,
          canvas_height: dim.h,
          elements: [],
        },
      ],
    };

    // If template provided, load and merge
    if (template_id) {
      const { data: template } = await supabase
        .from("studio_templates")
        .select("template_json")
        .eq("id", template_id)
        .single();

      if (template?.template_json) {
        initialData = {
          slides: template.template_json.slides.map((s: any) => ({
            id: `slide-${Date.now()}-${Math.random()}`,
            background_type: s.background_type,
            background_value: s.background_value,
            overlay_color: s.overlay_color || null,
            overlay_value: s.overlay_value || null,
            canvas_width: s.canvas_width,
            canvas_height: s.canvas_height,
            elements: s.elements.map((el: any) => ({
              id: `el-${Date.now()}-${Math.random()}`,
              element_type: el.element_type,
              content: el.content,
              styles_json: el.styles_json,
              position_x: el.position_x,
              position_y: el.position_y,
              width: el.width,
              height: el.height,
              z_index: el.z_index,
            })),
          })),
        };
      }
    }

    const { data, error } = await supabase
      .from("studio_projects")
      .insert({
        account_id: ACCOUNT_ID,
        title,
        format,
        status: "rascunho",
        template_id: template_id || null,
        data: initialData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/studio/projects:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
