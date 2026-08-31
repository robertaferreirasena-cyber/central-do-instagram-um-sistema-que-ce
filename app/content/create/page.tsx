'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ContentType } from '@/types';

export default function CreateContentPage() {
  const [formData, setFormData] = useState({
    type: ContentType.FEED,
    theme: '',
    caption: '',
    hashtags: '',
    scheduled_at: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const hashtags = formData.hashtags.split(',').map((tag) => tag.trim()).filter(Boolean);

      const response = await fetch('/api/content/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          theme: formData.theme,
          caption: formData.caption,
          hashtags,
          scheduled_at: formData.scheduled_at,
          created_by: 'roberta',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao criar brief');
      }

      setSuccess('Brief criado com sucesso!');
      setTimeout(() => (window.location.href = '/content'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/content" className="text-slate-400 hover:text-white text-sm">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold text-white mt-4">Novo Brief de Conteúdo</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded">
            {success}
          </div>
        )}

        <div>
          <label className="block text-white font-medium mb-2">Tipo de conteúdo</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as ContentType })}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-cyan-500 outline-none"
          >
            <option value={ContentType.FEED}>Feed</option>
            <option value={ContentType.REEL}>Reel</option>
            <option value={ContentType.STORY}>Story</option>
            <option value={ContentType.CAROUSEL}>Carrossel</option>
          </select>
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Tema</label>
          <input
            type="text"
            value={formData.theme}
            onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
            placeholder="Ex: Dicas de IA para negócios"
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-cyan-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Legenda</label>
          <textarea
            value={formData.caption}
            onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
            placeholder="Escreva a legenda do post..."
            rows={6}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-cyan-500 outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Hashtags</label>
          <input
            type="text"
            value={formData.hashtags}
            onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
            placeholder="#IA, #negócios, #dicas (separadas por vírgula)"
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-cyan-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Agendar para</label>
          <input
            type="datetime-local"
            value={formData.scheduled_at}
            onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
            className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-cyan-500 outline-none"
          />
          <p className="text-slate-400 text-xs mt-1">Deixe em branco para agendar depois</p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Salvando...' : 'Salvar como rascunho'}
          </button>
          <Link
            href="/content"
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
