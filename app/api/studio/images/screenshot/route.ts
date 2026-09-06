import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

// Local: playwright completo. Serverless (Vercel): playwright-core + @sparticuz/chromium.
async function launchBrowser() {
  const serverless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_REGION);
  if (serverless) {
    const sparticuz = (await import("@sparticuz/chromium")).default;
    const { chromium } = await import("playwright-core");
    return chromium.launch({ args: sparticuz.args, executablePath: await sparticuz.executablePath(), headless: true });
  }
  const { chromium } = await import("playwright");
  return chromium.launch();
}

function urlSegura(u: string): boolean {
  try {
    const p = new URL(u);
    if (p.protocol !== "http:" && p.protocol !== "https:") return false;
    const h = p.hostname.toLowerCase();
    // bloqueia rede interna / localhost
    if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(h)) return false;
    if (/^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^169\.254\./.test(h)) return false;
    return true;
  } catch {
    return false;
  }
}

// Print de um site (ex.: notícia) → salva no bucket como imagem de referência.
export async function POST(req: NextRequest) {
  let browser: any;
  try {
    const { url, fullPage } = await req.json();
    if (!url || !urlSegura(url)) {
      return NextResponse.json({ error: "URL http(s) pública inválida." }, { status: 400 });
    }
    browser = await launchBrowser();
    const page = await browser.newPage({ viewport: { width: 1200, height: 1350 }, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const buffer: Buffer = await page.screenshot({ type: "png", fullPage: !!fullPage });
    await browser.close();
    browser = null;

    const path = `prints/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const { data, error } = await supabase.storage
      .from("studio-media")
      .upload(path, buffer, { contentType: "image/png", upsert: true });
    if (error) throw error;
    const { data: pub } = supabase.storage.from("studio-media").getPublicUrl(data.path);
    return NextResponse.json({ url: pub.publicUrl });
  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    console.error("POST /api/studio/images/screenshot:", error);
    return NextResponse.json({ error: "Falha ao capturar o site." }, { status: 500 });
  }
}
