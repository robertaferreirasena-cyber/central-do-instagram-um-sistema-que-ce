'use client';

import { useState, useRef, useEffect } from 'react';
import { BlockType, BLOCK_ICONS, BLOCK_LABELS } from '@/lib/automacao/types';

interface Props {
  open: boolean;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export function BlockPicker({ open, onSelect, onClose }: Props) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setPosition({ top: rect.top, left: rect.left });
    }
  }, [open]);

  if (!open) return null;

  const blockTypes: BlockType[] = ['text', 'quick_replies', 'collect_data', 'media', 'condition', 'wait', 'tag', 'end_flow'];

  const handleSelect = (type: BlockType) => {
    onSelect(type);
    onClose();
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
        }}
        onClick={onClose}
      />
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          backgroundColor: '#FFFFFF',
          border: '1px solid #D6F24B',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          minWidth: '220px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '0.5rem 0', maxHeight: '400px', overflowY: 'auto' }}>
          {blockTypes.map((type) => (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                textAlign: 'left',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#0E2A2E',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#FAFAF8';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{BLOCK_ICONS[type]}</span>
              <span style={{ fontWeight: 500 }}>{BLOCK_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
