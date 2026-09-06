'use client';

import { AutomacaoBlock, BLOCK_ICONS, BLOCK_LABELS } from '@/lib/automacao/types';

interface Props {
  block: AutomacaoBlock;
  isCondition?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSelectForConfig: () => void;
}

export function NodeCard({ block, isCondition, onEdit, onDelete, onSelectForConfig }: Props) {
  const icon = BLOCK_ICONS[block.type];
  const label = BLOCK_LABELS[block.type];

  if (isCondition && block.type === 'condition') {
    return (
      <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
        {/* Losango condicional */}
        <div
          style={{
            position: 'relative',
            width: '140px',
            height: '140px',
            margin: '0 auto',
            cursor: 'pointer',
          }}
          onClick={onSelectForConfig}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '70px solid transparent',
              borderRight: '70px solid transparent',
              borderTop: '70px solid #D6F24B',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '70px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '70px solid transparent',
              borderRight: '70px solid transparent',
              borderBottom: '70px solid #D6F24B',
            }}
          />
          <p
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              margin: 0,
              textAlign: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#0E2A2E',
              width: '100px',
            }}
          >
            {block.condition_field === 'button' ? 'Pessoa clicou' : block.condition_field || 'Condição'}?
          </p>
        </div>

        {/* Ramo SIM */}
        <div style={{ flex: 1, minWidth: '150px' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#7A8B84', marginBottom: '0.5rem' }}>SIM ↓</p>
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#FAFAF8',
              border: '1px solid #E2E2DE',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#0E2A2E',
            }}
          >
            {block.yes_step ? '✓ conectado' : 'conectar bloco'}
          </div>
        </div>

        {/* Ramo NÃO */}
        <div style={{ flex: 1, minWidth: '150px' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#7A8B84', marginBottom: '0.5rem' }}>NÃO ↓</p>
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#FAFAF8',
              border: '1px solid #E2E2DE',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#0E2A2E',
            }}
          >
            {block.no_step ? '✓ conectado' : 'conectar bloco'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelectForConfig}
      style={{
        padding: '1rem',
        backgroundColor: '#FFFFFF',
        border: '2px solid #D6F24B',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginTop: '1.5rem',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(214, 242, 75, 0.2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E', flex: 1 }}>{label}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#C0442E',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
          }}
        >
          ✕
        </button>
      </div>

      {block.content && (
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#7A8B84', lineHeight: '1.4' }}>
          {block.content.length > 100 ? `${block.content.slice(0, 100)}...` : block.content}
        </p>
      )}

      {block.buttons && block.buttons.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {block.buttons.map((btn, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                backgroundColor: '#D6F24B',
                color: '#0E2A2E',
                padding: '0.25rem 0.5rem',
                fontSize: '0.65rem',
                fontWeight: 600,
                borderRadius: '3px',
              }}
            >
              {btn.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
