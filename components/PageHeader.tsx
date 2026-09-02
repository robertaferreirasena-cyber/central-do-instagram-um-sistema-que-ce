import { JetBrains_Mono, Archivo } from 'next/font/google';

const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '700'] });
const archivo = Archivo({ subsets: ['latin'], weight: ['600', '800', '900'] });

interface PageHeaderProps {
  tag?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ tag, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div style={{ borderBottom: '1px solid #E2E2DE', backgroundColor: '#FAFAF8', paddingBottom: '2rem', width: '100%' }}>
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          {tag && (
            <div style={{ fontFamily: jetBrainsMono.style.fontFamily, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7A8B84', marginBottom: '0.5rem' }}>
              {tag}
            </div>
          )}
          <h1 style={{ fontFamily: archivo.style.fontFamily, fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0, color: '#0E2A2E' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.95rem', color: '#7A8B84', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
