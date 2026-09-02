import { Handle, Position } from '@xyflow/react';

export default function FlowTextNode({ data }: any) {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E2DE',
        borderRadius: '4px',
        padding: '1rem',
        minWidth: '150px',
        textAlign: 'center',
        color: '#0E2A2E',
        fontWeight: 600,
        fontSize: '0.875rem',
      }}
    >
      <Handle type="target" position={Position.Top} />
      {data.label || 'Mensagem'}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
