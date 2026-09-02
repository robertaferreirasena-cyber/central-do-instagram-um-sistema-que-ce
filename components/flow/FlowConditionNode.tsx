import { Handle, Position } from '@xyflow/react';

export default function FlowConditionNode({ data }: any) {
  return (
    <div
      style={{
        width: '120px',
        height: '120px',
        backgroundColor: '#0E2A2E',
        border: '2px solid #D6F24B',
        transform: 'rotate(45deg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#D6F24B',
        fontWeight: 600,
        fontSize: '0.75rem',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ transform: 'rotate(-45deg)', padding: '0.5rem' }}>
        {data.label || 'Condição'}
      </div>
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
