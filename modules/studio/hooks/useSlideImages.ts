'use client';
import { useState } from 'react';
import type { SlideElement } from '@/lib/studio/types';

export interface WebImage {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  creator: string;
  license?: string;
  bank?: string;
}

// Busca/print/upload de imagens REAIS da web (nunca gera). A aplicação no slide
// fica com o editor via callbacks — o hook cuida só do IO e do estado da UI.
export function useSlideImages(callbacks: {
  onWebImage: (url: string) => void; // resultado de busca/print → aplica no slide
  onUploadImage: (el: SlideElement, url: string) => void; // upload num elemento
}) {
  const [imgQuery, setImgQuery] = useState('');
  const [imgResults, setImgResults] = useState<WebImage[]>([]);
  const [imgBusy, setImgBusy] = useState(false);
  const [printUrl, setPrintUrl] = useState('');

  const buscarImagens = async () => {
    if (!imgQuery.trim()) return;
    setImgBusy(true);
    setImgResults([]);
    try {
      const res = await fetch('/api/studio/images/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: imgQuery }),
      });
      const json = await res.json();
      setImgResults(json.results || []);
      if (!json.results?.length) alert('Nenhuma imagem encontrada. Tente outra palavra (a busca é gratuita e às vezes limita — tente de novo).');
    } catch {
      alert('Erro na busca.');
    } finally {
      setImgBusy(false);
    }
  };

  const usarImagemWeb = async (img: WebImage) => {
    setImgBusy(true);
    try {
      const res = await fetch('/api/studio/images/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Preserva proveniência (autor/licença/fonte) ao salvar no bucket.
        body: JSON.stringify({ url: img.url, creator: img.creator, license: img.license, bank: img.bank, title: img.title }),
      });
      const json = await res.json();
      if (json.url) callbacks.onWebImage(json.url);
      else alert(json.error || 'Falha ao salvar imagem.');
    } finally {
      setImgBusy(false);
    }
  };

  const printarSite = async () => {
    if (!printUrl.trim()) return;
    setImgBusy(true);
    try {
      const res = await fetch('/api/studio/images/screenshot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: printUrl }),
      });
      const json = await res.json();
      if (json.url) { callbacks.onWebImage(json.url); setPrintUrl(''); }
      else alert(json.error || 'Falha ao capturar o site.');
    } finally {
      setImgBusy(false);
    }
  };

  const uploadImage = async (el: SlideElement, file: File) => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/studio/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (json?.url) callbacks.onUploadImage(el, json.url);
      else alert('Falha no upload da imagem.');
    } catch {
      alert('Erro ao enviar a imagem.');
    }
  };

  return {
    imgQuery, setImgQuery, imgResults, imgBusy, printUrl, setPrintUrl,
    buscarImagens, usarImagemWeb, printarSite, uploadImage,
  };
}
