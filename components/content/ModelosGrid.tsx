'use client';
import StudioThumbnail from '@/components/studio/StudioThumbnail';
import type { StudioTemplate } from '@/lib/studio/types';

// Aba "Modelos": grade de templates renderizados. Clicar usa o modelo.
export default function ModelosGrid(props: {
  templates: StudioTemplate[];
  onUse: (tpl: StudioTemplate) => void;
}) {
  const { templates, onUse } = props;
  return (
    <>
      <style>{`
        .modelos-container {
          padding: clamp(1rem, 4vw, 1.5rem);
        }
        .modelos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }
        @media (max-width: 768px) {
          .modelos-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 10px;
          }
        }
        @media (max-width: 640px) {
          .modelos-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 8px;
          }
        }
        @media (max-width: 480px) {
          .modelos-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
        }
      `}</style>
      <div className="modelos-container">
        <h2 style={{ marginTop: 0, marginBottom: 16, color: '#D6F24B' }}>Modelos de Post</h2>
        <div className="modelos-grid">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            style={{ backgroundColor: '#0E2A2E', border: '1px solid #46655C', borderRadius: 8, padding: 12, textAlign: 'center', cursor: 'pointer' }}
            onClick={() => onUse(tpl)}
          >
            <div style={{ width: '100%', aspectRatio: '4 / 5', overflow: 'hidden', background: '#000', marginBottom: 8 }}>
              <StudioThumbnail template={tpl.template_json} width={200} />
            </div>
            <h4 style={{ margin: 0, marginBottom: 4, color: '#D6F24B', fontSize: 13 }}>{tpl.name}</h4>
            <div style={{ fontSize: 11, color: '#46655C' }}>{tpl.category}</div>
          </div>
        ))}
        </div>
      </div>
    </>
  );
}
