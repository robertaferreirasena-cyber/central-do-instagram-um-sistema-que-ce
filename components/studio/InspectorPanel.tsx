'use client';
import type { SlideElement } from '@/lib/studio/types';
import type { useSlideImages } from '@/modules/studio/hooks/useSlideImages';
import { C, btn } from './editorTheme';

type ImagesApi = ReturnType<typeof useSlideImages>;

// Painel DIREITA: editar textos, imagens (upload), buscar imagem na web, briefing
// e gerar com IA. Só apresenta e delega — a lógica vem por props/hooks.
export default function InspectorPanel(props: {
  textEls: SlideElement[];
  imageEls: SlideElement[];
  selectedElementId?: string;
  images: ImagesApi;
  briefing: string;
  setBriefing: (v: string) => void;
  generating: boolean;
  canDeleteSlide: boolean;
  onSelectElement: (id: string) => void;
  onUpdateElement: (el: SlideElement) => void;
  onAddImage: () => void;
  onAddText: () => void;
  onClearImage: (el: SlideElement) => void;
  onGenerate: () => void;
  onDeleteSlide: () => void;
}) {
  const { textEls, imageEls, selectedElementId, images } = props;
  return (
    <div style={{ background: C.petroleo, borderLeft: `1px solid ${C.borda}`, overflowY: 'auto', padding: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.12em', color: C.citrico, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginBottom: 12 }}>
        EDITAR CONTEÚDO
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button onClick={props.onAddImage} style={{ flex: 1, padding: '7px', background: C.eucalipto, color: C.gelo, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>➕ Imagem</button>
        <button onClick={props.onAddText} style={{ flex: 1, padding: '7px', background: C.eucalipto, color: C.gelo, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>➕ Texto</button>
      </div>

      {textEls.length === 0 && imageEls.length === 0 && (
        <div style={{ fontSize: 12, color: C.eucalipto, lineHeight: 1.5 }}>
          Aplique um modelo da Biblioteca, ou adicione imagem/texto acima.
        </div>
      )}

      {textEls.map((el, i) => (
        <label key={el.id} style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.gelo }}>
            {i === 0 ? 'Cabeçalho / etiqueta' : i === 1 ? 'Manchete' : i === textEls.length - 1 ? 'CTA / rodapé' : `Texto ${i + 1}`}
          </span>
          <textarea
            value={el.content}
            onChange={(e) => props.onUpdateElement({ ...el, content: e.target.value })}
            onFocus={() => props.onSelectElement(el.id)}
            rows={el.content.length > 60 ? 3 : 2}
            style={{ width: '100%', boxSizing: 'border-box', marginTop: 6, background: C.petroleoEscuro, color: C.gelo, border: `1px solid ${selectedElementId === el.id ? C.citrico : C.eucalipto}`, padding: 9, fontSize: 12, fontFamily: 'Instrument Sans, sans-serif', resize: 'vertical' }}
          />
          <span style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
            <input type="color" value={el.styles_json.color || C.gelo}
              onChange={(e) => props.onUpdateElement({ ...el, styles_json: { ...el.styles_json, color: e.target.value } })}
              style={{ width: 26, height: 26, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }} title="Cor do texto" />
            <input type="number" value={el.styles_json.fontSize || 24}
              onChange={(e) => props.onUpdateElement({ ...el, styles_json: { ...el.styles_json, fontSize: parseInt(e.target.value) || 24 } })}
              style={{ width: 64, background: C.petroleoEscuro, color: C.gelo, border: `1px solid ${C.eucalipto}`, padding: 4, fontSize: 11 }} title="Tamanho" />
            <span style={{ fontSize: 10, color: C.eucalipto, marginLeft: 'auto' }}>{el.content.length} car.</span>
          </span>
        </label>
      ))}

      {imageEls.length > 0 && (
        <div style={{ marginTop: 8, borderTop: `1px solid ${C.borda}`, paddingTop: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: C.citrico, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginBottom: 10 }}>IMAGENS</div>
          {imageEls.map((el, i) => (
            <div key={el.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 52, height: 52, flex: 'none', overflow: 'hidden', background: '#000', border: `1px solid ${C.eucalipto}`, borderRadius: el.styles_json.isCircle ? '50%' : 4, backgroundImage: el.styles_json.imageUrl ? `url(${el.styles_json.imageUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: C.gelo, marginBottom: 4 }}>{el.styles_json.isCircle ? 'Avatar' : `Imagem ${i + 1}`}</div>
                <label style={{ display: 'inline-block', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: C.petroleo, background: C.citrico, padding: '5px 10px' }}>
                  {el.styles_json.imageUrl ? 'Trocar' : 'Enviar'} imagem
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) images.uploadImage(el, f); e.currentTarget.value = ''; }} />
                </label>
                {el.styles_json.imageUrl && (
                  <button onClick={() => props.onClearImage(el)} style={{ marginLeft: 6, fontSize: 11, background: 'transparent', color: '#c77', border: 'none', cursor: 'pointer' }}>remover</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Buscar imagem na web (sem gerar) — bancos de licença livre + print de site */}
      <div style={{ marginTop: 8, borderTop: `1px solid ${C.borda}`, paddingTop: 14 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.12em', color: C.citrico, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>BUSCAR IMAGEM NA WEB</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input value={images.imgQuery} onChange={(e) => images.setImgQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !images.imgBusy) images.buscarImagens(); }}
            placeholder="ex.: escritório, café, IA…"
            style={{ flex: 1, background: C.petroleoEscuro, color: C.gelo, border: `1px solid ${C.eucalipto}`, padding: 8, fontSize: 12 }} />
          <button onClick={images.buscarImagens} disabled={images.imgBusy} style={{ padding: '0 12px', background: C.citrico, color: C.petroleo, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
            {images.imgBusy ? '…' : 'Buscar'}
          </button>
        </div>
        {images.imgResults.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
            {images.imgResults.map((r) => (
              <button key={r.id} onClick={() => images.usarImagemWeb(r)} disabled={images.imgBusy}
                title={`${r.title} · ${r.creator}${r.license ? ' · ' + r.license : ''}`}
                style={{ padding: 0, border: `1px solid ${C.borda}`, background: '#000', cursor: 'pointer', height: 60, overflow: 'hidden' }}>
                <img src={r.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}
        <div style={{ fontSize: 10, color: C.eucalipto, marginBottom: 8 }}>A imagem escolhida é salva na plataforma (com crédito) e aplicada ao slide.</div>

        <div style={{ fontSize: 11, fontWeight: 700, color: C.gelo, marginBottom: 4 }}>Print de site (URL)</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={images.printUrl} onChange={(e) => images.setPrintUrl(e.target.value)} placeholder="https://noticia.com/…"
            style={{ flex: 1, background: C.petroleoEscuro, color: C.gelo, border: `1px solid ${C.eucalipto}`, padding: 8, fontSize: 12 }} />
          <button onClick={images.printarSite} disabled={images.imgBusy} style={{ padding: '0 12px', background: C.eucalipto, color: C.gelo, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
            {images.imgBusy ? '…' : 'Print'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, background: 'rgba(214,242,75,0.08)', color: C.citrico, padding: 12, fontSize: 11, lineHeight: 1.45, marginTop: 16 }}>
        ✦ A IA preenche os textos; imagens vêm do seu upload ou da busca na web (não são geradas).
      </div>

      <label style={{ display: 'block', marginTop: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.gelo }}>Tema / briefing (opcional)</span>
        <textarea value={props.briefing} onChange={(e) => props.setBriefing(e.target.value)}
          placeholder="Ex.: como a IA ajuda pequenos negócios a ganhar tempo" rows={2}
          style={{ width: '100%', boxSizing: 'border-box', marginTop: 6, background: C.petroleoEscuro, color: C.gelo, border: `1px solid ${C.eucalipto}`, padding: 9, fontSize: 12, fontFamily: 'Instrument Sans, sans-serif', resize: 'vertical' }} />
      </label>

      <button onClick={props.onGenerate} disabled={props.generating} style={{ ...btn(C.citrico, C.petroleo), width: '100%', justifyContent: 'center', marginTop: 12 }}>
        {props.generating ? 'Gerando…' : '✦ Gerar com IA'}
      </button>

      {props.canDeleteSlide && (
        <button onClick={props.onDeleteSlide} style={{ ...btn('transparent', '#e08a8a'), width: '100%', justifyContent: 'center', marginTop: 10, borderColor: '#5c2b2b' }}>
          🗑 Excluir slide
        </button>
      )}
    </div>
  );
}
