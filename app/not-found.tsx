import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', paddingTop: '4rem', paddingBottom: '4rem' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>404</h1>
      <p style={{ color: '#7A8B84', marginTop: '1rem', marginBottom: '2rem' }}>Página não encontrada</p>
      <Link href="/" style={{ color: '#D6F24B', textDecoration: 'none', fontWeight: 500 }}>
        Voltar para home
      </Link>
    </div>
  );
}
