import { HomeCard } from '@/components/HomeCard';

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'IA Club';
const brandTagline = process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Conteúdo e atendimento do Instagram, num lugar só';

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>{brandName}</h1>
        <p style={{ color: '#7A8B84', fontSize: '1.125rem' }}>{brandTagline}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <HomeCard
          href="/content"
          icon="📝"
          title="Conteúdo"
          description="Crie, aprove e agende posts. Mantenha seu calendário editorial organizado."
          cta="Gerenciar"
        />

        <HomeCard
          href="/inbox"
          icon="💬"
          title="Atendimento"
          description="Automatize respostas com IA ou encaminhe para humano. Nunca perca um lead."
          cta="Responder"
        />

        <HomeCard
          href="/knowledge-base"
          icon="📚"
          title="Base de Conhecimento"
          description="Mantenha perguntas e respostas para treinar a IA de atendimento."
          cta="Editar"
        />

        <HomeCard
          href="/settings"
          icon="⚙️"
          title="Configurações"
          description="Conecte seus serviços de publicação, atendimento e CRM com segurança."
          cta="Configurar"
        />
      </div>

      <div style={{ backgroundColor: '#14383D', border: '1px solid #0E2A2E', color: '#FAFAF8', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Configuração necessária</h3>
        <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: 0 }}>Antes de usar o sistema:</p>
        <ul style={{ fontSize: '0.875rem', marginTop: '0.75rem', marginLeft: '1rem', listStyleType: 'disc', opacity: 0.9, paddingLeft: '1rem' }}>
          <li>Configure API keys no .env (Publora, Zernio, Claude)</li>
          <li>Conecte sua conta do Instagram via Publora</li>
          <li>Configure webhook de Zernio para receber mensagens</li>
          <li>Crie itens na Base de Conhecimento para respostas automáticas</li>
        </ul>
      </div>
    </div>
  );
}
