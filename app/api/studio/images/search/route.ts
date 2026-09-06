import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Busca imagens REAIS (sem gerar) em vários bancos, com metadados (autor/licença/fonte).
// Openverse + Wikimedia Commons são keyless; Pexels entra se PEXELS_API_KEY existir.

interface ImgResult {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  creator: string;
  license: string;
  source: string;
  bank: string;
}

async function openverse(q: string): Promise<ImgResult[]> {
  try {
    const r = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=10&license_type=commercial&mature=false`,
      { headers: { "User-Agent": "IAClub-Central/1.0" }, signal: AbortSignal.timeout(6000) },
    );
    if (!r.ok) return [];
    const j = await r.json();
    return (j.results || []).map((x: any) => ({
      id: `ov-${x.id}`, url: x.url, thumbnail: x.thumbnail || x.url, title: x.title || "",
      creator: x.creator || "", license: x.license || "", source: x.foreign_landing_url || "", bank: "Openverse",
    }));
  } catch {
    return [];
  }
}

async function wikimedia(q: string): Promise<ImgResult[]> {
  try {
    const url =
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}` +
      `&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=420&format=json&origin=*`;
    const r = await fetch(url, { headers: { "User-Agent": "IAClub-Central/1.0 (studio)" }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return [];
    const j = await r.json();
    const pages = j?.query?.pages || {};
    return Object.values(pages)
      .map((p: any) => {
        const ii = p.imageinfo?.[0];
        // Commons anexa ?utm_...=... ao final da url; testar a extensão antes de "?".
        if (!ii || !ii.url || !/\.(jpe?g|png|webp)(\?|$)/i.test(ii.url)) return null;
        const meta = ii.extmetadata || {};
        return {
          id: `wm-${p.pageid}`, url: ii.url, thumbnail: ii.thumburl || ii.url,
          title: (p.title || "").replace(/^File:/, ""),
          creator: (meta.Artist?.value || "").replace(/<[^>]+>/g, "").slice(0, 60),
          license: meta.LicenseShortName?.value || meta.License?.value || "",
          source: ii.descriptionurl || ii.url, bank: "Wikimedia",
        } as ImgResult;
      })
      .filter(Boolean) as ImgResult[];
  } catch {
    return [];
  }
}

async function pexels(q: string): Promise<ImgResult[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  try {
    const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=8&orientation=portrait`, {
      headers: { Authorization: key }, signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return [];
    const j = await r.json();
    return (j.photos || []).map((p: any) => ({
      id: `px-${p.id}`, url: p.src?.large || p.src?.original, thumbnail: p.src?.medium || p.src?.small,
      title: p.alt || "foto Pexels", creator: p.photographer || "", license: "Pexels License",
      source: p.url || "", bank: "Pexels",
    }));
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || !String(query).trim()) {
      return NextResponse.json({ error: "query é obrigatória" }, { status: 400 });
    }
    const q = String(query).trim();
    const [ov, wm, px] = await Promise.all([openverse(q), wikimedia(q), pexels(q)]);
    // intercala pra variar as fontes
    const results: ImgResult[] = [];
    const max = Math.max(ov.length, wm.length, px.length);
    for (let i = 0; i < max; i++) {
      if (px[i]) results.push(px[i]);
      if (ov[i]) results.push(ov[i]);
      if (wm[i]) results.push(wm[i]);
    }
    return NextResponse.json({ results: results.slice(0, 24), bancos: { openverse: ov.length, wikimedia: wm.length, pexels: px.length } });
  } catch (error) {
    console.error("POST /api/studio/images/search:", error);
    return NextResponse.json({ results: [], aviso: "Falha na busca." });
  }
}
