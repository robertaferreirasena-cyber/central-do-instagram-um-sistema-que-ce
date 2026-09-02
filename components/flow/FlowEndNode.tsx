import { Handle, Position } from '@xyflow/react';

export default function FlowEndNode({ data }: any) {
  return (
    <div
      style={{
        backgroundColor: '#7A8B84',
        border: '2px solid #0E2A2E',
        borderRadius: '50%',
        width: '100px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontWeight: 600,
        fontSize: '0.75rem',
        textAlign: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} />
      {data.label || 'Encerrar'}
    </div>
  );
}
