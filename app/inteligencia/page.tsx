'use client';

import { PageHeader } from '@/components/PageHeader';
import FilaAprovacao from '@/components/fila-aprovacao';

export default function InteligenciaPage() {
  return (
    <div className="w-full">
      <PageHeader
        title="Aprovações"
        subtitle="Revise e aprove as sugestões do agente antes de enviar"
      />

      <div className="p-6">
        <FilaAprovacao />
      </div>
    </div>
  );
}
