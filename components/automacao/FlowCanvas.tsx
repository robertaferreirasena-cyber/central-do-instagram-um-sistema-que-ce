'use client';

import { useState } from 'react';
import { AutomacaoBlock, AutomacaoFlow, BlockType } from '@/lib/automacao/types';
import { NodeCard } from './NodeCard';
import { BlockPicker } from './BlockPicker';

interface Props {
  flow: AutomacaoFlow | null;
  onEditBlock: (block: AutomacaoBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddBlockWithType: (type: BlockType) => void;
  onSelectBlockForConfig: (block: AutomacaoBlock) => void;
}

export function FlowCanvas({ flow, onEditBlock, onDeleteBlock, onAddBlockWithType, onSelectBlockForConfig }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState<HTMLButtonElement | null>(null);

  const handleAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setPickerAnchor(e.currentTarget);
    setPickerOpen(true);
  };

  const handleBlockTypeSelect = (type: BlockType) => {
    onAddBlockWithType(type);
    setPickerOpen(false);
  };

  if (!flow) {
    return (
      <div
        style={{
          flex: 1,
          backgroundColor: '#FAFAF8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'radial-gradient(circle, #E2E2DE 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <p style={{ color: '#7A8B84' }}>Selecione um funil ou crie um novo</p>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#FAFAF8',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '2rem',
        backgroundImage: 'radial-gradient(circle, #E2E2DE 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {flow.blocks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#7A8B84', marginBottom: '1rem' }}>Seu fluxo está vazio</p>
            <button
              onClick={handleAddClick}
              style={{
                backgroundColor: '#D6F24B',
                color: '#0E2A2E',
                border: 'none',
                padding: '0.75rem 1.5rem',
                fontWeight: 600,
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              + Adicionar primeiro bloco
            </button>
          </div>
        ) : (
          <>
            {flow.blocks.map((block, idx) => (
              <div key={block.id}>
                {idx > 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      marginTop: '0.5rem',
                      marginBottom: '0.5rem',
                      fontSize: '1.5rem',
                      color: '#D6F24B',
                    }}
                  >
                    ↓
                  </div>
                )}
                <NodeCard
                  block={block}
                  isCondition={block.type === 'condition'}
                  onEdit={() => onEditBlock(block)}
                  onDelete={() => onDeleteBlock(block.id)}
                  onSelectForConfig={() => onSelectBlockForConfig(block)}
                />
              </div>
            ))}

            <button
              onClick={handleAddClick}
              style={{
                width: '100%',
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#FAFAF8',
                border: '2px dashed #D6F24B',
                color: '#0E2A2E',
                cursor: 'pointer',
                fontWeight: 600,
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            >
              + Adicionar bloco
            </button>
          </>
        )}
      </div>

      <BlockPicker
        open={pickerOpen}
        onSelect={handleBlockTypeSelect}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
