import { chromium } from "playwright";
import JSZip from "jszip";
import { generateHtmlForSlides } from "@/lib/studio/slideToHtml";
import type { Slide } from "@/lib/studio/types";

export async function POST(req: Request) {
  let browser;

  try {
    const { slides } = (await req.json()) as { slides: Slide[] };

    if (!slides || slides.length === 0) {
      return Response.json({ error: "No slides provided" }, { status: 400 });
    }

    const html = generateHtmlForSlides(slides);

    browser = await chromium.launch();
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
