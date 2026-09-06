import * as htmlToImage from "html-to-image";
import JSZip from "jszip";

const FONT_FAMILIES_TO_PRELOAD = [
  "Archivo",
  "Instrument Sans",
  "JetBrains Mono",
  "Playfair Display",
  "DM Sans",
];

let _fontsReady: Promise<void> | null = null;

export async function ensureFontsReady(): Promise<void> {
  if (_fontsReady) return _fontsReady;
  _fontsReady = (async () => {
    try {
      await Promise.all(
        FONT_FAMILIES_TO_PRELOAD.flatMap((f) => [
          (document as any).fonts?.load?.(`400 16px "${f}"`),
          (document as any).fonts?.load?.(`700 16px "${f}"`),
          (document as any).fonts?.load?.(`italic 700 16px "${f}"`),
        ]).filter(Boolean),
      );
      await (document as any).fonts?.ready;
    } catch {
      // ignore
    }
  })();
  return _fontsReady;
}

export async function renderNodeToPng(
  node: HTMLElement,
  scale = 2,
  opts: { width?: number; height?: number } = {},
): Promise<Blob> {
  await ensureFontsReady();
  const width = opts.width ?? node.offsetWidth;
  const height = opts.height ?? node.offsetHeight;

  try {
    const blob = await htmlToImage.toBlob(node, {
      pixelRatio: scale,
      cacheBust: true,
      width,
      height,
      backgroundColor: undefined,
      style: {
        transform: "none",
        transformOrigin: "top left",
        margin: "0",
      },
      skipFonts: false,
      filter: (n) => {
        if (n instanceof HTMLElement) {
          if (n.dataset?.editorChrome === "true") return false;
        }
        return true;
      },
    });
    if (blob) return blob;
    throw new Error("html-to-image returned null");
  } catch (e) {
    console.warn("[export] html-to-image failed:", e);
    throw e;
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportSlidesAsZip(
  slides: { node: HTMLElement; index: number; width?: number; height?: number }[],
  zipName: string,
) {
  await ensureFontsReady();
  const zip = new JSZip();
  for (const s of slides) {
    const blob = await renderNodeToPng(s.node, 2, { width: s.width, height: s.height });
    const ab = await blob.arrayBuffer();
    zip.file(`slide-${String(s.index + 1).padStart(2, "0")}.png`, ab);
  }
  const out = await zip.generateAsync({ type: "blob" });
  downloadBlob(out, zipName);
}
