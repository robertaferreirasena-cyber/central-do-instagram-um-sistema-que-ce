'use client';
import type { StudioProject } from '@/lib/studio/types';

// Grade de projetos + criar projeto em branco. Só apresenta e emite eventos.
export default function ProjetosGrid(props: {
  projects: StudioProject[];
  newName: string; setNewName: (v: string) => void;
  onCreate: () => void;
  onOpen: (p: StudioProject) => void;
  onDelete: (id: string) => void;
}) {
  const { projects, newName, setNewName, onCreate, onOpen, onDelete } = props;
  return (
    <>
      <style>{`
        .projetos-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        @media (max-width: 768px) {
          .projetos-container {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 12px;
          }
        }
        @media (max-width: 640px) {
          .projetos-container {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
          }
        }
        @media (max-width: 480px) {
          .projetos-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
        }
      `}</style>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 12, color: '#D6F24B' }}>Seus Projetos</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Nome do novo projeto"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') onCreate(); }}
            style={{ flex: 1, minWidth: '180px', maxWidth: '100%', padding: '8px 12px', backgroundColor: '#0a1315', color: '#FAFAF8', border: '1px solid #46655C', borderRadius: 4, fontSize: 13, minHeight: 44 }}
          />
          <button onClick={onCreate}
            style={{ padding: '8px 16px', backgroundColor: '#D6F24B', color: '#0E2A2E', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600, minHeight: 44, whiteSpace: 'nowrap' }}>
            + Novo Projeto
          </button>
        </div>
      </div>

      <div className="projetos-container">
        {projects.map((project) => (
          <div
            key={project.id}
            style={{ backgroundColor: '#0E2A2E', border: '1px solid #46655C', borderRadius: 8, padding: 16, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#D6F24B'; (e.currentTarget as HTMLElement).style.backgroundColor = '#0a1315'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#46655C'; (e.currentTarget as HTMLElement).style.backgroundColor = '#0E2A2E'; }}
            onClick={() => onOpen(project)}
          >
            <h3 style={{ margin: '0 0 8px 0', color: '#D6F24B', fontSize: 14 }}>{project.title}</h3>
            <div style={{ fontSize: 12, color: '#46655C', marginBottom: 12 }}>
              <div>{project.format} • {project.data.slides.length} slide{project.data.slides.length !== 1 ? 's' : ''}</div>
              <div>{new Date(project.updated_at).toLocaleDateString('pt-BR')}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={(e) => { e.stopPropagation(); onOpen(project); }}
                style={{ flex: 1, padding: '6px 12px', backgroundColor: '#46655C', color: '#FAFAF8', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                Editar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                style={{ padding: '6px 12px', backgroundColor: '#8b3333', color: '#FAFAF8', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div style={{ textAlign: 'center', color: '#46655C', padding: 40 }}>
          Nenhum projeto ainda. Crie um para começar!
        </div>
      )}
    </>
  );
}
