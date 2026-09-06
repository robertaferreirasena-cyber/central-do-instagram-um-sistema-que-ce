import JSZip from "jszip";
import { generateHtmlForSlides } from "@/lib/studio/slideToHtml";
import type { Slide } from "@/lib/studio/types";

// Runtime Node (chromium não roda no Edge) + tempo maior pro render headless
export const runtime = "nodejs";
export const maxDuration = 60;

// Local: usa o `playwright` completo (com chromium próprio).
// Serverless (Vercel/Lambda): usa `playwright-core` + `@sparticuz/chromium` (binário empacotado).
async function launchBrowser() {
  const serverless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_REGION);
  if (serverless) {
    const sparticuz = (await import("@sparticuz/chromium")).default;
    const { chromium } = await import("playwright-core");
    return chromium.launch({
      args: sparticuz.args,
      executablePath: await sparticuz.executablePath(),
      headless: true,
    });
  }
  const { chromium } = await import("playwright");
  return chromium.launch();
}

export async function POST(req: Request) {
  let browser;

  try {
    const { slides } = (await req.json()) as { slides: Slide[] };

    if (!slides || slides.length === 0) {
      return Response.json({ error: "No slides provided" }, { status: 400 });
    }

    const html = generateHtmlForSlides(slides);

    browser = await launchBrowser();
    const page = await browser.newPage({
      viewport: { width: 1080, height: 1440 },
      deviceScaleFactor: 2,
    });

    await page.setContent(html);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => (document as any).fonts.ready);
    await page.waitForTimeout(800);

    const slideElements = await page.$$(".slide");

    if (slideElements.length === 0) {
      return Response.json({ error: "No slides found in generated HTML" }, { status: 500 });
    }

    // 1 slide → devolve PNG direto (pro botão "Exportar Slide"); vários → ZIP
    if (slideElements.length === 1) {
      const buffer = await slideElements[0].screenshot({ type: "png" });
      await page.close();
      await browser.close();
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": "attachment; filename=slide.png",
        },
      });
    }

    const zip = new JSZip();
    for (let i = 0; i < slideElements.length; i++) {
      const buffer = await slideElements[i].screenshot({ type: "png" });
      zip.file(`slide-${String(i + 1).padStart(2, "0")}.png`, buffer);
    }

    await page.close();
    await browser.close();

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=carrossel-hd.zip",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    if (browser) {
      await browser.close().catch(() => {});
    }
    return Response.json(
      { error: "Export failed: " + String(error) },
      { status: 500 }
    );
  }
}
