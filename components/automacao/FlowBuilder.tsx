'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { AutomacaoFlow, AutomacaoBlock, TriggerConfigState, BlockType } from '@/lib/automacao/types';
import { getTemplate } from '@/lib/automacao/templates';
import { automacaoToFlow, flowToAutomacao } from '@/lib/automacao/flowMap';
import { FunnelList } from './FunnelList';
import { FlowCanvas } from './FlowCanvas';
import { TriggerConfig } from './TriggerConfig';
import { FlowPreview } from './FlowPreview';

export function FlowBuilder() {
  const [flows, setFlows] = useState<AutomacaoFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<AutomacaoFlow | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<AutomacaoBlock | null>(null);
  const [triggerConfig, setTriggerConfig] = useState<TriggerConfigState>({
    postType: 'reel',
    keyword: '',
    respondAll: false,
    humanHandoff: false,
  });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      const res = await fetch('/api/flows');
      if (res.ok) {
        const data = await res.json();
        const automacaoFlows = (data.data || []).map(flowToAutomacao);
        setFlows(automacaoFlows);
      }
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error);
    }
  };

  // Seleciona um funil e carrega o gatilho dele no painel direito.
  const selectFlow = (f: AutomacaoFlow | null) => {
    setSelectedFlow(f);
    setSelectedBlock(null);
    if (f) setTriggerConfig({ postType: 'reel', keyword: f.trigger_value || '', respondAll: !f.trigger_value, humanHandoff: false });
  };

  // Aplica o gatilho editado no painel (keyword / responder-qualquer) ao flow.
  const comGatilho = (f: AutomacaoFlow): AutomacaoFlow => ({
    ...f,
    trigger_value: triggerConfig.respondAll ? '' : triggerConfig.keyword,
  });

  const saveFlow = async () => {
    if (!selectedFlow) return;
    try {
      const flowData = automacaoToFlow(comGatilho(selectedFlow));
      if (!selectedFlow.id) delete (flowData as { id?: number }).id; // novo: deixa o banco atribuir o id
      const res = await fetch('/api/flows', {
        method: selectedFlow.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      });
      if (res.ok) {
        alert('Fluxo salvo como rascunho!');
        loadFlows();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const activateFlow = async () => {
    if (!selectedFlow) return;
    try {
      const flowData = automacaoToFlow(comGatilho(selectedFlow));
      flowData.enabled = true;
      if (!selectedFlow.id) delete (flowData as { id?: number }).id;
      const res = await fetch('/api/flows', {
        method: selectedFlow.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      });
      if (res.ok) {
        alert('Funil ativado!');
        loadFlows();
      }
    } catch (error) {
      console.error('Erro ao ativar:', error);
    }
  };

  const createNewFlow = () => {
    const nome = prompt('Nome do novo funil:');
    if (!nome) return;
    const newFlow: AutomacaoFlow = {
      nome,
      descricao: '',
      trigger_type: 'comment',
      trigger_value: '',
      match_mode: 'contains',
      enabled: false,
      blocks: [],
    };
    selectFlow(newFlow);
    setSelectedBlock(null);
  };

  const createFromTemplate = (templateKey: string) => {
    const template = getTemplate(templateKey);
    if (template) {
      selectFlow(template);
      setSelectedBlock(null);
    }
  };

  const addBlockWithType = (type: BlockType) => {
    if (!selectedFlow) return;
    const newBlock: AutomacaoBlock = {
      id: `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      content: '',
      buttons: [],
    };
    const updated = { ...selectedFlow, blocks: [...selectedFlow.blocks, newBlock] };
    setSelectedFlow(updated);
  };

  const deleteBlock = (blockId: string) => {
    if (!selectedFlow) return;
    const updated = { ...selectedFlow, blocks: selectedFlow.blocks.filter((b) => b.id !== blockId) };
    setSelectedFlow(updated);
    if (selectedBlock?.id === blockId) setSelectedBlock(null);
  };

  const updateBlock = (block: AutomacaoBlock) => {
    if (!selectedFlow) return;
    const idx = selectedFlow.blocks.findIndex((b) => b.id === block.id);
    if (idx === -1) return;
    const blocks = [...selectedFlow.blocks];
    blocks[idx] = block;
    setSelectedFlow({ ...selectedFlow, blocks });
    setSelectedBlock(block);
  };

  return (
    <>
      <style>{`
        .flow-builder-btn {
          min-height: 44px;
          min-width: 44px;
          padding: clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2vw, 1rem) !important;
          font-size: clamp(0.75rem, 1.5vw, 0.875rem);
        }
        @media (max-width: 1024px) {
          .flow-builder-main {
            flex-direction: column !important;
            height: auto !important;
            min-height: calc(100vh - 300px);
          }
        }
      `}</style>
      <PageHeader
        tag="AUTOMAÇÃO"
        title="Automação"
        subtitle="Transforme interação em próxima ação."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="flow-builder-btn"
              onClick={() => setShowPreview(!showPreview)}
              disabled={!selectedFlow || selectedFlow.blocks.length === 0}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #D6F24B',
                color: '#D6F24B',
                cursor: selectedFlow && selectedFlow.blocks.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                opacity: selectedFlow && selectedFlow.blocks.length > 0 ? 1 : 0.5,
              }}
            >
              {showPreview ? '✕ Fechar teste' : '▶️ Testar fluxo'}
            </button>
            <button
              className="flow-builder-btn"
              onClick={saveFlow}
              disabled={!selectedFlow}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #0E2A2E',
                color: '#0E2A2E',
                cursor: selectedFlow ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                opacity: selectedFlow ? 1 : 0.5,
              }}
            >
              Salvar como rascunho
            </button>
            <button
              className="flow-builder-btn"
              onClick={activateFlow}
              disabled={!selectedFlow}
              style={{
                backgroundColor: '#D6F24B',
                color: '#0E2A2E',
                border: 'none',
                cursor: selectedFlow ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                opacity: selectedFlow ? 1 : 0.5,
              }}
            >
              Ativar funil
            </button>
          </div>
        }
      />

      <main className="flow-builder-main" style={{ display: 'flex', height: 'calc(100vh - 200px)', minHeight: '400px', backgroundColor: '#FAFAF8' }}>
        <FunnelList
          flows={flows}
          selected={selectedFlow}
          onSelect={selectFlow}
          onNewFlow={createNewFlow}
          onNewFromTemplate={createFromTemplate}
          onGenerateWithAI={(flow) => selectFlow(flow)}
        />
        <FlowCanvas
          flow={selectedFlow}
          onEditBlock={() => {}}
          onDeleteBlock={deleteBlock}
          onAddBlockWithType={addBlockWithType}
          onSelectBlockForConfig={setSelectedBlock}
        />
        <TriggerConfig
          flow={selectedFlow}
          triggerConfig={triggerConfig}
          onTriggerChange={setTriggerConfig}
          selectedBlock={selectedBlock}
          onBlockChange={updateBlock}
        />
        {showPreview && (
          <FlowPreview
            flow={selectedFlow}
            onClose={() => setShowPreview(false)}
          />
        )}
      </main>
    </>
  );
}
