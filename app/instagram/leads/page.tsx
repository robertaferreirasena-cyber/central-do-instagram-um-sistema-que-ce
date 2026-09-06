'use client';
import { LeadsTab } from '@/components/LeadsTab';

// Seção focada: só Leads (o menu lateral é a navegação; sem barra de abas).
export default function LeadsPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: 1280, margin: '0 auto' }}>
      <LeadsTab />
    </div>
  );
}
