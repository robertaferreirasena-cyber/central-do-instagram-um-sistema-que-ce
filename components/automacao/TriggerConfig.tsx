'use client';

import { AutomacaoBlock, AutomacaoFlow, TriggerConfigState, BLOCK_LABELS } from '@/lib/automacao/types';

interface Props {
  flow: AutomacaoFlow | null;
  triggerConfig: TriggerConfigState;
  onTriggerChange: (config: TriggerConfigState) => void;
  selectedBlock: AutomacaoBlock | null;
  onBlockChange: (block: AutomacaoBlock) => void;
}

export function TriggerConfig({ flow, triggerConfig, onTriggerChange, selectedBlock, onBlockChange }: Props) {
  if (!flow) return null;

  return (
    <div
      style={{
        width: '280px',
        backgroundColor: '#FFFFFF',
        borderLeft: '1px solid #E2E2DE',
        overflowY: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {selectedBlock ? (
        <>
          <div>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E', textTransform: 'uppercase' }}>
              Editar bloco
            </h4>
            {selectedBlock.type === 'text' && (
              <textarea
                value={selectedBlock.content || ''}
                onChange={(e) => onBlockChange({ ...selectedBlock, content: e.target.value })}
                placeholder="Conteúdo da mensagem"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #E2E2DE',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  minHeight: '100px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            )}
            {selectedBlock.type === 'quick_replies' && (() => {
              const btns = selectedBlock.buttons || [];
              const setBtn = (i: number, patch: Partial<(typeof btns)[number]>) => {
                const novos = btns.map((b, j) => (j === i ? { ...b, ...patch } : b));
                onBlockChange({ ...selectedBlock, buttons: novos });
              };
              const addBtn = () => onBlockChange({ ...selectedBlock, buttons: [...btns, { label: 'Novo botão', action_type: 'next_block' }] });
              const delBtn = (i: number) => onBlockChange({ ...selectedBlock, buttons: btns.filter((_, j) => j !== i) });
              const inp: React.CSSProperties = { width: '100%', padding: '0.4rem', border: '1px solid #E2E2DE', borderRadius: 4, fontSize: '0.75rem', boxSizing: 'border-box' };
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <textarea
                    value={selectedBlock.content || ''}
                    onChange={(e) => onBlockChange({ ...selectedBlock, content: e.target.value })}
                    placeholder="Texto da mensagem"
                    style={{ ...inp, minHeight: '60px' }}
                  />
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#7A8B84', margin: '0.5rem 0 0.25rem', textTransform: 'uppercase' }}>Botões ({btns.length}/3)</p>
                  {btns.map((btn, i) => (
                    <div key={i} style={{ border: '1px solid #E2E2DE', borderRadius: 6, padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', background: '#FAFAF8' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <input value={btn.label} onChange={(e) => setBtn(i, { label: e.target.value })} placeholder="Texto do botão" style={{ ...inp, flex: 1 }} />
                        <button onClick={() => delBtn(i)} title="Remover" style={{ border: 'none', background: 'transparent', color: '#C0442E', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem' }}>×</button>
                      </div>
                      <select value={btn.action_type || 'next_block'} onChange={(e) => setBtn(i, { action_type: e.target.value as typeof btn.action_type })} style={inp}>
                        <option value="next_block">↳ Responder / próximo passo</option>
                        <option value="url">🔗 Abrir link (URL)</option>
                        <option value="whatsapp">🟢 Ir pro WhatsApp</option>
                        <option value="trigger_flow">🔀 Disparar outro fluxo</option>
                      </select>
                      {(btn.action_type === 'url' || btn.action_type === 'whatsapp') && (
                        <input value={btn.url || ''} onChange={(e) => setBtn(i, { url: e.target.value })} placeholder={btn.action_type === 'whatsapp' ? 'https://wa.me/55...' : 'https://...'} style={inp} />
                      )}
                      {(btn.action_type === 'next_block' || !btn.action_type) && (
                        <select value={btn.next || ''} onChange={(e) => setBtn(i, { next: e.target.value || null })} style={inp}>
                          <option value="">→ próximo bloco (sequência)</option>
                          {(flow.blocks || []).filter((b) => b.id !== selectedBlock.id).map((b) => (
                            <option key={b.id} value={b.id}>→ {BLOCK_LABELS[b.type]}{b.content ? `: ${b.content.slice(0, 22)}` : ''}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                  {btns.length < 3 && (
                    <button onClick={addBtn} style={{ border: '1px dashed #46655C', background: 'transparent', color: '#46655C', borderRadius: 6, padding: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>+ Adicionar botão</button>
                  )}
                </div>
              );
            })()}
            {selectedBlock.type === 'collect_data' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea
                  value={selectedBlock.content || ''}
                  onChange={(e) => onBlockChange({ ...selectedBlock, content: e.target.value })}
                  placeholder="Pergunta"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #E2E2DE',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    minHeight: '60px',
                    boxSizing: 'border-box',
                  }}
                />
                <input
                  type="text"
                  value={selectedBlock.field_name || ''}
                  onChange={(e) => onBlockChange({ ...selectedBlock, field_name: e.target.value })}
                  placeholder="Campo (ex: nome, email)"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #E2E2DE',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
            {selectedBlock.type === 'wait' && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#0E2A2E' }}>Aguardar (segundos)</label>
                <input
                  type="number"
                  min={0}
                  value={selectedBlock.wait_seconds ?? 3}
                  onChange={(e) => onBlockChange({ ...selectedBlock, wait_seconds: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: '4px', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: '0.7rem', color: '#7A8B84', margin: '0.4rem 0 0' }}>A próxima mensagem só sai depois desse tempo (estilo ManyChat “Waiting X sec”).</p>
              </div>
            )}
            {selectedBlock.type === 'condition' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#7A8B84', margin: 0 }}>Ramifica pelo botão que a pessoa clicou. Escolha o bloco de cada caminho:</p>
                {(['yes_step', 'no_step'] as const).map((campo) => (
                  <div key={campo}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#0E2A2E' }}>{campo === 'yes_step' ? 'Se SIM →' : 'Se NÃO →'}</label>
                    <select
                      value={selectedBlock[campo] || ''}
                      onChange={(e) => onBlockChange({ ...selectedBlock, [campo]: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: '4px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                    >
                      <option value="">— escolher bloco —</option>
                      {(flow.blocks || []).filter((b) => b.id !== selectedBlock.id).map((b) => (
                        <option key={b.id} value={b.id}>{BLOCK_LABELS[b.type]}{b.content ? `: ${b.content.slice(0, 22)}` : ''}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
            {selectedBlock.type === 'tag' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0E2A2E' }}>Tag a aplicar</label>
                <input
                  type="text"
                  value={selectedBlock.tag_to_apply || ''}
                  onChange={(e) => onBlockChange({ ...selectedBlock, tag_to_apply: e.target.value })}
                  placeholder="Ex: lead_quente, assinante_newsletter"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: '4px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: '0.7rem', color: '#7A8B84', margin: 0 }}>A tag é aplicada ao lead quando o fluxo chega aqui (segmentação no CRM).</p>
              </div>
            )}
            {selectedBlock.type === 'media' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0E2A2E' }}>URL da mídia</label>
                <input
                  type="text"
                  value={selectedBlock.media_url || ''}
                  onChange={(e) => onBlockChange({ ...selectedBlock, media_url: e.target.value })}
                  placeholder="https://.../imagem.jpg"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: '4px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0E2A2E' }}>Tipo</label>
                <select
                  value={selectedBlock.media_type || 'image'}
                  onChange={(e) => onBlockChange({ ...selectedBlock, media_type: e.target.value as 'image' | 'video' })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: '4px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                >
                  <option value="image">🖼️ Imagem</option>
                  <option value="video">🎬 Vídeo</option>
                </select>
                <textarea
                  value={selectedBlock.content || ''}
                  onChange={(e) => onBlockChange({ ...selectedBlock, content: e.target.value })}
                  placeholder="Legenda (opcional)"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #E2E2DE', borderRadius: '4px', fontSize: '0.75rem', minHeight: '50px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E', textTransform: 'uppercase' }}>
              Configuração do gatilho
            </h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E' }}>
                Tipo de gatilho
              </label>
              <select
                value={flow.trigger_type}
                disabled
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #E2E2DE',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  color: '#0E2A2E',
                }}
              >
                <option value="comment">Comentário</option>
                <option value="story_reply">Story Reply</option>
                <option value="dm">Direct Message</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E' }}>
                Palavra-chave
              </label>
              <input
                type="text"
                value={triggerConfig.keyword}
                onChange={(e) => onTriggerChange({ ...triggerConfig, keyword: e.target.value })}
                placeholder="Ex: LINK, PRECO"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #E2E2DE',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  color: '#0E2A2E',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '0.7rem', color: '#7A8B84', margin: '0.4rem 0 0' }}>O gatilho dispara quando o comentário contém esta palavra.</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={triggerConfig.respondAll}
                  onChange={(e) => onTriggerChange({ ...triggerConfig, respondAll: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: '#0E2A2E' }}>Responder qualquer comentário</span>
              </label>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={triggerConfig.humanHandoff}
                  onChange={(e) => onTriggerChange({ ...triggerConfig, humanHandoff: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: '#0E2A2E' }}>Transferência para atendimento humano</span>
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
