'use client';

import { useState } from 'react';
import { BrainSection } from '@/lib/brain';

interface BrainEditorProps {
  section: string;
  data: any;
  onUpdate: (updates: any) => void;
  saving: boolean;
}

export default function BrainEditor({
  section,
  data,
  onUpdate,
  saving,
}: BrainEditorProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState(data || {});

  const handleSave = () => {
    // Se formData é string, salva como string; se é objeto, salva como objeto
    const dataToSave = typeof formData === 'string' ? formData : formData;
    onUpdate(dataToSave);
    setEditingField(null);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderEditorContent = () => {
    // Detectar se a seção é string (texto livre) e renderizar como textarea agnóstico
    if (typeof formData === 'string' || (!formData && !editingField)) {
      const stringValue = typeof formData === 'string' ? formData : '';
      return (
        <div className="bg-[#1a3f45] rounded p-4 border border-[#2a5f65]">
          <h4 className="text-[#dce9f7] font-semibold mb-2">{section.replace(/_/g, ' ').toUpperCase()}</h4>
          {editingField === 'main' ? (
            <textarea
              value={stringValue}
              onChange={(e) => setFormData(e.target.value)}
              className="w-full bg-[#070d18] text-[#dce9f7] px-3 py-2 rounded border border-[#3ddc84]/30 h-48 resize-none"
            />
          ) : (
            <p className="text-[#a0b0c7] text-sm whitespace-pre-wrap">{stringValue || 'Não preenchido'}</p>
          )}
        </div>
      );
    }

    switch (section) {
      case 'empresa':
        return (
          <div className="space-y-6">
            <EditableField
              label="Nome da empresa"
              value={formData.nome}
              onChange={(v) => updateField('nome', v)}
              isEditing={editingField === 'nome'}
              onEditClick={() => setEditingField('nome')}
            />
            <EditableField
              label="Descrição"
              value={formData.descricao}
              onChange={(v) => updateField('descricao', v)}
              isEditing={editingField === 'descricao'}
              onEditClick={() => setEditingField('descricao')}
              textarea
            />
            <EditableField
              label="Fundadora/Founder"
              value={formData.founder}
              onChange={(v) => updateField('founder', v)}
              isEditing={editingField === 'founder'}
              onEditClick={() => setEditingField('founder')}
            />
            <EditableField
              label="História"
              value={formData.historia}
              onChange={(v) => updateField('historia', v)}
              isEditing={editingField === 'historia'}
              onEditClick={() => setEditingField('historia')}
              textarea
            />
          </div>
        );

      case 'tom_de_voz':
        return (
          <div className="space-y-6">
            <EditableField
              label="Como falamos"
              value={formData.como_falamos}
              onChange={(v) => updateField('como_falamos', v)}
              isEditing={editingField === 'como_falamos'}
              onEditClick={() => setEditingField('como_falamos')}
              textarea
            />

            <EditableTags
              label="Palavras que usamos"
              tags={formData.palavras_que_usamos || []}
              onChange={(tags) => updateField('palavras_que_usamos', tags)}
            />

            <EditableTags
              label="Palavras que evitamos"
              tags={formData.palavras_que_evitamos || []}
              onChange={(tags) => updateField('palavras_que_evitamos', tags)}
            />

            <div className="bg-[#1a3f45] rounded p-4 border border-[#2a5f65]">
              <h4 className="text-[#dce9f7] font-semibold mb-3 flex items-center justify-between">
                Exemplo de resposta
                <button
                  onClick={() => setEditingField(editingField === 'exemplo' ? null : 'exemplo')}
                  className="text-[#3ddc84] hover:text-[#2fc870] text-sm"
                >
                  {editingField === 'exemplo' ? 'Fechar' : '✏️'}
                </button>
              </h4>
              {editingField === 'exemplo' ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Pergunta"
                    value={formData.exemplo_resposta?.pergunta || ''}
                    onChange={(e) =>
                      updateField('exemplo_resposta', {
                        ...formData.exemplo_resposta,
                        pergunta: e.target.value,
                      })
                    }
                    className="w-full bg-[#070d18] text-[#dce9f7] px-3 py-2 rounded border border-[#3ddc84]/30"
                  />
                  <textarea
                    placeholder="Resposta"
                    value={formData.exemplo_resposta?.resposta || ''}
                    onChange={(e) =>
                      updateField('exemplo_resposta', {
                        ...formData.exemplo_resposta,
                        resposta: e.target.value,
                      })
                    }
                    className="w-full bg-[#070d18] text-[#dce9f7] px-3 py-2 rounded border border-[#3ddc84]/30 h-20 resize-none"
                  />
                </div>
              ) : (
                <div className="text-sm text-[#a0b0c7] space-y-2">
                  {formData.exemplo_resposta?.pergunta && (
                    <p>
                      <strong>P:</strong> {formData.exemplo_resposta.pergunta}
                    </p>
                  )}
                  {formData.exemplo_resposta?.resposta && (
                    <p>
                      <strong>R:</strong> {formData.exemplo_resposta.resposta}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'perguntas_frequentes':
        return (
          <div className="space-y-4">
            {(formData.items || []).map((item: any, idx: number) => (
              <div key={idx} className="bg-[#1a3f45] rounded p-4 border border-[#2a5f65]">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-[#dce9f7] font-semibold">{item.pergunta}</h4>
                  <button
                    onClick={() => {
                      const newItems = formData.items.filter((_: any, i: number) => i !== idx);
                      updateField('items', newItems);
                    }}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[#a0b0c7] text-sm">{item.resposta}</p>
              </div>
            ))}
            <button
              onClick={() => {
                const newItems = [...(formData.items || []), { pergunta: '', resposta: '' }];
                updateField('items', newItems);
              }}
              className="w-full px-4 py-2 border border-[#3ddc84] text-[#3ddc84] rounded hover:bg-[#3ddc84]/10"
            >
              + Adicionar FAQ
            </button>
          </div>
        );

      case 'politicas':
        return (
          <div className="space-y-6">
            <EditableTags
              label="NUNCA diga"
              tags={formData.nao_pode_dizer || []}
              onChange={(tags) => updateField('nao_pode_dizer', tags)}
            />

            <EditableTags
              label="Regras"
              tags={formData.regras || []}
              onChange={(tags) => updateField('regras', tags)}
            />
          </div>
        );

      case 'produtos_ofertas':
      case 'diferenciais':
        return (
          <div className="text-[#a0b0c7] text-sm">
            <p>Editor de {section} em desenvolvimento</p>
          </div>
        );

      default:
        return (
          <EditableField
            label={section}
            value={JSON.stringify(formData, null, 2)}
            onChange={(v) => {
              try {
                updateField(section, JSON.parse(v));
              } catch {
                // Keep as is
              }
            }}
            isEditing={editingField === section}
            onEditClick={() => setEditingField(section)}
            textarea
          />
        );
    }
  };

  return (
    <div className="bg-[#0E2A2E] rounded border border-[#1a3f45] p-6">
      {renderEditorContent()}

      <div className="mt-6 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#3ddc84] text-[#070d18] font-semibold rounded hover:bg-[#2fc870] disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        <button className="px-4 py-2 border border-[#3ddc84] text-[#3ddc84] rounded hover:bg-[#3ddc84]/10">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  isEditing,
  onEditClick,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isEditing: boolean;
  onEditClick: () => void;
  textarea?: boolean;
}) {
  return (
    <div className="bg-[#1a3f45] rounded p-4 border border-[#2a5f65]">
      <h4 className="text-[#dce9f7] font-semibold mb-2 flex items-center justify-between">
        {label}
        <button
          onClick={onEditClick}
          className="text-[#3ddc84] hover:text-[#2fc870] text-sm"
        >
          ✏️
        </button>
      </h4>
      {isEditing ? (
        textarea ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[#070d18] text-[#dce9f7] px-3 py-2 rounded border border-[#3ddc84]/30 h-24 resize-none"
          />
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[#070d18] text-[#dce9f7] px-3 py-2 rounded border border-[#3ddc84]/30"
          />
        )
      ) : (
        <p className="text-[#a0b0c7] text-sm">{value || 'Não preenchido'}</p>
      )}
    </div>
  );
}

function EditableTags({
  label,
  tags,
  onChange,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const addTag = () => {
    if (input.trim()) {
      onChange([...tags, input.trim()]);
      setInput('');
    }
  };

  return (
    <div className="bg-[#1a3f45] rounded p-4 border border-[#2a5f65]">
      <h4 className="text-[#dce9f7] font-semibold mb-3">{label}</h4>

      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="bg-[#3ddc84]/20 text-[#3ddc84] px-3 py-1 rounded text-sm flex items-center gap-2"
          >
            {tag}
            <button
              onClick={() => onChange(tags.filter((_, i) => i !== idx))}
              className="hover:text-red-400"
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTag()}
          placeholder="Adicionar tag..."
          className="flex-1 bg-[#070d18] text-[#dce9f7] px-3 py-2 rounded border border-[#3ddc84]/30 text-sm"
        />
        <button
          onClick={addTag}
          className="px-3 py-2 bg-[#3ddc84]/20 text-[#3ddc84] rounded hover:bg-[#3ddc84]/30 text-sm"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
