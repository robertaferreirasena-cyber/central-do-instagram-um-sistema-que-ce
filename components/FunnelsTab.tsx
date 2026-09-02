'use client';

import { useState, useEffect } from 'react';

interface NodeData {
  id: string;
  data: { label: string };
  position: { x: number; y: number };
  type: string;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
}

interface FunnelGraph {
  id: string;
  nome: string;
  status: 'rascunho' | 'ativo' | 'pausado';
  graph_json: { nodes: NodeData[]; edges: EdgeData[] };
  versao: number;
}

const NODE_TYPES = [
  { value: 'gatilho', label: '🔔 Gatilho' },
  { value: 'mensagem', label: '💬 Mensagem' },
  { value: 'espera', label: '⏳ Espera' },
  { value: 'condicao', label: '❓ Condição' },
  { value: 'pergunta', label: '❔ Pergunta/Salvar' },
  { value: 'tag', label: '🏷️ Tag' },
  { value: 'score', label: '⭐ Score' },
  { value: 'agente', label: '🤖 Agente' },
  { value: 'whatsapp', label: '📱 WhatsApp' },
  { value: 'vendedor', label: '👤 Vendedor' },
  { value: 'humano', label: '👨 Humano' },
  { value: 'encerramento', label: '✅ Encerramento' },
];

export function FunnelsTab() {
  const [funnels, setFunnels] = useState<FunnelGraph[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<FunnelGraph | null>(null);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFunnelName, setNewFunnelName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFunnels();
  }, []);

  async function fetchFunnels() {
    setLoading(true);
    try {
      const res = await fetch('/api/instagram/funnels');
      const data = await res.json();
      if (data.success && data.data) {
        setFunnels(data.data);
        if (data.data.length > 0) {
          loadFunnel(data.data[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar funis:', err);
    } finally {
      setLoading(false);
    }
  }

  function loadFunnel(funnel: FunnelGraph) {
    setSelectedFunnel(funnel);
    const graph = funnel.graph_json || { nodes: [], edges: [] };
    setNodes(Array.isArray(graph.nodes) ? graph.nodes : []);
    setEdges(Array.isArray(graph.edges) ? graph.edges : []);
  }

  async function createNewFunnel() {
    if (!newFunnelName.trim()) return;
    try {
      const res = await fetch('/api/instagram/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newFunnelName }),
      });
      const data = await res.json();
      if (data.success) {
        setNewFunnelName('');
        setIsCreatingNew(false);
        fetchFunnels();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao criar funil: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  }

  async function saveFunnel() {
    if (!selectedFunnel) return;
    try {
      const res = await fetch(`/api/instagram/funnels/${selectedFunnel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graph_json: { nodes, edges },
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Funil salvo com sucesso');
        fetchFunnels();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao salvar: ' + (err instanceof Error ? err.message : 'Unknown'));
    }
  }

  function addNode(type: string) {
    const newNode: NodeData = {
      id: `${type}-${Date.now()}`,
      data: { label: NODE_TYPES.find(n => n.value === type)?.label || type },
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      type: 'default',
    };
    setNodes([...nodes, newNode]);
  }

  function connectNodes(sourceId: string, targetId: string) {
    const edgeId = `edge-${sourceId}-${targetId}-${Date.now()}`;
    const newEdge: EdgeData = { id: edgeId, source: sourceId, target: targetId };
    setEdges([...edges, newEdge]);
  }

  function simulateJourney() {
    if (!selectedFunnel) return;
    alert('Simulação de percurso: ' + selectedFunnel.nome + '\nNós: ' + nodes.length + ' | Conexões: ' + edges.length);
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 200px)', gap: '1rem' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', borderRight: '1px solid #ddd', overflowY: 'auto', padding: '1rem' }}>
        <h3>Funis ({funnels.length})</h3>

        {isCreatingNew ? (
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Nome do funil"
              value={newFunnelName}
              onChange={(e) => setNewFunnelName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
              }}
            />
            <button
              onClick={createNewFunnel}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#29b6ff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '0.5rem',
              }}
            >
              Criar
            </button>
            <button
              onClick={() => setIsCreatingNew(false)}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingNew(true)}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#3ddc84',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '1rem',
            }}
          >
            + Novo Funil
          </button>
        )}

        {funnels.map((funnel) => (
          <div
            key={funnel.id}
            onClick={() => loadFunnel(funnel)}
            style={{
              padding: '0.75rem',
              border: selectedFunnel?.id === funnel.id ? '2px solid #29b6ff' : '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '0.5rem',
              background: selectedFunnel?.id === funnel.id ? '#e3f2fd' : '#fff',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{funnel.nome}</div>
            <div style={{ fontSize: '0.75rem', color: '#999' }}>v{funnel.versao}</div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.7rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '3px',
                marginTop: '0.25rem',
                background: funnel.status === 'ativo' ? '#3ddc84' : '#ccc',
                color: '#fff',
              }}
            >
              {funnel.status}
            </span>
          </div>
        ))}

        {selectedFunnel && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Paleta de Nós</h4>
            {NODE_TYPES.map((nodeType) => (
              <button
                key={nodeType.value}
                onClick={() => addNode(nodeType.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem',
                  marginBottom: '0.25rem',
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  textAlign: 'left',
                }}
              >
                {nodeType.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedFunnel ? (
          <>
            <div style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{selectedFunnel.nome}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={saveFunnel}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#29b6ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  💾 Salvar
                </button>
                <button
                  onClick={simulateJourney}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#9c27b0',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  ▶️ Simular
                </button>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  📤 Publicar
                </button>
              </div>
            </div>
            <div style={{ flex: 1, background: '#fafafa', border: '1px solid #ddd', borderRadius: '8px', position: 'relative', overflow: 'auto' }}>
              {nodes.length > 0 ? (
                <div style={{ padding: '2rem', position: 'relative' }}>
                  <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '1rem' }}>
                    Canvas de Funil (Em construção — {nodes.length} nós, {edges.length} conexões)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {nodes.map((node) => (
                      <div
                        key={node.id}
                        style={{
                          padding: '1rem',
                          border: '1px solid #29b6ff',
                          borderRadius: '4px',
                          background: '#e3f2fd',
                          cursor: 'grab',
                          minWidth: '150px',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{node.data.label}</div>
                        <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.5rem' }}>ID: {node.id.slice(0, 10)}...</div>
                      </div>
                    ))}
                  </div>
                  {edges.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Conexões:</div>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.75rem', color: '#666' }}>
                        {edges.map((edge) => (
                          <li key={edge.id}>{edge.source} → {edge.target}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                  Adicione nós da paleta ao lado para começar a construir o funil
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
            {loading ? 'Carregando funis...' : 'Nenhum funil criado. Crie um novo para começar.'}
          </div>
        )}
      </div>
    </div>
  );
}
