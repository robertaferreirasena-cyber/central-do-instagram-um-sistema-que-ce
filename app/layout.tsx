import type { Metadata } from 'next';
import { Archivo, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const archivo = Archivo({ subsets: ['latin'], weight: ['600', '800', '900'] });
const instrumentSans = Instrument_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '700'] });

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'IA Club';
const brandTagline = process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Conteúdo e atendimento do Instagram, num lugar só';

export const metadata: Metadata = {
  title: brandName,
  description: brandTagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect fill='%230E2A2E' width='32' height='32'/><rect x='8' y='6' width='4' height='20' fill='%23FAFAF8'/><rect x='16' y='8' width='8' height='18' fill='%23D6F24B'/></svg>" />
      </head>
      <body className={instrumentSans.className} style={{ backgroundColor: '#FAFAF8', color: '#0E2A2E' }}>
        <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', color: '#0E2A2E', display: 'flex', flexDirection: 'column' }}>
          <nav style={{ borderBottom: '1px solid #E2E2DE', backgroundColor: '#FAFAF8', position: 'sticky', top: 0, zIndex: 40 }}>
            <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4rem' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: archivo.style.fontFamily }}>
                <span style={{ fontWeight: 900, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>{brandName}</span>
                <div style={{ width: '8px', height: '28px', backgroundColor: '#D6F24B' }} />
              </Link>

              <div style={{ display: 'flex', gap: '2rem' }}>
                <Link href="/content" className="nav-link" style={{ color: '#0E2A2E', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 500, fontFamily: jetBrainsMono.style.fontFamily, letterSpacing: '0.14em', textTransform: 'uppercase', transition: 'color 300ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
                  Conteúdo
                </Link>
                <Link href="/inbox" className="nav-link" style={{ color: '#0E2A2E', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 500, fontFamily: jetBrainsMono.style.fontFamily, letterSpacing: '0.14em', textTransform: 'uppercase', transition: 'color 300ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
                  Atendimento
                </Link>
                <Link href="/knowledge-base" className="nav-link" style={{ color: '#0E2A2E', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 500, fontFamily: jetBrainsMono.style.fontFamily, letterSpacing: '0.14em', textTransform: 'uppercase', transition: 'color 300ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
                  Base
                </Link>
                <Link href="/settings" className="nav-link" style={{ color: '#0E2A2E', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 500, fontFamily: jetBrainsMono.style.fontFamily, letterSpacing: '0.14em', textTransform: 'uppercase', transition: 'color 300ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
                  Config
                </Link>
              </div>
            </div>
          </nav>

          <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem', width: '100%', paddingTop: '3rem', paddingBottom: '3rem', flex: 1 }}>
            {children}
          </main>

          <footer style={{ borderTop: '1px solid #E2E2DE', backgroundColor: '#FAFAF8', marginTop: '4rem', paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem', textAlign: 'center', color: '#7A8B84', fontSize: '0.875rem' }}>
              <p style={{ fontFamily: archivo.style.fontFamily, fontWeight: 700 }}>{brandName}</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Conteúdo e atendimento do Instagram em um único lugar</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
