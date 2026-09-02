import Link from 'next/link';

interface HomeCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  cta: string;
}

export function HomeCard({ href, icon, title, description, cta }: HomeCardProps) {
  return (
    <Link
      href={href}
      className="home-card-link"
      style={{
        display: 'block',
        backgroundColor: 'white',
        border: '1px solid #E2E2DE',
        padding: '1.5rem',
        textDecoration: 'none',
        transition: 'border-color 300ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '1.875rem' }}>{icon}</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0E2A2E', margin: 0 }}>{title}</h2>
        <p style={{ color: '#7A8B84', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
          {description}
        </p>
        <div style={{ paddingTop: '0.5rem', color: '#D6F24B', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
          {cta} →
        </div>
      </div>
    </Link>
  );
}
