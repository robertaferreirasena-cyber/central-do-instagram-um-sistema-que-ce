'use client';
import { AgentesTab } from '@/components/AgentesTab';

// Seção focada: só Agentes.
export default function AgentesPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: 1280, margin: '0 auto' }}>
      <AgentesTab />
    </div>
  );
}
