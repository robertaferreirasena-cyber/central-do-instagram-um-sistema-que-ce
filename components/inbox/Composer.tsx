'use client';

import { useEffect, useRef, useState } from 'react';

export interface OutButton {
  title: string;
  url: string;
}

export interface SendPayload {
  text: string;
  buttons: OutButton[];
  quickReplies: string[];
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video';
  replyTo?: string;
}

export interface ReplyTarget {
  id_externo: string;
  text: string;
  autor: string;
}

interface Props {
  onSend: (payload: SendPayload) => void;
  onFocusChange?: (focused: boolean) => void;
  onTyping?: () => void;
  replyingTo?: ReplyTarget | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

const MAX = 950; // limite prático do DM do Instagram (~1000)
const EMOJIS = ['😊', '😍', '🥰', '😂', '🙌', '👏', '🔥', '✨', '💚', '👍', '🙏', '🤝', '💡', '🚀', '🎉', '❤️', '😉', '👇', '📩', '✅'];

export function Composer({ onSend, onFocusChange, onTyping, replyingTo, onCancelReply, disabled }: Props) {
  const [text, setText] = useState('');
  const [buttons, setButtons] = useState<OutButton[]>([]);
  const [quick, setQuick] = useState<string[]>([]);
  const [anexo, setAnexo] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [subindo, setSubindo] = useState(false);
  const [extras, setExtras] = useState(false);
  const [emojis, setEmojis] = useState(false);
  const [qInput, setQInput] = useState('');
  const [bLabel, setBLabel] = useState('');
  const [bUrl, setBUrl] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const podeEnviar = !disabled && !subindo && (text.trim().length > 0 || buttons.length > 0 || !!anexo);

  const ajustarAltura = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };
  useEffect(ajustarAltura, [text]);

  const enviar = () => {
    if (!podeEnviar) return;
    onSend({
      text: text.trim(),
      buttons,
      quickReplies: quick,
      attachmentUrl: anexo?.url,
      attachmentType: anexo?.type,
      replyTo: replyingTo?.id_externo,
    });
    setText('');
    setButtons([]);
    setQuick([]);
    setAnexo(null);
    setQInput('');
    setBLabel('');
    setBUrl('');
    setExtras(false);
    setEmojis(false);
  };

  const subirArquivo = async (file: File) => {
    setSubindo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/instagram/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.url) setAnexo({ url: json.url, type: json.type === 'video' ? 'video' : 'image' });
    } catch {
      /* silencioso: a chefe pode tentar de novo */
    } finally {
      setSubindo(false);
    }
  };

  const inserirEmoji = (e: string) => {
    const ta = taRef.current;
    if (!ta) {
      setText((t) => (t + e).slice(0, MAX));
      return;
    }
    const start = ta.selectionStart ?? text.length;
    const end = ta.selectionEnd ?? text.length;
    setText((text.slice(0, start) + e + text.slice(end)).slice(0, MAX));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + e.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const addQuick = () => {
    const q = qInput.trim();
    if (!q || quick.length >= 13) return;
    setQuick((p) => [...p, q]);
    setQInput('');
  };
  const addButton = () => {
    const t = bLabel.trim();
    let u = bUrl.trim();
    if (!t || !u || buttons.length >= 3) return;
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    setButtons((p) => [...p, { title: t, url: u }]);
    setBLabel('');
    setBUrl('');
  };

  const chip = (label: string, onRemove: () => void, bg = '#EEF3E6') => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, border: '1px solid #E2E2DE', borderRadius: 999, padding: '2px 8px', fontSize: 12, color: '#0E2A2E' }}>
      {label}
      <button onClick={onRemove} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#7A8B84', fontSize: 13, lineHeight: 1 }}>×</button>
    </span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Banner "respondendo a…" */}
      {replyingTo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '3px solid #D6F24B', background: '#FFFFFF', border: '1px solid #E2E2DE', padding: '0.4rem 0.6rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#46655C' }}>Respondendo a {replyingTo.autor}</div>
            <div style={{ fontSize: 12, color: '#7A8B84', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyingTo.text}</div>
          </div>
          <button onClick={onCancelReply} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#7A8B84', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Extras: respostas rápidas + botões de link */}
      {extras && (
        <div style={{ border: '1px solid #E2E2DE', background: '#FFFFFF', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <p style={labelTitulo}>Respostas rápidas <span style={{ fontWeight: 400 }}>(somem após o clique · máx. 13)</span></p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: quick.length ? 6 : 0 }}>
              {quick.map((q, i) => chip(q, () => setQuick((p) => p.filter((_, j) => j !== i))))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={qInput} onChange={(e) => setQInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuick())} placeholder="Ex.: Quero saber mais" style={inputMini} />
              <button onClick={addQuick} style={btnMini}>+ Add</button>
            </div>
          </div>
          <div>
            <p style={labelTitulo}>Botões de link <span style={{ fontWeight: 400 }}>(abrem um site · máx. 3)</span></p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: buttons.length ? 6 : 0 }}>
              {buttons.map((b, i) => chip(`🔗 ${b.title}`, () => setButtons((p) => p.filter((_, j) => j !== i)), '#EAF3FA'))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={bLabel} onChange={(e) => setBLabel(e.target.value)} placeholder="Texto do botão" style={{ ...inputMini, flex: '0 0 38%' }} />
              <input value={bUrl} onChange={(e) => setBUrl(e.target.value)} placeholder="link.com" style={inputMini} />
              <button onClick={addButton} style={btnMini}>+ Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Emojis */}
      {emojis && (
        <div style={{ border: '1px solid #E2E2DE', background: '#FFFFFF', padding: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => inserirEmoji(e)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, padding: 4, borderRadius: 6 }} onMouseEnter={(ev) => (ev.currentTarget.style.background = '#EEF3E6')} onMouseLeave={(ev) => (ev.currentTarget.style.background = 'none')}>{e}</button>
          ))}
        </div>
      )}

      {/* Preview do anexo */}
      {(anexo || subindo) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #E2E2DE', background: '#FFFFFF', padding: '0.4rem' }}>
          {subindo ? (
            <span style={{ fontSize: 12, color: '#7A8B84' }}>Subindo imagem…</span>
          ) : anexo?.type === 'video' ? (
            <video src={anexo.url} style={{ height: 44, borderRadius: 4 }} />
          ) : (
            <img src={anexo!.url} alt="anexo" style={{ height: 44, borderRadius: 4 }} />
          )}
          {anexo && (
            <button onClick={() => setAnexo(null)} style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', color: '#C0442E', fontSize: 13, fontWeight: 600 }}>remover</button>
          )}
        </div>
      )}

      {/* Linha de composição */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) subirArquivo(f); e.currentTarget.value = ''; }} />
        <button onClick={() => setExtras((v) => !v)} title="Respostas rápidas e botões de link" style={{ ...iconBtn, background: extras ? '#D6F24B' : '#FFFFFF' }}>＋</button>
        <button onClick={() => fileRef.current?.click()} title="Enviar imagem/vídeo" style={{ ...iconBtn, fontSize: '1.05rem' }}>📎</button>
        <button onClick={() => setEmojis((v) => !v)} title="Emojis" style={{ ...iconBtn, background: emojis ? '#D6F24B' : '#FFFFFF', fontSize: '1.15rem' }}>😊</button>
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => { setText(e.target.value.slice(0, MAX)); onTyping?.(); }}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          placeholder="Digite uma mensagem…  (Enter envia · Shift+Enter quebra linha)"
          rows={1}
          style={{ flex: 1, resize: 'none', maxHeight: 120, minHeight: 40, padding: '0.6rem 0.75rem', border: '1px solid #E2E2DE', background: '#FFFFFF', borderRadius: 0, fontSize: '0.875rem', fontFamily: 'inherit', lineHeight: 1.4, color: '#0E2A2E', overflowY: 'auto' }}
        />
        <button onClick={enviar} disabled={!podeEnviar} style={{ flexShrink: 0, height: 40, backgroundColor: podeEnviar ? '#0E2A2E' : '#C6CFCB', color: '#FAFAF8', border: 'none', padding: '0 1rem', fontWeight: 600, cursor: podeEnviar ? 'pointer' : 'not-allowed' }}>Enviar</button>
      </div>
      {(text.length > 700 || buttons.length > 0 || quick.length > 0) && (
        <div style={{ fontSize: '0.65rem', color: '#9AA7A1', textAlign: 'right' }}>
          {text.length}/{MAX}
          {buttons.length > 0 && ` · ${buttons.length} botão(ões)`}
          {quick.length > 0 && ` · ${quick.length} resposta(s) rápida(s)`}
        </div>
      )}
    </div>
  );
}

const labelTitulo: React.CSSProperties = { margin: '0 0 0.35rem 0', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.05em' };
const iconBtn: React.CSSProperties = { flexShrink: 0, width: 40, height: 40, border: '1px solid #E2E2DE', background: '#FFFFFF', color: '#0E2A2E', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 };
const inputMini: React.CSSProperties = { flex: 1, padding: '0.4rem 0.5rem', border: '1px solid #E2E2DE', background: '#FAFAF8', fontSize: '0.8rem', fontFamily: 'inherit', color: '#0E2A2E' };
const btnMini: React.CSSProperties = { flexShrink: 0, border: '1px solid #0E2A2E', background: '#FFFFFF', color: '#0E2A2E', padding: '0.4rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' };
