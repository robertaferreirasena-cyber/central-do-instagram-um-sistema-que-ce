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
import { avisosDoGrafo, contarPendencias, type ValidacaoGrafo } from '@/lib/flowValidation';
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
  const [validacao, setValidacao] = useState<ValidacaoGrafo>({ avisos: [], pendencias: 0, temErros: false });

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
    // Carrega os nós do fluxo salvo
    if (flow.steps && Array.isArray(flow.steps)) {
      const newNodes = flow.steps.map((step: any, idx: number) => ({
        id: step.id || `step-${idx}`,
        data: { label: step.type },
        position: { x: step.x || 250, y: step.y || idx * 100 },
        type: step.type === 'condition' ? 'condition' : step.type === 'end_flow' ? 'end' : 'text',
      }));
      (setNodes as any)(newNodes);
    }
    // Carrega as arestas do fluxo salvo (edges: {from, handle, to})
    if (flow.edges && Array.isArray(flow.edges)) {
      const newEdges = flow.edges.map((edge: any) => ({
        id: `${edge.from}-${edge.to}-${edge.handle}`,
        source: edge.from,
        target: edge.to,
        sourceHandle: edge.handle,
      }));
      (setEdges as any)(newEdges);
    } else {
      (setEdges as any)([]);
    }
    setTriggerConfig({
      postType: flow.trigger_type === 'reel_comment' ? 'reel' : 'post',
      keyword: flow.trigger_value || '',
      respondAll: false,
      humanHandoff: false,
    });
    // Calcula avisos do fluxo
    const triggerData = {
      trigger_type: flow.trigger_type,
      trigger_value: flow.trigger_value,
    };
    setValidacao(avisosDoGrafo(flow, triggerData));
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
        x: Math.round(n.position?.x || 0),
        y: Math.round(n.position?.y || 0),
      })),
      edges: edges.map((e: any) => ({
        from: e.source,
        handle: e.sourceHandle || 'next',
        to: e.target,
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

  const importDirectProFlows = async () => {
    try {
      const res = await fetch('/api/flows/import-directpro', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Importados ${data.flows?.length || 0} fluxos prontos! Todos em rascunho.`);
        loadFlows();
      } else {
        const error = await res.json();
        alert('Erro ao importar: ' + error.error);
      }
    } catch (error) {
      console.error('Erro ao importar fluxos:', error);
      alert('Erro ao importar fluxos');
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

      <main style={{ display: 'flex', height: 'calc(100vh - 120px)', backgroundColor: '#FAFAF8' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
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
              }}
            >
              + Novo funil
            </button>
            <button
              onClick={importDirectProFlows}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'transparent',
                color: '#0E2A2E',
                border: '1px solid #0E2A2E',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Importar modelos prontos
            </button>
          </div>

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
            {/* Avisos */}
            {validacao.avisos.length > 0 && (
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #E2E2DE' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', fontWeight: 600, color: '#0E2A2E', textTransform: 'uppercase' }}>
                  Pendências [{validacao.pendencias}]
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {validacao.avisos.map((aviso, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor:
                          aviso.tipo === 'erro' ? '#FFE5E5' : aviso.tipo === 'aviso' ? '#FFF4E5' : '#E5F4FF',
                        border:
                          aviso.tipo === 'erro' ? '1px solid #FFB3B3' : aviso.tipo === 'aviso' ? '1px solid #FFCE99' : '1px solid #99D6FF',
                        padding: '0.5rem',
                        borderRadius: 0,
                        fontSize: '0.7rem',
                        color:
                          aviso.tipo === 'erro' ? '#8B0000' : aviso.tipo === 'aviso' ? '#664400' : '#004488',
                        lineHeight: '1.3',
                      }}
                    >
                      {aviso.mensagem}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
