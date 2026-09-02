'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
  EdgeTypes,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PageHeader } from '@/components/PageHeader';
import FlowTriggerNode from '@/components/flow/FlowTriggerNode';
import FlowTextNode from '@/components/flow/FlowTextNode';
import FlowConditionNode from '@/components/flow/FlowConditionNode';
import FlowEndNode from '@/components/flow/FlowEndNode';

const nodeTypes: NodeTypes = {
  trigger: FlowTriggerNode,
  text: FlowTextNode,
  condition: FlowConditionNode,
  end: FlowEndNode,
};

export default function AutomacaoPage() {
  const [flows, setFlows] = useState<any[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [triggerConfig, setTriggerConfig] = useState({
    postType: 'reel',
    keyword: '',
    respondAll: false,
    humanHandoff: false,
  });

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      const res = await fetch('/api/flows');
      if (res.ok) {
        const data = await res.json();
        setFlows(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error);
    }
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const selectFlow = (flow: any) => {
    setSelectedFlow(flow);
    // Carrega os nós e arestas do fluxo salvo
    if (flow.steps && Array.isArray(flow.steps)) {
      const newNodes = flow.steps.map((step: any, idx: number) => ({
        id: step.id || `step-${idx}`,
        data: { label: step.type },
        position: { x: 250, y: idx * 100 },
        type: step.type === 'condition' ? 'condition' : step.type === 'end_flow' ? 'end' : 'text',
      }));
      (setNodes as any)(newNodes);
    }
    setTriggerConfig({
      postType: flow.trigger_type === 'reel_comment' ? 'reel' : 'post',
      keyword: flow.trigger_value || '',
      respondAll: false,
      humanHandoff: false,
    });
  };

  const saveFlow = async () => {
    if (!selectedFlow) return;

    const payload = {
      id: selectedFlow.id,
      nome: selectedFlow.nome,
      descricao: selectedFlow.descricao,
      trigger_type: triggerConfig.postType === 'reel' ? 'reel_comment' : 'post_comment',
      trigger_value: triggerConfig.keyword,
      match_mode: 'contains',
      steps: nodes.map((n: any) => ({
        id: n.id,
        type: n.type || 'text',
        content: n.data?.label || '',
      })),
      enabled: selectedFlow.enabled,
    };

    try {
      const res = await fetch('/api/flows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Fluxo salvo com sucesso!');
        loadFlows();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const toggleFlowStatus = async (flowId: number, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/flows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flowId, enabled: !currentStatus }),
      });

      if (res.ok) {
        loadFlows();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const createNewFlow = async () => {
    const nome = prompt('Nome do novo funil:');
    if (!nome) return;

    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          descricao: '',
          trigger_type: 'reel_comment',
          trigger_value: '',
          steps: [
            {
              id: 'trigger-1',
              type: 'text',
              content: 'Bem-vindo!',
            },
          ],
          enabled: false,
        }),
      });

      if (res.ok) {
        const newFlow = await res.json();
        loadFlows();
        selectFlow(newFlow.data);
      }
    } catch (error) {
      console.error('Erro ao criar fluxo:', error);
    }
  };

  return (
    <>
      <PageHeader
        tag="AUTOMAÇÃO"
        title="Automação"
        subtitle="Transforme interação em próxima ação."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => selectedFlow && saveFlow()}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #0E2A2E',
                color: '#0E2A2E',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Salvar como rascunho
            </button>
            <button
              onClick={() => selectedFlow && toggleFlowStatus(selectedFlow.id, selectedFlow.enabled)}
              style={{
                backgroundColor: '#D6F24B',
                color: '#0E2A2E',
                padding: '0.5rem 1rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              {selectedFlow?.enabled ? 'Desativar funil' : 'Ativar funil'}
            </button>
          </div>
        }
      />

      <main style={{ display: 'flex', paddingLeft: '280px', height: 'calc(100vh - 120px)', backgroundColor: '#FAFAF8' }}>
        {/* ESQUERDA: Meus funis */}
        <div
          style={{
            width: '250px',
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E2E2DE',
            overflowY: 'auto',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E', textTransform: 'uppercase' }}>
            Meus funis
          </h3>
          <button
            onClick={createNewFlow}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#D6F24B',
              color: '#0E2A2E',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            + Novo funil
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {flows.map((flow) => (
              <div
                key={flow.id}
                onClick={() => selectFlow(flow)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: selectedFlow?.id === flow.id ? '#F0F0ED' : '#FAFAF8',
                  border: selectedFlow?.id === flow.id ? '2px solid #D6F24B' : '1px solid #E2E2DE',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E' }}>
                      {flow.nome}
                    </p>
                    <span
                      style={{
                        display: 'inline-block',
                        backgroundColor: flow.enabled ? '#D6F24B' : '#E2E2DE',
                        color: flow.enabled ? '#0E2A2E' : '#7A8B84',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                      }}
                    >
                      {flow.enabled ? 'Ativo' : 'Rascunho'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTRO: Canvas de nós (React Flow) */}
        <div style={{ flex: 1, backgroundColor: '#FAFAF8', backgroundImage: 'radial-gradient(circle, #E2E2DE 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          {selectedFlow ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p style={{ color: '#7A8B84' }}>Selecione um funil ou crie um novo</p>
            </div>
          )}
        </div>

        {/* DIREITA: Configuração do gatilho */}
        {selectedFlow && (
          <div
            style={{
              width: '280px',
              backgroundColor: '#FFFFFF',
              borderLeft: '1px solid #E2E2DE',
              overflowY: 'auto',
              padding: '1.5rem',
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E', textTransform: 'uppercase' }}>
              Configuração do gatilho
            </h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E' }}>
                Post/Reel
              </label>
              <select
                value={triggerConfig.postType}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, postType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #E2E2DE',
                  fontSize: '0.875rem',
                  color: '#0E2A2E',
                }}
              >
                <option value="post">Post</option>
                <option value="reel">Reel</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E' }}>
                Palavra-chave
              </label>
              <input
                type="text"
                value={triggerConfig.keyword}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, keyword: e.target.value })}
                placeholder="Ex: LINK, MAIS_INFO"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #E2E2DE',
                  fontSize: '0.875rem',
                  color: '#0E2A2E',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={triggerConfig.respondAll}
                  onChange={(e) => setTriggerConfig({ ...triggerConfig, respondAll: e.target.checked })}
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
                  onChange={(e) => setTriggerConfig({ ...triggerConfig, humanHandoff: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: '#0E2A2E' }}>Transferência para atendimento humano</span>
              </label>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
