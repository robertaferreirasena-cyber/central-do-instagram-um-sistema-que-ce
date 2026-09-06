import { createClient } from "@supabase/supabase-js";
import { SEED_TEMPLATES } from "@/lib/studio/seedTemplates";

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const accountId = "default-account";

    // Delete existing templates for this account
    await supabase
      .from("studio_templates")
      .delete()
      .eq("account_id", accountId);

    // Insert new seed templates
    const toInsert = SEED_TEMPLATES.map((template) => ({
      account_id: accountId,
      name: template.name,
      category: template.category,
      template_json: template.template_json,
      sequence_order: template.sequence_order ?? 0,
    }));

    const { data, error } = await supabase
      .from("studio_templates")
      .insert(toInsert)
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      replaced: true,
      inserted: data?.length || 0,
    });
  } catch (err) {
    console.error("Seed error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
