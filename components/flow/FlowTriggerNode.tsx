import { Handle, Position } from '@xyflow/react';

export default function FlowTriggerNode({ data }: any) {
  return (
    <div
      style={{
        backgroundColor: '#D6F24B',
        border: '2px solid #0E2A2E',
        borderRadius: '4px',
        padding: '1rem',
        minWidth: '150px',
        textAlign: 'center',
        color: '#0E2A2E',
        fontWeight: 600,
        fontSize: '0.875rem',
      }}
    >
      {data.label || 'Gatilho'}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
