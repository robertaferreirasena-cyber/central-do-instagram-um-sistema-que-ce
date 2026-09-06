'use client';
import { useState } from 'react';
import type { StudioProject, Slide } from '@/lib/studio/types';

// Baixa um blob vindo do endpoint de export como arquivo nomeado.
function baixarBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function exportSlides(slides: Slide[]): Promise<Blob> {
  const res = await fetch('/api/studio/export-png', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slides }),
  });
  if (!res.ok) throw new Error('export falhou');
  return res.blob();
}

// Export do estúdio — tudo via render server-side (Playwright, alta fidelidade).
// exportZip === exportHD (o antigo html-to-image em clone saía branco/estreito).
export function useProjectExport(project: StudioProject) {
  const [isExporting, setIsExporting] = useState(false);

  const exportCurrent = async (currentSlide: Slide, index: number) => {
    setIsExporting(true);
    try {
      const blob = await exportSlides([currentSlide]);
      baixarBlob(blob, `${project.title || 'post'}-${index + 1}.png`);
    } catch {
      alert('Erro ao exportar slide.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportHD = async () => {
    setIsExporting(true);
    try {
      const blob = await exportSlides(project.data.slides);
      baixarBlob(blob, `${project.title || 'carrossel'}-hd.zip`);
    } catch {
      alert('Erro ao exportar HD.');
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, exportCurrent, exportHD, exportZip: exportHD };
}
