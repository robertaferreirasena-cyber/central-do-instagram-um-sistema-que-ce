'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContentType, ContentStatus } from '@/types';

type TabType = 'estudio' | 'aprovacao' | 'calendario' | 'biblioteca';

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<TabType>('estudio');
  const [briefs, setBriefs] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountId] = useState('default-account');

  useEffect(() => {
    loadBriefs();
    loadCampaigns();
    loadMedia();
  }, [accountId]);

  const loadBriefs = async () => {
    try {
      const res = await fetch(`/api/content/briefs?account_id=${accountId}`);
      if (res.ok) {
        const data = await res.json();
        setBriefs(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar briefs:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const res = await fetch(`/api/campaigns?account_id=${accountId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    }
  };

  const loadMedia = async () => {
    try {
      const res = await fetch(`/api/media/upload?account_id=${accountId}`);
      if (res.ok) {
        const data = await res.json();
        setMediaItems(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar mídia:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Conteúdo</h1>
          <p className="text-slate-400 mt-1">Crie, aprove e publique posts para Instagram</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-700">
        {[
          { id: 'estudio', label: '✨ Estúdio', icon: '🎬' },
          { id: 'aprovacao', label: '✓ Aprovação', icon: '🔍' },
          { id: 'calendario', label: '📅 Calendário', icon: '📆' },
          { id: 'biblioteca', label: '📸 Biblioteca', icon: '🖼️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'estudio' && <StudioTab accountId={accountId} onBriefCreated={loadBriefs} />}
      {activeTab === 'aprovacao' && <ApprovalTab briefs={briefs} onBriefUpdated={loadBriefs} />}
      {activeTab === 'calendario' && <CalendarTab briefs={briefs} campaigns={campaigns} />}
      {activeTab === 'biblioteca' && <LibraryTab accountId={accountId} mediaItems={mediaItems} onMediaUploaded={loadMedia} />}
    </div>
  );
}

function StudioTab({ accountId, onBriefCreated }: { accountId: string; onBriefCreated: () => void }) {
  const [theme, setTheme] = useState('');
  const [type, setType] = useState<ContentType>(ContentType.FEED);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!theme) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, theme, account_id: accountId }),
      });
      if (res.ok) {
        const data = await res.json();
        setGenerated(data.data);
      }
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generated) return;
    setSaving(true);
    try {
      const res = await fetch('/api/content/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accountId,
          type,
          theme,
          caption: generated.caption,
          hashtags: generated.hashtags,
          created_by: 'user',
        }),
      });
      if (res.ok) {
        setTheme('');
        setGenerated(null);
        onBriefCreated();
      }
    } catch (error) {
      console.error('Erro ao salvar brief:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Gerar conteúdo com IA</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ContentType)}
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600"
            >
              <option value={ContentType.FEED}>Feed</option>
              <option value={ContentType.REEL}>Reel</option>
              <option value={ContentType.STORY}>Story</option>
              <option value={ContentType.CAROUSEL}>Carrossel</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Tema</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: Dicas de IA para negócios"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!theme || generating}
          className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {generating ? 'Gerando...' : 'Gerar conteúdo'}
        </button>
      </div>

      {generated && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Preview</h2>

          <div className="space-y-3">
            {generated.idea && (
              <div>
                <p className="text-sm text-slate-400">Ideia</p>
                <p className="text-white">{generated.idea}</p>
              </div>
            )}
            {generated.roteiro && (
              <div>
                <p className="text-sm text-slate-400">Roteiro</p>
                <p className="text-white">{generated.roteiro}</p>
              </div>
            )}
            {generated.caption && (
              <div>
                <p className="text-sm text-slate-400">Legenda</p>
                <p className="text-white">{generated.caption}</p>
              </div>
            )}
            {generated.hashtags?.length > 0 && (
              <div>
                <p className="text-sm text-slate-400">Hashtags</p>
                <p className="text-white">{generated.hashtags.join(' ')}</p>
              </div>
            )}
            {generated.cta && (
              <div>
                <p className="text-sm text-slate-400">CTA</p>
                <p className="text-white">{generated.cta}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar como rascunho'}
            </button>
            <button
              onClick={() => setGenerated(null)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Descartar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalTab({ briefs, onBriefUpdated }: { briefs: any[]; onBriefUpdated: () => void }) {
  const pendingBriefs = briefs.filter((b) => b.status === ContentStatus.PENDING_APPROVAL || b.status === 'draft');

  const handleApprove = async (briefId: string) => {
    try {
      const res = await fetch(`/api/content/briefs/${briefId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (res.ok) {
        onBriefUpdated();
      }
    } catch (error) {
      console.error('Erro ao aprovar:', error);
    }
  };

  return (
    <div className="space-y-4">
      {pendingBriefs.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">Nenhum brief aguardando aprovação</p>
        </div>
      ) : (
        pendingBriefs.map((brief) => (
          <div key={brief.id} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-white text-lg">{brief.theme}</h3>
                <p className="text-slate-400 text-sm mt-1">{brief.type}</p>
              </div>
              <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                {brief.status}
              </span>
            </div>
            <p className="text-white">{brief.caption}</p>
            {brief.hashtags?.length > 0 && (
              <p className="text-cyan-400 text-sm">{brief.hashtags.join(' ')}</p>
            )}
            <button
              onClick={() => handleApprove(brief.id)}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ✓ Aprovar
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function CalendarTab({ briefs, campaigns }: { briefs: any[]; campaigns: any[] }) {
  const scheduledBriefs = briefs
    .filter((b) => b.scheduled_at && b.status !== ContentStatus.DRAFT)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  return (
    <div className="space-y-4">
      {campaigns.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4">
          <h3 className="font-bold text-white mb-2">Campanhas</h3>
          <div className="space-y-2">
            {campaigns.map((camp) => (
              <div key={camp.id} className="text-sm text-slate-300">
                📍 {camp.nome} ({new Date(camp.start_date).toLocaleDateString()} - {new Date(camp.end_date).toLocaleDateString()})
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {scheduledBriefs.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-slate-400">Nenhum conteúdo agendado</p>
          </div>
        ) : (
          scheduledBriefs.map((brief) => (
            <div key={brief.id} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">{brief.theme}</p>
                <p className="text-slate-400 text-sm">{new Date(brief.scheduled_at).toLocaleString()}</p>
              </div>
              <span className="text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded">
                {brief.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LibraryTab({ accountId, mediaItems, onMediaUploaded }: { accountId: string; mediaItems: any[]; onMediaUploaded: () => void }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('account_id', accountId);

    setUploading(true);
    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        onMediaUploaded();
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 border-dashed">
        <label className="flex flex-col items-center justify-center cursor-pointer">
          <div className="text-3xl mb-2">📸</div>
          <p className="text-slate-300 font-medium">Clique para fazer upload</p>
          <p className="text-slate-500 text-sm">ou arraste imagens/vídeos</p>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {mediaItems.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {mediaItems.map((media) => (
            <div key={media.id} className="bg-slate-700 rounded-lg overflow-hidden">
              {media.tipo === 'video' ? (
                <div className="w-full h-32 bg-slate-800 flex items-center justify-center">🎬 {media.nome}</div>
              ) : (
                <img src={media.url} alt={media.nome} className="w-full h-32 object-cover" />
              )}
              <div className="p-2">
                <p className="text-xs text-slate-300 truncate">{media.nome}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
